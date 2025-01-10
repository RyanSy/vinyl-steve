const Show = require('../models/show');
const Dealer = require('../models/dealer');

// update payment status in db
exports.save_payment = async (req, res) => {
    const id = req.body.id;
    const email = req.body.email;

    await Show.findOneAndUpdate(
        { _id: id} ,
        { $set: {'dealer_rsvp_list.$[el].paid': true} },
        { arrayFilters: [ { 'el.email': email }] }
    )
    .catch((err) => {
        console.log(err);
        res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
    });

    await Dealer.findOneAndUpdate(
        { email: email },
        { $set: {'shows.$[el].paid': true } },
        { arrayFilters: [{ 'el.id': id }] }
    )
    .catch((err) => {
        console.log(err);
        res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
    });

    res.redirect('/payment-confirmation');
}