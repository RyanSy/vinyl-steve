const Show = require('../models/show');
const Dealer = require('../models/dealer');

// show dealer rsvps - dealer view
exports.show_dealer_rsvps = async (req, res) => {
    const user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
    // *** TODO *** find fallbak image
    const userImage = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const userEmail = JSON.stringify(req.oidc.user.email).replace(/"/g, '');

    let message;
    let shows;

    await Dealer.find({ name: user, email: userEmail })
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
        userEmail: userEmail,
        shows: shows,
        message: message
    }
    res.render('my-rsvps', dataObject);
}

exports.delete_rsvp = async (req, res) => {
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
            name: userName,
            email: userEmail
        }
    } }
    await Show.updateOne(showFilter, showUpdate);  

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
    Dealer.updateOne(dealerFilter, dealerUpdate)
        .then(() => {
            res.render('delete-confirmation', { userImage: userImage });
        })
        .catch((err) => {
            res.render('error');
        });  
}