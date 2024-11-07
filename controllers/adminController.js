const Show = require('../models/show');
const Dealer = require('../models/dealer');
const moment = require('moment');
const todaysDate = moment().format('YYYY-MM-DD');
const helper_functions = require('../util/helperFunctions');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_SERVER,
    port: process.env.BREVO_SMTP_PORT,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.BREVO_LOGIN,
        pass: process.env.BREVO_SMTP_KEY,
    },
});

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
        email == 'ryanb.sy@gmail.com'
    ) {
        isAdmin = true;
    }

    let shows;

    // find future shows from db depending on user
    if (email == 'clubmekon@gmail.com' || email == 'recordriots@gmail.com' || email == 'ryanb.sy@gmail.com') {
        shows = await Show.find({
            $and: [
                { date: { $gte: todaysDate } },
                { name: /record riot/i },
                { $or: [{posted_by: 'mayfieldmouse'}, {posted_by: 'ryan sy'}] }
            ]
        });
    }

    if (email == 'exilecds@optonline.net' || email == 'recordshowmania@gmail.com') {
        shows = await Show.find({
            $and: [
                { date: { $gte: todaysDate } },
                { name: /record riot/i },
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
                    { name: /record riot/i },
                    { posted_by: 'mayfieldmouse'}
                ],
            });
        }
        if (email == 'exilecds@optonline.net' || email == 'recordshowmania@gmail.com') {
            pastShows = await Show.find({
                $and: [
                    { date: { $gte: '2024-06-01', $lte: todaysDate } },
                    { name: /record riot/i },
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
        req.oidc.user.email == 'johnbastone@optonline.net' ||
        req.oidc.user.email == 'ryanb.sy@gmail.com' 
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
                    dealerInfoUpdated: req.flash('dealerInfoUpdated'),
                    dealerAdded: req.flash('dealerAdded'),
                    dealerDeleted: req.flash('dealerDeleted'),
                    archiveNotesUpdated: req.flash('archiveNotesUpdated'),
                    messageSent: req.flash('messageSent')
                };
                isAdmin
                    ? res.render('rsvp-list', dataObject)
                    : res.send('Unauthorized');
            }
        })
        .catch((err) => {
            console.log('error:', err);
            res.send('err');
            // res.render('error');
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

    // save rsvp to shows db
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

    res.redirect(`/admin/rsvp-list/${id}`);
};

// delete dealer
exports.delete_dealer_rsvp = async (req, res) => {
    console.log('delete', req.body)
    const id = req.body.id;
    const name = req.body.name;
    const numberOfTablesForRent = req.body.number_of_tables_for_rent;
    const numberOfTables = req.body.number_of_tables;
    const newNumberOfTablesForRent =
        Number(numberOfTablesForRent) + Number(numberOfTables);

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
        res.render('error');
    });

    // update dealer db
    const dealerFilter = {
        name: name,
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
        res.render('error');
    });

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
        req.oidc.user.email == 'recordshowmania@gmail.com'
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
        name: name,
        image: image,
        email: email,
        show: show[0],
    };

    res.render('waitlist', dataObject);
};

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
            res.render('error');
        });

    res.redirect(`/admin/rsvp-list/${id}`);
};

// render dealers list
exports.render_dealers_list =  async (req, res) => {
    let dealersList;
    await Dealer.find({})
        .then((dealers) => {
            dealersList = dealers;
        })
        .catch((err) => {
            console.log(err);
            res.render('error');
        });

    res.render('dealers-list', {
        dealersList: dealersList
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

// email all dealers
exports.email_all_dealers = async (req, res, next) => {
    const id = req.body.id;
    const dealerEmails = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;

    console.log(req.body)

    // async..await is not allowed in global scope, must use a wrapper
    async function main() {
        // send mail with defined transport object
        const info = await transporter.sendMail({
            from: '"Vinyl Steve" <info@vinylsteve.com>', // sender address
            to: dealerEmails, // list of receivers
            subject: subject, // subject line
            text: message, // plain text body
            /**
             * html:// html body
             *  */ 
        });
    }

    main().catch(console.error);

    req.flash('messageSent', 'Message sent successfully.')

    res.redirect(`/admin/rsvp-list/${id}`);
};