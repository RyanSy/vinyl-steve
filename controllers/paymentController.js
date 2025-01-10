const Show = require('../models/show');
const Dealer = require('../models/dealer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.create_checkout_session = async (req, res) => {
    console.log('req.body', req.body);
    const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Table Rent',
            },
            unit_amount: 10500,
          },
          quantity: 1,
        }],
        mode: 'payment',
        ui_mode: 'embedded',
        return_url: `${process.env.AUTH0_BASE_URL}/payment-processing/:{CHECKOUT_SESSION_ID}`
      });
    
      res.send({clientSecret: session.client_secret});
}

// update payment status in db
exports.save_payment = async (req, res) => {
    const id = req.body.id;
    const email = req.body.email;

    await Show.findOneAndUpdate(
        { _id: id} ,
        { $set: {'dealer_rsvp_list.$[el].paid': true} },
        { arrayFilters: [ { 'el.email': email }] }
    )
    .catch((err) => {
        console.log(err);
        res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
    });

    await Dealer.findOneAndUpdate(
        { email: email },
        { $set: {'shows.$[el].paid': true } },
        { arrayFilters: [{ 'el.id': id }] }
    )
    .catch((err) => {
        console.log(err);
        res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
    });

    res.redirect('/payment-confirmation');
}