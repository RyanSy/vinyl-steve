const Show = require('../models/show');
const Dealer = require('../models/dealer');

// save dealer rsvp - pay at event
exports.save_rsvp_pay_later = async (req, res) => {
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

    // save show details
    const show = await Show.find({ _id: showId });
    const dealerRsvp = {
        name: dealerName,
        number_of_tables: numberOfTables,
        notes: dealerNotes
    };

    show[0].number_of_tables_for_rent = numberOfTablesForRent - numberOfTables;
    show[0].dealer_rsvp_list.addToSet(dealerRsvp);
    show[0].save();

    // save dealer details
    const filter = { 
        name: user,
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
            notes: dealerNotes
        }
    } };

    const options = { 
        upsert: true, 
        new: true, 
        setDefaultsOnInsert: true 
    };

    Dealer.findOneAndUpdate(filter, update, options)
        .catch((err) =>{
            console.log(err);
            res.render('error');
        });

    // data for confirmation message
    const dataObject = {
        user: user,
        userImage: userImage,
        name: showName,
        date: showDate
    }

    res.render('confirmation', dataObject);
};


exports.show_dealer_rsvps = async (req, res) => {
    const user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const userImage = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const userEmail = JSON.stringify(req.oidc.user.email).replace(/"/g, '');

    let message;
    let shows;

    await Dealer.find({ name: user, email: userEmail })
        .then((result) => {
            result[0] == undefined ?  message = 'You have no RSVPs at this time.' : shows = result[0].shows;
        })
        .catch((err) =>{
            console.log(err);
            res.render('error');
        });

    const dataObject = {
        user: user,
        userImage: userImage,
        userEmail: userEmail,
        shows: shows,
        message: message
    }
    res.render('my-rsvps', dataObject);
}

exports.delete_rsvp = (req, res) => {
    const show_id = req.body.show_id;
    const userName = req.body.name;
    const userEmail = req.body.email;
    const filter = { 
        name: userName,
        email: userEmail 
    };
    const update = { $pull: {
        shows: {
            id: show_id
        }
    } };
    Dealer.updateOne(filter, update)
        .then(() => {
            res.render('delete-confirmation');
        })
        .catch((err) => {
            res.render('error');
        })
}