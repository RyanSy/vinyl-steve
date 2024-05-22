const Show = require('../models/show');
const Dealer = require('../models/dealer');

// check if dealer exists, if so, list shows, if not prompt for info
exports.check_if_dealer_exists = async (req, res, next) => {
    const user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const userImage = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const userEmail = JSON.stringify(req.oidc.user.email).replace(/"/g, '');

    const filter = { 
        email: userEmail 
    };

    await Dealer.find(filter)
        .then((result) => {
            if (result.length > 0) {
                next();
            } else {
                const userInfo = filter;
                res.render('signup-form', userInfo);
            }
        })
        .catch((err) =>{
            console.log(err);
            res.render('error');
        });
}

// save dealer info
exports.save_dealer_info = async (req, res, next) => {
    const dealerInfo = req.body;
    const newDealer = new Dealer(dealerInfo);
    await newDealer.save()
        .catch((err) => {
            console.log(err);
            res.render('error');
        });
    res.redirect('/home');
}

// show dealer rsvps - dealer view
exports.show_dealer_rsvps = async (req, res) => {
    const user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const userImage = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const email = JSON.stringify(req.oidc.user.email).replace(/"/g, '');

    let message;
    let shows;

    await Dealer.find({ email: email })
        .then((result) => {
            if (!result[0]) {
                message = 'You have no shows listed.';
            } else if (result[0]) {
                if (result[0].shows.length == 0) {
                    message = 'You have no shows listed.';
                }
                shows = result[0].shows;
            } 

        })
        .catch((err) =>{
            console.log(err);
            res.render('error');
        });
    
    const dataObject = {
        user: user,
        userImage: userImage,
        email: email,
        shows: shows,
        message: message,
        paypalClientId: process.env.PAYPAL_CLIENT_ID
    }
    res.render('my-rsvps', dataObject);
}

exports.delete_rsvp = async (req, res, next) => {
    const user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const userImage = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const userEmail = JSON.stringify(req.oidc.user.email).replace(/"/g, '');
    const showId = req.body.show_id;
    const name = req.body.name;
    const numberOfTables = Number(req.body.number_of_tables);

    // update show collection
    const showFilter = {
        _id: showId
    };
    const showUpdate = { 
        $pull: {
            dealer_rsvp_list: {
                name: name
                // email: userEmail
            }
        },
        $inc: {
            number_of_tables_for_rent: numberOfTables
        }
    };
    await Show.updateOne(showFilter, showUpdate)
        .catch((err) => {
            console.log(err)
            res.render('error');
            return;    
        });

    // update dealer collection
    const dealerFilter = { 
        name: name
        // email: userEmail 
    };
    const dealerUpdate = { $pull: {
        shows: {
            id: showId
        }
    } };
    await Dealer.updateOne(dealerFilter, dealerUpdate)
        .catch((err) => {
            consolw.log(err)
            res.render('error');
            return;    
        });

    next();
}

// save dealer to waitlist
exports.save_dealer_to_waitlist = async (req, res) => {
    const show = await Show.find({ _id: req.body.id })
        .catch((err) => {
            console.log(err);
            res.render('error');
        });
    show[0].waiting_list.addToSet({ email: req.body.email });
    show[0].save();
    res.render('waitlist-confirmation');
}