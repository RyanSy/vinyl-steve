const Show = require('../models/show');
const Dealer = require('../models/dealer');
const paypalFunctions = require('../util/paypalFunctions');

// save rsvp
exports.save_rsvp = async (req, res) => {
    const user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const userImage = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const userEmail = JSON.stringify(req.oidc.user.email).replace(/"/g, '');

    const showId = req.body.id;
    const showName = req.body.name;
    const showCity = req.body.city;
    const showState = req.body.state;
    const showDate = req.body.date;
    const showMonth = req.body.month;
    const showDay = req.body.day;
    const showYear = req.body.year;
    const numberOfTablesForRent = req.body.number_of_tables_for_rent;
    const dealerName = req.body.user;
    const numberOfTables = req.body.number_of_tables;
    const dealerNotes = req.body.notes;
    const paid = req.body.paid;
    const newNumberOfTablesForRent = numberOfTablesForRent - numberOfTables;
    const show = await Show.find({ _id: showId });

    // if dealer rsvp list contains user, dont save and inform user
    const containsDealer = show[0].dealer_rsvp_list.some((user) => user.name === dealerName);
    if (containsDealer) {
        res.redirect('/already-registered');
        return;
    }

    // save rsvp to shows db
    const dealerRsvp = {
        name: dealerName,
        email: userEmail,
        number_of_tables: numberOfTables,
        notes: dealerNotes,
        paid: paid
    };
    show[0].number_of_tables_for_rent = newNumberOfTablesForRent;
    show[0].dealer_rsvp_list.addToSet(dealerRsvp);
    show[0].save();

    // save rsvp to dealers db
    const filter = { 
        email: userEmail 
    };

    const update = { $push: {
        shows: { 
            id: showId,
            name: showName,
            city: showCity,
            state: showState,
            date: showDate,
            month: showMonth,
            day: showDay,
            year: showYear,
            number_of_tables: numberOfTables,
            notes: dealerNotes,
            paid: paid
        }
    } };

    // const options = { 
    //     new: true
    // };

    Dealer.findOneAndUpdate(filter, update)
        .catch((err) =>{
            console.log(err);
            res.render('error');
        });

    // data for confirmation message
    const dataObject = {
        user: user,
        userImage: userImage,
        email: userEmail,
        id: showId,
        name: showName,
        date: showDate,
        paypalClientId: process.env.PAYPAL_CLIENT_ID
    };

    res.render('rsvp-confirmation', dataObject);
};

exports.save_payment = async (req, res) => {
    console.log(req.body)
    const id = req.body.id;
    const email = req.body.email;

    // const dealer = Dealer.find({ email: email });
    // const filter = { 'shows.id': id };
    // const update = { 'paid': true };
    // await dealer[0].update(filter, update);


    // patients.findOneAndUpdate(
    //     {_id: "5cb939a3ba1d7d693846136c"},
    //     {$set: {"myArray.$[el].value": 424214 } },
    //     { 
    //       arrayFilters: [{ "el.treatment": "beauty" }],
    //       new: true
    //     }
    //   )
    await Show.findOneAndUpdate(
        { _id: id} ,
        { $set: {'dealer_rsvp_list.$[el].paid': true} },
        { arrayFilters: [ { 'el.email': email }] }
    );

    await Dealer.findOneAndUpdate(
        { email: email },
        { $set: {'shows.$[el].paid': true } },
        { arrayFilters: [{ 'el.id': id }] }
    );

    res.redirect('/payment-confirmation');
}

exports.delete_rsvp = async (req, res, next) => {
    const user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const userImage = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const userEmail = JSON.stringify(req.oidc.user.email).replace(/"/g, '');
    const showId = req.body.show_id;
    const userName = req.body.name;

    // update show collection
    const showFilter = {
        _id: showId
    };
    const showUpdate = { $pull: {
        dealer_rsvp_list: {
            name: userName
            // email: userEmail
        }
    } }
    await Show.updateOne(showFilter, showUpdate)
        .catch((err) => {
            res.render('error');    
        });

    // update dealer collection
    const dealerFilter = { 
        name: userName,
        email: userEmail 
    };
    const dealerUpdate = { $pull: {
        shows: {
            id: showId
        }
    } };
    await Dealer.updateOne(dealerFilter, dealerUpdate)
        .catch((err) => {
            res.render('error');    
        });

    next();
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
