const Show = require('../models/show');
const Dealer = require('../models/dealer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_SERVER,
    port: process.env.BREVO_SMTP_PORT,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.BREVO_LOGIN,
        pass: process.env.BREVO_SMTP_KEY,
    },
});


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
  const dealerEmail = req.params.email;
  const objectId = new mongoose.Types.ObjectId(id);
  let showName;
  let showDate;
  let dealerName;
  let rentDue;
  let totalAmountPaid;

  // update show
  await Show.findOneAndUpdate(
    { _id: objectId },
    { $set: { ['dealer_rsvp_list.$[el].paid']: true } },
    {
      arrayFilters: [{ 'el.email': dealerEmail }], 
      new: true
    }
  )
  .then(show => {
    console.log('show updated successfully:', show);
    showName = show.name;
    showDate = show.date;
    const dealerRsvpList = show.dealer_rsvp_list;    
    const dealer = dealerRsvpList.find(({ email }) => email === dealerEmail);
    dealerName = dealer.name;
    rentDue = dealer.rent_due;
    totalAmountPaid = rentDue + 5;
  })
  .catch((err) => {
    console.log(err);
    res.render('error', { userName: req.oidc.user.name, userEmail: req.oidc.user.email });
  });
  
  // update dealer
  await Dealer.findOneAndUpdate(
    { email: dealerEmail },
    { $set: { ['shows.$[el].paid']: true } },
    { arrayFilters: [{ 'el.id': id }],
      new: true
    }
  )
  // .then(dealer => {
  //   // console.log('dealer updated successfully:', dealer);
  // })
  .catch((err) => {
    console.log(err);
    res.render('error', { userName: req.oidc.user.name, userEmail: req.oidc.user.email });
  });

  // send payment confirmation email to Steve
  await transporter.sendMail({
    from: '"Vinyl Steve" <info@vinylsteve.com>', // sender address
    to: 'recordriots@gmail.com', // recipient
    subject: `Table rent payment from ${dealerName} for ${showName} on ${showDate}`, // subject line
    text: `${dealerName} has paid $${totalAmountPaid} for ${showName} on ${showDate}.`, // plain text body
    html: `<p>${dealerName} has paid $${totalAmountPaid} ($${rentDue} + $5 fee) for "${showName}" on ${showDate}.<p>`
  });
  
  res.render('payment-confirmation');
}