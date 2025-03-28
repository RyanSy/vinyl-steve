const Show = require('../models/show');
const Dealer = require('../models/dealer');
// const Rsvp = require('../models/rsvp');
const moment = require('moment');
const todaysDate = moment().format('YYYY-MM-DD');
const helper_functions = require('../util/helperFunctions');
// const cron = require('node-cron');

// render admin dashboard
exports.render_admin_dashboard = async (req, res) => {
    const name = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const image = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const email = JSON.stringify(req.oidc.user.email).replace(/"/g, '');

    let isAdmin = false;

    // admin accounts
    if (
        email == 'clubmekon@gmail.com' ||
        email == 'recordriots@gmail.com' ||
        email == 'recordshowmania@gmail.com' ||
        email == 'exilecds@optonline.net' ||
        email == 'ryanb.sy@gmail.com' ||
        email == 'johnbastone@optonline.net'
    ) {
        isAdmin = true;
    }

    let shows;

    // find future shows from db depending on user
    if (email == 'clubmekon@gmail.com' || email == 'recordriots@gmail.com' || email == 'ryanb.sy@gmail.com') {
        shows = await Show.find({
            $and: [
                { date: { $gte: todaysDate } },
                { $or: [{posted_by: 'mayfieldmouse'}, {posted_by: 'ryan sy'}] }
            ]
        });
    }

    if (email == 'exilecds@optonline.net' || email == 'johnbastone@optonline.net' || email == 'recordshowmania@gmail.com') {
        shows = await Show.find({
            $and: [
                { date: { $gte: todaysDate } },
                { posted_by: 'john bastone'}
            ]
        });
    }

    let dataObject;

    if (isAdmin) {
        const showsArray = helper_functions.createShowsArray(shows);
        const showsArraySorted = helper_functions.sortByDateStart(showsArray);

        // find past shows from db depending on user
        let pastShows;

        if (email == 'clubmekon@gmail.com' || email == 'recordriots@gmail.com' || email == 'ryanb.sy@gmail.com') {
            pastShows = await Show.find({
                $and: [
                    { date: { $gte: '2024-06-01', $lte: todaysDate } },
                    { posted_by: 'mayfieldmouse'}
                ],
            });
        }
        if (email == 'exilecds@optonline.net' || email == 'johnbastone@optonline.net' ||  email == 'recordshowmania@gmail.com') {
            pastShows = await Show.find({
                $and: [
                    { date: { $gte: '2024-06-01', $lte: todaysDate } },
                    { posted_by: 'john bastone'}
                ],
            });
        }

        const pastShowsArray = helper_functions.createShowsArray(pastShows);
        const pastShowsArraySorted = helper_functions.sortByDateEnd(pastShowsArray);

        dataObject = {
            name: name,
            image: image,
            shows: showsArraySorted,
            pastShows: pastShowsArraySorted,
            isAdmin: isAdmin,
            messageSent: req.flash('messageSent')
        };
    } else {
        res.send('Unauthorized');
    }

    isAdmin ? res.render('admin', dataObject) : res.send('Unauthorized');
};

// render rsvp list
exports.render_rsvp_list = async (req, res) => {
    const name = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const image = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const email = JSON.stringify(req.oidc.user.email).replace(/"/g, '');

    let isAdmin = false;

    if (
        req.oidc.user.email == 'clubmekon@gmail.com' ||
        req.oidc.user.email == 'recordriots@gmail.com' ||
        req.oidc.user.email == 'recordshowmania@gmail.com' ||
        req.oidc.user.email == 'exilecds@optonline.net' ||
        req.oidc.user.email == 'ryanb.sy@gmail.com' ||
        req.oidc.user.email == 'johnbastone@optonline.net'  
    ) {
        isAdmin = true;
    }

    await Show.find({ _id: req.params.id })
        .then((show) => {
            if (show.length === 0) {
                res.send('none found');
            } else {
                const showObject = helper_functions.createShowObject(show[0]);
                const showId = req.params.id;
                const showName = showObject.name;
                const showDate = showObject.date;
                const dealerRsvpList = showObject.dealer_rsvp_list;
                const waitingList = showObject.waiting_list;
                const numberOfTablesForRent =
                    showObject.number_of_tables_for_rent;
                const maxTablesPerDealer = showObject.max_tables_per_dealer;
                const tableRent = showObject.table_rent;
                const paid = showObject.paid;
                const discountCodes = showObject.discount_codes;
                const dealerInformation = showObject.dealer_information;
                const tablesRented = showObject.tables_rented;
                const archiveNotes = showObject.archive_notes;
                let tablesAvailable;
                numberOfTablesForRent > 0 ? tablesAvailable = true : tablesAvailable = false;
                let maxTablesAvailable;
                if (numberOfTablesForRent < maxTablesPerDealer) {
                    maxTablesAvailable = numberOfTablesForRent;
                } else {
                    maxTablesAvailable = maxTablesPerDealer;
                }

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
                    tableRent: tableRent,
                    paid: paid,
                    discountCodes: discountCodes,
                    dealerInformation: dealerInformation,
                    tablesRented: tablesRented,
                    archiveNotes: archiveNotes,
                    tablesAvailable: tablesAvailable,
                    maxTablesAvailable: maxTablesAvailable,
                    dealerInfoUpdated: req.flash('dealerInfoUpdated'),
                    dealerAdded: req.flash('dealerAdded'),
                    dealerDeleted: req.flash('dealerDeleted'),
                    archiveNotesUpdated: req.flash('archiveNotesUpdated'),
                    messageSent: req.flash('messageSent'),
                    rsvpUpdated: req.flash('rsvpUpdated'),
                    notEnoughTables: req.flash('notEnoughTables'),
                    id: req.flash('id')
                };
                isAdmin
                    ? res.render('rsvp-list', dataObject)
                    : res.send('Unauthorized');
            }
        })
        .catch((err) => {
            console.log('error:', err);
            res.send('err');
            // res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
        });
};

// add dealer
exports.add_dealer_rsvp = async (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const email = req.body.email;
    const dealerNotes = req.body.notes;
    const tableRent = req.body.table_rent;
    const numberOfTablesForRent = Number(req.body.number_of_tables_for_rent);
    const numberOfTables = Number(req.body.number_of_tables);
    const newNumberOfTablesForRent = numberOfTablesForRent - numberOfTables;

    // if adding dealer tables doesn't bring total availabe to a negative amount, save rsvp to shows db
    if (newNumberOfTablesForRent >= 0) {
        const show = await Show.find({ _id: id });
        const dealerRsvp = {
            name: name,
            email: email,
            notes: dealerNotes,
            number_of_tables: numberOfTables,
            rent_due: numberOfTables * tableRent
        };
        show[0].number_of_tables_for_rent = newNumberOfTablesForRent;
        show[0].dealer_rsvp_list.addToSet(dealerRsvp);
        show[0].save().catch((err) => {
            console.log(err);
            res.send('error');
        });
    
        req.flash('dealerAdded', 'Dealer has been added.');    
    } else {
        req.flash('notEnoughTables', 'Insufficient tables available.');
    }

    res.redirect(`/admin/rsvp-list/${id}`);
};

// delete dealer
exports.delete_dealer_rsvp = async (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const email = req.body.email;
    const numberOfTablesForRent = req.body.number_of_tables_for_rent;
    const numberOfTables = req.body.number_of_tables;
    const newNumberOfTablesForRent = Number(numberOfTablesForRent) + Number(numberOfTables);
    const showName = req.body.show_name;
    const showDate = req.body.show_date;

    // update show db
    const showFilter = {
        _id: id,
    };
    const showUpdate = {
        $pull: {
            dealer_rsvp_list: {
                name: name,
            },
        },
        number_of_tables_for_rent: newNumberOfTablesForRent,
    };
    await Show.updateOne(showFilter, showUpdate).catch((err) => {
        console.log(err);
        res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
    });

    // update dealer db
    const dealerFilter = {
        email: email,
    };
    const dealerUpdate = {
        $pull: {
            shows: {
                id: id,
            },
        },
    };
    await Dealer.updateOne(dealerFilter, dealerUpdate).catch((err) => {
        console.log(err);
        res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
    });

    async function main() {
        await transporter.sendMail({
            from: '"Vinyl Steve" <info@vinylsteve.com>', // sender address
            to: 'ryanbsy@gmail.com', 
            subject: 'Vinyl Steve Cancellation', // subject line
            text: `${name} has canceled their RSVP for "${showName}" on ${showDate}.`, // plain text body
            /**
             * html:// html body
             *  */ 
        });
    }

    main().catch(console.error);

    req.flash('dealerDeleted', 'Dealer has been deleted.');

    res.redirect(`/admin/rsvp-list/${id}`);
};

// render print view
exports.render_rsvp_print_view = async (req, res) => {
    const show = await Show.find({ _id: req.params.id });
    const showObject = helper_functions.createShowObject(show[0]);
    const showId = req.params.id;
    const showName = showObject.name;
    const showDate = showObject.date;
    const dealerRsvpList = showObject.dealer_rsvp_list;

    let isAdmin = false;

    if (
        req.oidc.user.email == 'clubmekon@gmail.com' ||
        req.oidc.user.email == 'recordriots@gmail.com' ||
        req.oidc.user.email == 'recordshowmania@gmail.com' ||
        req.oidc.user.email == 'exilecds@optonline.net' ||
        req.oidc.user.email == 'ryanb.sy@gmail.com' ||
        req.oidc.user.email == 'johnbastone@optonline.net'  
    ) {
        isAdmin = true;
    }

    const dataObject = {
        showId: showId,
        showName: showName,
        showDate: showDate,
        dealerRsvpList: dealerRsvpList,
    };

    isAdmin ? res.render('print-view', dataObject) : res.send('unauthorized');
};

// render waiting list
exports.render_waiting_list = async (req, res) => {
    const name = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const image = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const email = JSON.stringify(req.oidc.user.email).replace(/"/g, '');

    const show = await Show.find({ _id: req.params.id });
    const dataObject = {
        show_id: req.params.id,
        name: name,
        image: image,
        email: email,
        show: show[0],
        messageSent: req.flash('messageSent')
    };

    res.render('waitinglist', dataObject);
};

// delete from waiting list
exports.delete_from_waiting_list = async (req, res) => {
    const showId = req.body.show_id;
    const userId = req.body.user_id;

    // update show db
    const filter = {
        _id: showId,
    };
    const update = {
        $pull: {
            waiting_list: {
                user_id: userId,
            },
        }
    };

    await Show.updateOne(filter, update).catch((err) => {
        console.log(err);
        res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
    });

    res.redirect(`/admin/waitinglist/${showId}`);
}

// save discount
exports.save_discount = async (req, res) => {
    const id = req.body.id;
    const email = req.body.email;
    const amount = req.body.discount_amount;
    const code = generateRandomString(8);
    const show = await Show.find({ _id: id });
    const discount = {
        code: code,
        amount: amount,
    };

    function generateRandomString(length) {
        let result = '';
        const characters =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            );
        }
        return result;
    }

    show[0].discount_codes.addToSet(discount);
    show[0].save();

    res.redirect(`/admin/rsvp-list/${id}`);
};

// delete discount
exports.delete_discount = async (req, res) => {
    const id = req.body.id;
    const code = req.body.code;

    // update show db
    const filter = {
        _id: id,
    };
    const update = {
        $pull: {
            discount_codes: {
                code: code,
            },
        }
    };
    await Show.updateOne(filter, update)
        .catch((err) => {
            console.log(err);
            res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
        });

    res.redirect(`/admin/rsvp-list/${id}`);
};

// render dealers list
exports.render_dealers_list =  async (req, res) => {
    const name = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const image = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const email = JSON.stringify(req.oidc.user.email).replace(/"/g, '');
    
    let dealersList;

    if (email == 'exilecds@optonline.net' || email == 'johnbastone@optonline.net' || email == 'recordshowmania@gmail.com') {
        await Dealer.find({dealer_list_john: true})
            .then((dealers) => {
                dealersList = dealers;
            })
            .catch((err) => {
                console.log(err);
                res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
            });
    } else {
        await Dealer.find({})
            .then((dealers) => {
                dealersList = dealers;
            })
            .catch((err) => {
                console.log(err);
                res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
            });
    }
    

    res.render('dealers-list', {
        name: name,
        image: image,
        dealersList: dealersList,
        messageSent: req.flash('messageSent')
    });
}

// edit dealer information
exports.edit_dealer_information = async (req, res, next) => {
    const id = req.params.id;
    const dealerInformation = req.body.dealer_information;

    // save rsvp to shows db
    const show = await Show.findOne({ _id: id });
 
    show.dealer_information = dealerInformation;
    show.save().catch((err) => {
        console.log(err);
        res.send('error');
    });

    req.flash('dealerInfoUpdated', 'Dealer information has been updated.')

    next();
};

// edit_archive_notes
exports.edit_archive_notes = async (req, res, next) => {
    const id = req.params.id;
    const archiveNotes = req.body.archive_notes;

    // save rsvp to shows db
    const show = await Show.findOne({ _id: id });
 
    show.archive_notes = archiveNotes;
    show.save().catch((err) => {
        console.log(err);
        res.send('error');
    });

    req.flash('archiveNotesUpdated', 'Archive notes have been updated.')

    next();
};