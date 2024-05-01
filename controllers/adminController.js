const Show = require("../models/show");
const moment = require("moment");
const todaysDate = moment().format("YYYY-MM-DD");
const helper_functions = require('../util/helperFunctions');

// render admin dashboard
exports.render_admin_dashboard = async (req, res) => {
    let user;
    let isAdmin = false;
    if (req.oidc.user) {
        user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    }
    if (
        req.oidc.user.email == 'clubmekon@gmail.com' ||
        req.oidc.user.email == 'recordriots@gmail.com' ||
        req.oidc.user.email == 'ryanb.sy@gmail.com'
    ) {
        isAdmin = true;
    }
    const shows = await Show.find({
        date: { $gte: todaysDate },
        name: /record riot/i,
    });
    const showsArray = helper_functions.createShowsArray(shows);
    const showsArraySorted = helper_functions.sortByDateStart(showsArray);
    const dataObject = {
        user: user,
        shows: showsArraySorted,
        isAdmin: isAdmin,
    };
    isAdmin ? res.render('admin', dataObject) : res.send('Unauthorized');
};

// render rsvp list
exports.render_rsvp_list = async (req, res) => {
    let user;
    if (req.oidc.user) {
        user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    }
    const show = await Show.find({ _id: req.params.id });
    const showObject = helper_functions.createShowObject(show[0]);
    const dataObject = {
        user: user,
        show: showObject,
    };
    res.render('rsvp', dataObject);
}
