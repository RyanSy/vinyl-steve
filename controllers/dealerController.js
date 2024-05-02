const Show = require('../models/show');
const Dealer = require('../models/dealer');

// save dealer rsvp - pay at event
exports.save_rsvp_pay_later = async (req, res) => {
    const user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const userImage = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const showId = req.body.id;
    const showName = req.body.name;
    const numberOfTablesForRent = req.body.number_of_tables_for_rent;
    const dealerName = req.body.user;
    const numberOfTables = req.body.number_of_tables;
    const dealerNotes = req.body.notes;

    // save show details
    const show = await Show.find({ _id: showId });
    const dealerRsvp = {
        name: dealerName,
        showId: showId,
        number_of_tables: numberOfTables,
        notes: dealerNotes
    };
    show[0].number_of_tables_for_rent = numberOfTablesForRent - numberOfTables;
    show[0].dealer_rsvp_list.addToSet(dealerRsvp);
    show[0].save();

    // save dealer details
    const filter = { name: dealerName };
    const update = { $push: {
        shows: { 
            id: showId,
            number_of_tables: numberOfTables,
            notes: dealerNotes
        }
    } };
    const options = { 
        upsert: true, 
        new: true, 
        setDefaultsOnInsert: true 
    };

    Dealer.findOneAndUpdate(filter, update, options);

    const dataObject = {
        user: user,
        userImage: userImage,
        name: req.body.name
    }
    res.render('confirmation', dataObject);
};
