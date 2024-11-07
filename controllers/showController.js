const Show = require('../models/show');
const moment = require('moment');
const todaysDate = moment().format('YYYY-MM-DD');
const helper_functions = require('../util/helperFunctions');

// render home page with list of record riots
exports.list_shows = async (req, res) => {
    let isAdmin = false;

    if (
        req.oidc.user.email == 'clubmekon@gmail.com' ||
        req.oidc.user.email == 'recordriots@gmail.com' ||
        req.oidc.user.email == 'recordshowmania@gmail.com' ||
        req.oidc.user.email == 'johnbastone@optonline.net' ||
        req.oidc.user.email == 'exilecds@optonline.net' ||
        req.oidc.user.email == 'ryanb.sy@gmail.com'
    ) {
        isAdmin = true;
    }
    
    const shows = await Show.find({
        $and: [
            { date: { $gte: todaysDate } },
            { name: /record riot/i },
            { rsvp: true }
        ],
    });
    const showsArray = helper_functions.createShowsArray(shows);
    const showsArraySorted = helper_functions.sortByDateStart(showsArray);
    const dataObject = {
        name: req.session.name,
        image: req.session.image,
        email: req.session.email,
        shows: showsArraySorted,
        isLoggedIn: true,
        profileUpdated: req.flash('profileUpdated'),
        isAdmin: isAdmin
    };

    res.render('shows', dataObject);
};

// render specific record riot page
exports.list_show = async (req, res) => {
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;

    const show = await Show.find({ _id: req.params.id });
    const showObject = helper_functions.createShowObject(show[0]);
    const numberOfTablesForRent = showObject.number_of_tables_for_rent;
    const maxTablesPerDealer = showObject.max_tables_per_dealer;
    let maxTablesAvailable;
    if (numberOfTablesForRent < maxTablesPerDealer) {
        maxTablesAvailable = numberOfTablesForRent;
    } else {
        maxTablesAvailable = maxTablesPerDealer;
    }

    let tablesAvailable = true;
    if (maxTablesAvailable == 0) {
        tablesAvailable = false;
    }

    const dataObject = {
        name: req.session.name,
        image: req.session.image,
        email: req.session.email,
        show: showObject,
        paypalClientId: paypalClientId,
        maxTablesAvailable: maxTablesAvailable,
        tablesAvailable: tablesAvailable
    };
    res.render('show', dataObject);
};