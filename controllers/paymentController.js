const Show = require('../models/show');
const Dealer = require('../models/dealer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// create stripe checkout session
exports.create_checkout_session = async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${req.body.name} - Table Rent (includes $5 convenience fee)`,
        },
        unit_amount: (req.body.rent_due * 100) + 500,
      },
      quantity: 1,
    }],
    metadata: {
      email: req.body.email,
      id: req.body.id,
    },
    mode: 'payment',
    success_url: `${process.env.AUTH0_BASE_URL}/payment-confirmation`,
    cancel_url: `${process.env.AUTH0_BASE_URL}/payment-unsuccessful`
  });

  res.redirect(303, session.url);
}

// update payment status in db
exports.save_payment = async (req, res) => {
  const id = req.body.id;
  const email = req.body.email;

  await Show.findOneAndUpdate(
    { _id: id },
    { $set: { 'dealer_rsvp_list.$[el].paid': true } },
    { arrayFilters: [{ 'el.email': email }] }
  )
    .catch((err) => {
      console.log(err);
      res.render('error', { userName: req.oidc.user.name, userEmail: req.oidc.user.email });
    });

  await Dealer.findOneAndUpdate(
    { email: email },
    { $set: { 'shows.$[el].paid': true } },
    { arrayFilters: [{ 'el.id': id }] }
  )
    .catch((err) => {
      console.log(err);
      res.render('error', { userName: req.oidc.user.name, userEmail: req.oidc.user.email });
    });

  res.redirect('/payment-confirmation');
}