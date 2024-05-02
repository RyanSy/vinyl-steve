const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
const show_controller = require('../controllers/showController');
const dealer_controller = require('../controllers/dealerController');
const admin_controller = require('../controllers/adminController');

// render index, redirect to home page if logged in
router.get('/', (req, res) => {
    req.oidc.isAuthenticated()
        ? res.redirect('/home')
        : res.render('index', { title: 'Vinyl Steve', isLoggedIn: false });
});

// render home page with list of record riots
router.get('/home', show_controller.list_shows);

// render specific record riot page
router.get('/show/:id', show_controller.list_show);

// save dealer rsvp - pay at event
router.post('/rsvp-pay-later', dealer_controller.save_rsvp_pay_later);

// save dealer rsvp - advance payment

// render admin dashboard
router.get('/admin', admin_controller.render_admin_dashboard);

// render admin rsvp list
router.get('/admin/rsvp-list/:id', admin_controller.render_rsvp_list);

// render user profile
router.get('/my-shows', requiresAuth(), (req, res) => {
    res.send('Under Construction');
});

// get user profile info
router.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

module.exports = router;
