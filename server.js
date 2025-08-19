const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Read Stripe key from environment
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("⚠️ STRIPE_SECRET_KEY is missing in environment variables!");
} else {
  console.log("✅ STRIPE_SECRET_KEY detected.");
}

const stripe = require('stripe')(stripeKey);

app.use(bodyParser.json());

// Health check
app.get('/health', (req, res) => {
  res.send({ ok: true, service: 'Ming Ming Stripe backend ✅' });
});

// Test route
app.get('/test', (req, res) => {
  res.send('Test route works!');
});

// Subscription creation route
app.post('/api/subscription/create', async (req, res) => {
  try {
    const { email, planType } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Determine price ID
    let priceId;
    if (planType === 'yearly') {
      priceId = process.env.YEARLY_PRICE_ID;
    } else {
      priceId = process.env.MONTHLY_PRICE_ID;
    }

    if (!priceId) {
      return res.status(500).json({ error: 'Price ID is missing in environment variables' });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({ email });
    console.log('Customer created:', customer.id);

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    console.log('Subscription created:', subscription.id);

    res.json({
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      subscriptionId: subscription.id
    });

  } catch (err) {
    console.error('Subscription creation failed:', err);
    res.status(500).json({ error: err.message, details: err.raw || err });
  }
});

// Stripe webhook route
app.post('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received event:', event.type);
  res.json({ received: true });
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
