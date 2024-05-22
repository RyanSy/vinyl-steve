const Show = require('../models/show');
const Dealer = require('../models/dealer');
const helperFunctions = require('../util/helperFunctions');

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
    const tableRent = req.body.table_rent;
    const numberOfTablesForRent = req.body.number_of_tables_for_rent;
    const dealerName = req.body.user;
    const numberOfTables = req.body.number_of_tables;
    const dealerNotes = req.body.notes;
    const paid = req.body.paid;
    const newNumberOfTablesForRent = numberOfTablesForRent - numberOfTables;

    const rentDue = numberOfTables * tableRent;

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
        paid: paid,
        rent_due: rentDue
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
            paid: paid,
            rent_due: rentDue
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
        paypalClientId: process.env.PAYPAL_CLIENT_ID,
        rentDue: rentDue
    };

    res.render('rsvp-confirmation', dataObject);
};

exports.show_edit_rsvp_page = async (req, res) => {
    const id = req.body.id;
    const email = req.body.email;
    // show info from dealer db
    const dealer = await Dealer.findOne({ email: email});
    const dealerShows = dealer.shows;
    const dealerShow = await dealerShows.find(dealerShow => dealerShow.id === id);

    // show info from show db
    const show = await Show.findOne({ _id: id });
    const showObject = helperFunctions.createShowObject(show);
    const numberOfTablesForRent = show.number_of_tables_for_rent;
    const maxTablesPerDealer = show.max_tables_per_dealer;
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

    res.render('edit-rsvp', {
        email: email,
        dealerShow: dealerShow,
        show: showObject,
        maxTablesAvailable: maxTablesAvailable,
        tablesAvailable: tablesAvailable
    });
}

exports.update_rsvp = async (req, res) => {
    const id = req.body.id;
    const tableRent = req.body.table_rent
    const email = req.body.email;
    const oldNumberOfTables = req.body.old_number_of_tables;
    const numberOfTables = req.body.number_of_tables;
    const change = oldNumberOfTables - numberOfTables;
    const notes = req.body.notes;
    const rentDue = tableRent * numberOfTables;
    
    await Show.findOneAndUpdate(
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

    res.render('update-confirmation');
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
            console.log(err);
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
            console.log(err);
            res.render('error');    
        });

    next();
}
