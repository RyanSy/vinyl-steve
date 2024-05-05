const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const domain = process.env.AUTH0_BASE_URL;
const stripePriceId = process.env.STRIPE_PRICE_ID; 

exports.rsvp_pay_now = async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
            price: stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${domain}/payment-confirmation`,
        cancel_url: `${domain}/payment-canceled`,
    });

    res.redirect(303, session.url);
}

exports.payment_confirmation = (req, res) => {
    res.render('payment-confirmation');
}

exports.payment_canceled = (req, res) => {
    res.render('payment-canceled');
}