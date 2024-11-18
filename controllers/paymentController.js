const Show = require('../models/show');
const Dealer = require('../models/dealer');
const paypalFunctions = require('../util/paypalFunctions');

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

// paypal routes
exports.create_order = async (req, res) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const { cart } = req.body;
        const { jsonResponse, httpStatusCode } = await paypalFunctions.createOrder(cart);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error('Failed to create order:', error);
        res.status(500).json({ error: 'Failed to create order.' });
    }
};

exports.on_approve = async (req, res) => {
    try {
        const { orderID } = req.params;
        const { jsonResponse, httpStatusCode } = await paypalFunctions.captureOrder(orderID);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error('Failed to create order:', error);
        res.status(500).json({ error: 'Failed to capture order.' });
    }
};
