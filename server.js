const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Configuration
const supabaseUrl = 'https://fzvpikfcglioodxdsxym.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.SQUARESPACE_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Verify webhook signature
function verifyWebhookSignature(payload, signature) {
  if (!webhookSecret) return false;
  
  const cleanSecret = webhookSecret.replace('whsec_', '');
  const expectedSignature = crypto
    .createHmac('sha256', cleanSecret)
    .update(payload)
    .digest('hex');
  
  const cleanSignature = signature.replace('sha256=', '').replace('whsec_', '');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

// Find user by email
async function findUserByEmail(email) {
  try {
    const { data: users } = await supabase.auth.admin.listUsers();
    return users.users.find(u => u.email === email);
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

// Activate subscription
async function activateSubscription(userId, email) {
  try {
    const subscriptionData = {
      user_id: userId,
      status: 'active',
      plan_id: 'seller_account',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()
      .single();

    console.log('✅ Subscription activated for:', email);
    return { data, error };
  } catch (error) {
    console.error('❌ Error activating subscription:', error);
    return { data: null, error };
  }
}

// Main webhook endpoint
app.post('/webhook/squarespace', async (req, res) => {
  try {
    console.log('📥 Webhook received');
    
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-squarespace-signature'];

    // Verify signature
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      console.log('❌ Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;
    console.log('📋 Event type:', payload.eventType);
    console.log('📋 Order status:', payload.data?.orderStatus);
    
    // Only process order events
    if (payload.eventType !== 'order.create' && payload.eventType !== 'order.update') {
      console.log('⏭️ Ignoring non-order event');
      return res.status(200).json({ message: 'Event ignored' });
    }

    // Only process completed orders
    if (payload.data.orderStatus !== 'FULFILLED' && payload.data.orderStatus !== 'PENDING_FULFILLMENT') {
      console.log('⏭️ Order not completed yet');
      return res.status(200).json({ message: 'Order not completed' });
    }

    // Check if this is a seller account order
    const isSellerOrder = payload.data.lineItems.some(item => 
      item.productName.toLowerCase().includes('seller') || 
      item.productName.toLowerCase().includes('ming ming') ||
      item.productName.toLowerCase().includes('subscription')
    );

    if (!isSellerOrder) {
      console.log('⏭️ Not a seller account order');
      return res.status(200).json({ message: 'Not a seller account order' });
    }

    console.log('💰 Processing seller account payment for:', payload.data.customerEmail);

    // Find user and activate subscription
    const user = await findUserByEmail(payload.data.customerEmail);
    
    if (!user) {
      console.error('❌ User not found:', payload.data.customerEmail);
      return res.status(404).json({ error: 'User not found' });
    }

    // Activate subscription
    const result = await activateSubscription(user.id, user.email);
    
    if (result.error) {
      console.error('❌ Failed to activate subscription:', result.error);
      return res.status(500).json({ error: 'Failed to activate subscription' });
    }

    console.log('🎉 Successfully processed payment for:', user.email);
    
    return res.status(200).json({ 
      message: 'Subscription activated successfully',
      userId: user.id,
      email: user.email
    });

  } catch (error) {
    console.error('💥 Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Ming Ming webhook server is running'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Ming Ming Webhook Server',
    endpoints: {
      webhook: '/webhook/squarespace',
      health: '/health'
    }
  });
});

// ✅ Correct port usage for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Ming Ming webhook server running on port ${PORT}`);
});
