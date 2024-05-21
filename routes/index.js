const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
const show_controller = require('../controllers/showController');
const dealer_controller = require('../controllers/dealerController');
const rsvp_controller = require('../controllers/rsvpController');
const admin_controller = require('../controllers/adminController');

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

// render home page with list of record riots
router.get('/home', requiresAuth(), dealer_controller.check_if_dealer_exists, show_controller.list_shows);

// render specific record riot page
router.get('/show/:id', requiresAuth(), show_controller.list_show);

// render dealer rsvps - user view
router.get('/my-rsvps', requiresAuth(), dealer_controller.show_dealer_rsvps);

// delete dealer rsvp - by user 
router.post('/delete-rsvp/:id', requiresAuth(), dealer_controller.delete_rsvp, (req, res) => { res.redirect('/my-rsvps') });

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

// save payment
router.post('/save-payment', requiresAuth(), rsvp_controller.save_payment);

//payment confirmation
router.get('/payment-confirmation', requiresAuth(), (req, res) => 
    { res.render('payment-confirmation');
});

// save dealer to waitlist
router.post('/waitlist', requiresAuth(), dealer_controller.save_dealer_to_waitlist);

// paypal payment routes
router.post('/api/orders', requiresAuth(), rsvp_controller.create_order);
router.post('/api/orders/:orderID/capture', requiresAuth(), rsvp_controller.on_approve);
router.get('/payment-error', requiresAuth(), (req, res) => {
    res.send('payment error');
});

// get user profile info
router.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

// get user privacy policy page
router.get('/privacy-policy', (req, res) => {
    res.render('privacy-policy');
});

module.exports = router;
