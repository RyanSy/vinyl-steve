const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
const show_controller = require('../controllers/showController');
const dealer_controller = require('../controllers/dealerController');
const admin_controller = require('../controllers/adminController');
const rsvp_controller = require('../controllers/rsvpController');

// render admin dashboard
router.get('/', requiresAuth(), admin_controller.render_admin_dashboard);

// render rsvp list
router.get('/rsvp-list/:id', requiresAuth(), admin_controller.render_rsvp_list);

// render rsvp list print view
router.get('/print-view/:id', requiresAuth(), admin_controller.render_rsvp_print_view);

// add dealer rsvp
router.post('/add-dealer-rsvp', requiresAuth(), admin_controller.add_dealer_rsvp);

// delete dealer rsvp
router.post('/delete-rsvp', requiresAuth(), admin_controller.delete_dealer_rsvp);

module.exports = router;