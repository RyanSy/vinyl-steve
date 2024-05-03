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
router.get('/home', requiresAuth(), show_controller.list_shows);

// render specific record riot page
router.get('/show/:id', requiresAuth(), show_controller.list_show);

// save dealer rsvp - pay at event
router.post('/rsvp-pay-later', requiresAuth(), dealer_controller.save_rsvp_pay_later);

// save dealer rsvp - advance payment

// render dealer rsvps - user view
router.get('/my-rsvps', requiresAuth(), dealer_controller.show_dealer_rsvps);

// delete rsvp
router.post('/delete-rsvp', dealer_controller.delete_rsvp);

// render admin dashboard
router.get('/admin', requiresAuth(), admin_controller.render_admin_dashboard);

// render admin rsvp list
router.get('/admin/rsvp-list/:id', requiresAuth(), admin_controller.render_rsvp_list);

// get user profile info
router.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

module.exports = router;
