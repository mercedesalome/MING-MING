const express = require('express');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');

app.use(bodyParser.json());

// Health check
app.get('/health', (req, res) => res.send({ ok: true, service: 'Ming Ming Stripe backend ✅' }));

// Test route
app.get('/test', (req, res) => res.send('Test route works!'));

// Subscription creation route
app.post('/api/subscription/create', async (req, res) => {
    const { userId, email, priceId } = req.body;

    try {
        const customer = await stripe.customers.create({ email });
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent'],
        });

        res.json({
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
            subscriptionId: subscription.id
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Stripe webhook route
app.post('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'checkout.session.completed':
        case 'invoice.paid':
        case 'invoice.payment_failed':
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            console.log(`Received event: ${event.type}`);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
