const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
const show_controller = require('../controllers/showController');
const dealer_controller = require('../controllers/dealerController');
const admin_controller = require('../controllers/adminController');
const rsvp_controller = require('../controllers/rsvpController');

// render index, redirect to home page if logged in
router.get('/', (req, res) => {
    console.log('req.session', req.session)
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

// render home page with list of record riots
router.get('/home', requiresAuth(), show_controller.list_shows);

// render specific record riot page
router.get('/show/:id', requiresAuth(), show_controller.list_show);

// render dealer rsvps - user view
router.get('/my-rsvps', requiresAuth(), dealer_controller.show_dealer_rsvps);

// delete dealer rsvp - by user 
router.post('/delete-rsvp', dealer_controller.delete_rsvp);

// render admin dashboard
router.get('/admin', requiresAuth(), admin_controller.render_admin_dashboard);

// render admin rsvp list
router.get('/admin/rsvp-list/:id', requiresAuth(), admin_controller.render_rsvp_list);

// render admin rsvp list
router.get('/already-registered', requiresAuth(), (req, res) => 
    { res.render('already-registered');
});

// save dealer rsvp
router.post('/rsvp-confirmation', requiresAuth(), rsvp_controller.save_rsvp);

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

module.exports = router;
