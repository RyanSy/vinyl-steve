const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
const admin_controller = require('../controllers/adminController');

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

// view waiting list
router.get('/waitlist/:id', requiresAuth(), admin_controller.render_waiting_list);

// save discount
router.post('/save-discount', requiresAuth(), admin_controller.save_discount);

// delete discount
router.post('/delete-discount', requiresAuth(), admin_controller.delete_discount, admin_controller.render_rsvp_list);

// render dealers list
router.get('/dealers-list', requiresAuth(), admin_controller.render_dealers_list);

// edit dealer information
router.post('/edit-dealer-information/:id', requiresAuth(), admin_controller.edit_dealer_information, admin_controller.render_rsvp_list);

// edit archive notes
router.post('/edit-archive-notes/:id', requiresAuth(), admin_controller.edit_archive_notes, admin_controller.render_rsvp_list);

// email all dealers
router.post('/email-all-dealers', requiresAuth(), admin_controller.email_all_dealers);

module.exports = router;