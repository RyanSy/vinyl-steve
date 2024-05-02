const Show = require('../models/show');
const moment = require('moment');
const todaysDate = moment().format('YYYY-MM-DD');
const helper_functions = require('../util/helperFunctions');

// render home page with list of record riots
exports.list_shows = async (req, res) => {
    // console.log(req.oidc.user)
    const user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');

    // *** TODO *** find fallbak image
    const userImage = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');

    const shows = await Show.find({
        $and: [
            { date: { $gte: todaysDate } },
            { $or: [{ name: /record riot/i }, { name: /ryan record show/i }] },
        ],
    });
    const showsArray = helper_functions.createShowsArray(shows);
    const showsArraySorted = helper_functions.sortByDateStart(showsArray);
    const dataObject = {
        user: user,
        userImage: userImage,
        shows: showsArraySorted,
        isLoggedIn: true
    };
    res.render('shows', dataObject);
};

// render specific record riot page
exports.list_show = async (req, res) => {
    const user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const userImage = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');

    const show = await Show.find({ _id: req.params.id });
    const showObject = helper_functions.createShowObject(show[0]);
    const dataObject = {
        user: user,
        userImage: userImage,
        show: showObject,
    };
    res.render('show', dataObject);
};
