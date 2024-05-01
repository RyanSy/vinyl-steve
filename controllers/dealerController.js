const Show = require('../models/show');

// save dealer rsvp - pay at event
exports.save_rsvp_no_payment = async (req, res) => {
    // add field to update dealer's notes
    const show = await Show.find({ _id: req.body.id });
    show[0].dealer_rsvp_list.addToSet(req.body.user);
    show[0].save();
    res.render('confirmation', { name: req.body.name });
};
