const Show = require('../models/show');
const Dealer = require('../models/dealer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');

// create stripe checkout session
exports.create_checkout_session = async (req, res) => {
  const name = req.session.name;
  const email = req.session.email;
  const id = req.body.id;
  try {
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
      // use metadata when implementing checkout session completed webhook
      metadata: {
        email: email,
        id: id,
      },
      mode: 'payment',
      success_url: `${process.env.AUTH0_BASE_URL}/payment-confirmation/${email}/${id}`,
      cancel_url: `${process.env.AUTH0_BASE_URL}/payment-unsuccessful`
    });
  
    res.redirect(303, session.url);
  } catch(e) {
      console.log(e);
      res.render('error', {
        userName: name,
        userEmail: email
      });
  } 
}

// update payment status in db
exports.payment_conformation = async (req, res) => {
  const id = req.params.id;
  const email = req.params.email;
  const objectId = new mongoose.Types.ObjectId(id);

  await Show.findOneAndUpdate(
    { _id: objectId },
    { $set: { ['dealer_rsvp_list.$[el].paid']: true } },
    {
      arrayFilters: [{ 'el.email': email }], 
      new: true
    }
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
    { arrayFilters: [{ 'el.id': id }],
      new: true
    }
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