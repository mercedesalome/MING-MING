const express = require('express');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.get('/health', (req, res) => res.send('Server is healthy!'));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
