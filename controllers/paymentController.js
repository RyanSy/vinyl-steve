const Show = require('../models/show');
const Dealer = require('../models/dealer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');

// create stripe checkout session
exports.create_checkout_session = async (req, res) => {
  const email = req.body.email;
  const id = req.body.id;
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
      email: email,
      id: id,
    },
    mode: 'payment',
    success_url: `${process.env.AUTH0_BASE_URL}/payment-confirmation/${email}/${id}`,
    cancel_url: `${process.env.AUTH0_BASE_URL}/payment-unsuccessful`
  });

  res.redirect(303, session.url);
}

// update payment status in db
exports.payment_conformation = async (req, res) => {
  const id = req.params.id;
  const email = req.params.email;
  const objectId = new mongoose.Types.ObjectId(id);

  console.log(id)
  console.log(email)
  console.log(objectId)

  await Show.findOneAndUpdate(
      { _id: objectId },
      { $set: { ['dealer_rsvp_list.$[el].paid']: true } },
      { arrayFilters: [{ 'el.email': email }] }
    )
    // .then(updatedShow => {
    //   console.log('updatedShow:', updatedShow);
    // })
    .catch((err) => {
      console.log(err);
      res.render('error', { userName: req.oidc.user.name, userEmail: req.oidc.user.email });
    });

  await Dealer.findOneAndUpdate(
      { email: email },
      { $set: { ['shows.$[el].paid']: true } },
      { arrayFilters: [{ 'el.id': id }] }
    )
    // .then(updatedDealer => {
    //   console.log('updatedDealer:', updatedDealer);
    // })
    .catch((err) => {
      console.log(err);
      res.render('error', { userName: req.oidc.user.name, userEmail: req.oidc.user.email });
    });

  res.render('payment-confirmation');
}