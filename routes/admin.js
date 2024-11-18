const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
const admin_controller = require('../controllers/adminController');
const dealer_controller = require('../controllers/dealerController');

// render admin dashboard
router.get('/', requiresAuth(), dealer_controller.check_if_dealer_exists, admin_controller.render_admin_dashboard);

// render rsvp list
router.get('/rsvp-list/:id', requiresAuth(), admin_controller.render_rsvp_list);

// render rsvp list print view
router.get('/print-view/:id', requiresAuth(), admin_controller.render_rsvp_print_view);

// add dealer rsvp
router.post('/add-dealer-rsvp', requiresAuth(), admin_controller.add_dealer_rsvp);

// delete dealer rsvp
router.post('/delete-rsvp', requiresAuth(), admin_controller.delete_dealer_rsvp);

// view waiting list
router.get('/waitinglist/:id', requiresAuth(), admin_controller.render_waiting_list);

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

// email all dealers -from rsvp list view
router.post('/email-all-dealers', requiresAuth(), admin_controller.email_all_dealers);

// email individual dealers - from rsvp list view
router.post('/email-individual-dealer', requiresAuth(), admin_controller.email_individual_dealer);

// email all dealers -from rsvp list view
router.post('/email-all-dealers_from_dealers_list', requiresAuth(), admin_controller.email_all_dealers_from_dealers_list);

// email individual dealers - from dealers list view
router.post('/email-individual-dealer-from-dealers-list', requiresAuth(), admin_controller.email_individual_dealer_from_dealers_list);

// email individual dealers - from waiting list view
router.post('/email-individual-dealer-from-waiting-list', requiresAuth(), admin_controller.email_individual_dealer_from_waitinglist);

// send email from error page
router.post('/email-support', requiresAuth(), admin_controller.email_support);

// show error page
router.get('/error', requiresAuth(), (req, res) => {
    res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
})

module.exports = router;