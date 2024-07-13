const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
const show_controller = require('../controllers/showController');
const dealer_controller = require('../controllers/dealerController');
const rsvp_controller = require('../controllers/rsvpController');
const payment_controller = require('../controllers/paymentController');

// render index, redirect to home page if logged in
router.get('/', (req, res) => {
    if (!req.oidc.isAuthenticated()) {
        res.render('index', { title: 'Vinyl Steve', isLoggedIn: false });
    } else if (req.oidc.user.email == 'clubmekon@gmail.com' || req.oidc.user.email == 'recordriots@gmail.com' || req.oidc.user.email == 'recordshowmania@gmail.com') {
        res.redirect('/admin');
    } else {
        res.redirect('/home');
    }
});

// send to signup page
router.get("/signup", (req, res) => {
    res.oidc.login({
      returnTo: "/",
      authorizationParams: { screen_hint: "signup" },
    });
});

// save info from sign up page
router.post('/save-dealer-info', requiresAuth(), dealer_controller.save_dealer_info);

// render edit profile page
router.get('/edit-profile', requiresAuth(), dealer_controller.render_edit_profile);

// save profile
router.post('/save-profile', requiresAuth(), dealer_controller.save_profile);

// render home page with list of record riots
router.get('/home', requiresAuth(), dealer_controller.check_if_dealer_exists, show_controller.list_shows);

// render specific record riot page
router.get('/show/:id', requiresAuth(), show_controller.list_show);

// render dealer rsvps - user view
router.get('/my-rsvps', requiresAuth(), dealer_controller.show_dealer_rsvps);

// delete dealer rsvp - by user 
router.post('/delete-rsvp', requiresAuth(), dealer_controller.delete_rsvp, (req, res) => { res.redirect('/my-rsvps') });

// inform user of registration
router.get('/already-registered', requiresAuth(), (req, res) => 
    { res.render('already-registered');
});

// save dealer rsvp - user
router.post('/rsvp-confirmation', requiresAuth(), rsvp_controller.save_rsvp);

// render edit rsvp page - user
router.post('/edit-rsvp/', requiresAuth(), rsvp_controller.show_edit_rsvp_page);

// update rsvp - user
router.post('/update-rsvp/', requiresAuth(), rsvp_controller.update_rsvp);

// save dealer to waitlist
router.post('/waitlist', requiresAuth(), dealer_controller.save_dealer_to_waitlist);

// get discount page
router.get('/discount/:id', requiresAuth(), dealer_controller.render_discount_page);

// save user discount
router.post('/save-discount', requiresAuth(), dealer_controller.save_discount);

// save payment
router.post('/save-payment', requiresAuth(), payment_controller.save_payment);

// payment confirmation
router.get('/payment-confirmation', requiresAuth(), (req, res) => 
    { res.render('payment-confirmation');
});

// payment error
router.get('/payment-error', requiresAuth(), (req, res) => {
    res.render('payment-unsuccessful');
});

// paypal payment routes
router.post('/api/orders', requiresAuth(), payment_controller.create_order);
router.post('/api/orders/:orderID/capture', requiresAuth(), payment_controller.on_approve);


// get user profile info
// router.get('/profile', requiresAuth(), (req, res) => {
//     res.send(gify(req.oidc.user));
// });

// get user privacy policy page
router.get('/privacy-policy', (req, res) => {
    res.render('privacy-policy', {
        name: req.session.name,
        image: req.session.image
    });
});

module.exports = router;
