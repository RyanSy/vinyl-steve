const Show = require("../models/show");
const Dealer = require("../models/dealer");
const moment = require("moment");
const todaysDate = moment().format("YYYY-MM-DD");
const helper_functions = require('../util/helperFunctions');

// render admin dashboard
exports.render_admin_dashboard = async (req, res) => {
    const name = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const image = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const email  = JSON.stringify(req.oidc.user.email).replace(/"/g, '');

    let isAdmin = false;

    if (email == 'clubmekon@gmail.com' || email == 'recordriots@gmail.com' || email == 'recordshowmania@gmail.com') {
        isAdmin = true;
    }
    const shows = await Show.find({
        $and: [
            { date: { $gte: todaysDate } },
            { $or: [{ name: /record riot/i }, { name: /ryan record show/i }] },
        ],
    });
    const showsArray = helper_functions.createShowsArray(shows);
    const showsArraySorted = helper_functions.sortByDateStart(showsArray);
    const dataObject = {
        name: name,
        image: image,
        shows: showsArraySorted,
        isAdmin: isAdmin,
    };
    isAdmin ? res.render('admin', dataObject) : res.send('Unauthorized');
};

// render rsvp list
exports.render_rsvp_list = async (req, res) => {
    const name = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const image = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const email  = JSON.stringify(req.oidc.user.email).replace(/"/g, '');

    let isAdmin = false;

    if (req.oidc.user.email == 'clubmekon@gmail.com' || req.oidc.user.email == 'recordriots@gmail.com' || req.oidc.user.email == 'recordshowmania@gmail.com') {
        isAdmin = true;
    }

    await Show.find({ _id: req.params.id })
        .then((show) => {
            if (show.length === 0) {
                res.send('none found')
            } else {
                const showObject = helper_functions.createShowObject(show[0]);
                const showId = req.params.id;
                const showName = showObject.name;
                const showDate = showObject.date;
                const dealerRsvpList = showObject.dealer_rsvp_list;
                const waitingList = showObject.waiting_list;
                const numberOfTablesForRent = showObject.number_of_tables_for_rent;
                const maxTablesPerDealer = showObject.max_tables_per_dealer;
                const paid = showObject.paid;
                const discountCodes = showObject.discount_codes;

                const dataObject = {
                    name: name,
                    image: image,
                    showId: showId,
                    showName: showName,
                    showDate: showDate,
                    dealerRsvpList: dealerRsvpList,
                    waitingList: waitingList,
                    numberOfTablesForRent: numberOfTablesForRent,
                    maxTablesPerDealer: maxTablesPerDealer,
                    paid: paid,
                    discountCodes: discountCodes
                };
                isAdmin ? res.render('rsvp-list', dataObject) : res.send('Unauthorized');
            }
        })
        .catch((err) => {
            console.log('error:', err);
            res.send('err')
            // res.render('error');
        });
}

// add dealer
exports.add_dealer_rsvp = async (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const numberOfTablesForRent = Number(req.body.number_of_tables_for_rent);
    const numberOfTables = Number(req.body.number_of_tables);
    const newNumberOfTablesForRent = numberOfTablesForRent - numberOfTables;

    // save rsvp to shows db
    const show = await Show.find({ _id: id });
    const dealerRsvp = {
        name: name,
        number_of_tables: numberOfTables
    };
    show[0].number_of_tables_for_rent = newNumberOfTablesForRent;
    show[0].dealer_rsvp_list.addToSet(dealerRsvp);
    show[0].save()
        .catch((err) => {
            console.log(err);
            res.send('error');
        });
    
    res.redirect(`/admin/rsvp-list/${id}`);
}

exports.delete_dealer_rsvp = async (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const email = req.body.email;
    const numberOfTablesForRent = req.body.number_of_tables_for_rent;
    const numberOfTables = req.body.number_of_tables;
    const newNumberOfTablesForRent = Number(numberOfTablesForRent ) + Number(numberOfTables);

    // update show db
    const showFilter = {
        _id: id
    };
    const showUpdate = { 
        $pull: {
            dealer_rsvp_list: {
                email: email
            }
        },
        number_of_tables_for_rent: newNumberOfTablesForRent
    };
    await Show.updateOne(showFilter, showUpdate)
        .catch((err) => {
            console.log(err);
            res.render('error');    
        });

    // update dealer db
    const dealerFilter = { 
        email: email
    };
    const dealerUpdate = { $pull: {
        shows: {
            id: id
        }
    } };
    await Dealer.updateOne(dealerFilter, dealerUpdate)
        .catch((err) => {
            console.log(err);
            res.render('error');    
        });
    
    res.redirect(`/admin/rsvp-list/${id}`);
}

// render print view
exports.render_rsvp_print_view = async (req, res) => {
    const show = await Show.find({ _id: req.params.id });
    const showObject = helper_functions.createShowObject(show[0]);
    const showId = req.params.id;
    const showName = showObject.name;
    const showDate = showObject.date;
    const dealerRsvpList = showObject.dealer_rsvp_list;

    let isAdmin = false;

    if (req.oidc.user.email == 'clubmekon@gmail.com' || req.oidc.user.email == 'recordriots@gmail.com' || req.oidc.user.email == 'recordshowmania@gmail.com') {
        isAdmin = true;
    }
    
    const dataObject = {
        showId: showId,
        showName: showName,
        showDate: showDate,
        dealerRsvpList: dealerRsvpList,
    };

    isAdmin? res.render('print-view', dataObject) : res.send('unauthorized');
}

// render waiting list 
exports.render_waiting_list = async (req, res) => {
    const name = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const image = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const email  = JSON.stringify(req.oidc.user.email).replace(/"/g, '');

    const show = await Show.find({ _id: req.params.id });
    const dataObject = {
        name: name,
        image: image,
        email: email,    
        show: show[0]
    };
    
    res.render('waitlist', dataObject);
}

exports.save_discount = async (req, res) => {
    const id = req.body.id;
    const email = req.body.email;
    const percentage = req.body.discount_percentage;
    const code = generateRandomString(8);
    const show = await Show.find({ _id: id });
    const discount = {
        code: code,
        percentage: percentage
    };

    function generateRandomString(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for ( let i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    show[0].discount_codes.addToSet(discount);
    show[0].save();

    // await Show.findOneAndUpdate(
    //     { _id: id }, 
    //     { $set: {
    //             'dealer_rsvp_list.$[el].discount_code': discountCode,
    //             'dealer_rsvp_list.$[el].discount_percentage': discountPercentage
    //         }
    //     },
    //     { arrayFilters: [ { 'el.email': email }] }
    // )
    // .catch((err) => {
    //     console.log(err);
    //     res.render('error');
    // });

    // await Dealer.findOneAndUpdate(
    //     { email: email },
    //     { $set: {
    //             'shows.$[el].discount_code': discountCode,
    //             'shows.$[el].discount_percentage': discountPercentage
    //         }
    //     },
    //     { arrayFilters: [{ 'el.id': id }] }
    // )
    // .catch((err) => {
    //     console.log(err);
    //     res.render('error');
    // });

    res.redirect(`/admin/rsvp-list/${id}`);
}


/**
 *     await Show.findOneAndUpdate(
        { _id: id } ,
        { 
            $set: {
                'dealer_rsvp_list.$[el].number_of_tables': numberOfTables,
                'dealer_rsvp_list.$[el].notes': notes,
                'dealer_rsvp_list.$[el].rent_due': rentDue
            },
            $inc: {
                'number_of_tables_for_rent': change
            }
        },
        { arrayFilters: [ { 'el.email': email }] }
    )
    .catch((err) => {
        console.log(err);
        res.render('error');
    });

    await Dealer.findOneAndUpdate(
        { email: email },
        { $set: {
            'shows.$[el].number_of_tables': numberOfTables,
            'shows.$[el].notes': notes,
            'shows.$[el].rent_due': rentDue
            }
        },
        { arrayFilters: [{ 'el.id': id }] }
    )
    .catch((err) => {
        console.log(err);
        res.render('error');
    });

 */