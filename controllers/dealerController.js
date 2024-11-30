const Show = require('../models/show');
const Dealer = require('../models/dealer');
const Cancellation = require('../models/cancellation');
const moment = require('moment');

// check if dealer exists, if so, list shows, if not prompt for info
exports.check_if_dealer_exists = async (req, res, next) => {
    const image = JSON.stringify(req.oidc.user.picture).replace(/"/g, '');
    const email = JSON.stringify(req.oidc.user.email).replace(/"/g, '');

    const filter = { 
        email: email 
    };

    await Dealer.findOne(filter)
        .then((result) => {
            if (result == null) {
                const userInfo = {
                    image: image,
                    email: email
                };
                res.render('signup-form', userInfo);
            }
            else if (result.first_name) {
                req.session.user_id = result._id.toString();
                req.session.name = `${result.first_name} ${result.last_name}`;
                req.session.email = result.email;
                req.session.image = result.image;
                next();
            }
            // next clause included because dealer model included only one property for name
            else if (result.name) {
                req.session.user_id = result._id.toString();
                req.session.name = result.name;
                req.session.email = result.email;
                req.session.image = result.image;
                next();
            }
        })
        .catch((err) =>{
            console.log(err);
            res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
        });
}

// save dealer info
exports.save_dealer_info = async (req, res, next) => {
    const dealerInfo = req.body;
    req.session.name = `${req.body.first_name} ${req.body.last_name}`;
    req.session.email = req.body.email;
    req.session.image = req.body.image;
    const newDealer = new Dealer(dealerInfo);
    await newDealer.save()
        .then((user) => {
            req.session.user_id = user._id;
        })
        .catch((err) => {
            console.log(err);
            res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
        });
    res.redirect('/home');
}

// show dealer rsvps - dealer view
exports.show_dealer_rsvps = async (req, res) => {
    const name = req.session.name;
    // *** TODO *** find fallbak image
    const image = req.session.image;
    const email = req.session.email;

    // define paypal client id based on who posted show
    const paypalClientIdSteve = process.env.PAYPAL_CLIENT_ID_STEVE;
    // const paypalClientIdJohn = process.env.PAYPAL_CLIENT_ID_JOHN;

    let message;
    let shows;

    await Dealer.find({ email: email })
        .then(async (result) => {
            if (!result[0]) {
                message = 'You have no shows listed.';
            }
            
            if (result[0]) {
                if (result[0].shows.length == 0) {
                    message = 'You have no shows listed.';
                }
                
                if (result[0].shows.length > 0) {
                    let sortByDate = (array) => {
                        return array.sort(function (a, b) {
                            return new Date(moment(a.date, 'dddd, MMMM Do YYYY')) - new Date(moment(b.date, 'dddd, MMMM Do YYYY'));
                        });
                    };
                    shows = sortByDate(result[0].shows);

                }       
            } 
        })
        .catch((err) =>{
            console.log(err);
            res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
        });
        
    const dataObject = {
        name: name,
        image: image,
        email: email,
        shows: shows,
        message: message,
        discountFailure: req.flash('discountFailure'),
        discountSuccess: req.flash('discountSuccess'),
        paypalClientIdSteve: paypalClientIdSteve
        // paypalClentIdJohn: paypalClientIdJohn
    }

    res.render('my-rsvps', dataObject);
}

// delete rsvp - dealer
exports.delete_rsvp = async (req, res, next) => {
    const name = req.session.name;
    const email = req.session.email;
    const showId = req.body.show_id;
    const showName = req.body.show_name;
    const date = req.body.date;
    const postedBy = req.body.posted_by;
    const numberOfTables = Number(req.body.number_of_tables);

    // update show collection
    const showFilter = {
        _id: showId
    };
    const showUpdate = { 
        $pull: {
            dealer_rsvp_list: {
                email: email
            }
        },
        $inc: {
            number_of_tables_for_rent: numberOfTables
        }
    };
    await Show.updateOne(showFilter, showUpdate)
        .catch((err) => {
            console.log(err)
            res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
            return;    
        });

    // update dealer collection
    const dealerFilter = { 
        email: email 
    };
    const dealerUpdate = { $pull: {
        shows: {
            id: showId
        }
    } };
    await Dealer.updateOne(dealerFilter, dealerUpdate)
        .catch((err) => {
            console.log(err)
            res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
            return;    
        });

    // save to cancellation collection
    const cancellation = new Cancellation({
        name: name,
        show: showName,
        date: date,
        posted_by: postedBy,
        canceledOn: new Date()
    });

    await cancellation.save()
            .catch((err) => {
                console.log(err);
                res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
            });
    
    next();
}

// save dealer to waitinglist
exports.save_dealer_to_waitinglist = async (req, res) => {
    const show = await Show.find({ _id: req.body.id });
    show[0].waiting_list.addToSet({ user_id: req.body.user_id, name: req.body.name, email: req.body.email });
    show[0].save();
    res.render('waitinglist-confirmation');
}

// render discount page
exports.render_discount_page = (req, res) => {
    const id = req.params.id;
    res.render('discount', { id: id });
}

// apply discount
exports.save_discount = async (req, res, next) => {
    const id = req.body.id;
    const email = req.body.email;
    const rent = req.body.rent;
    const discount_code = req.body.code;
    let amount;

    // verify discount code and amount
    await Show.findOne({ _id: id})
            .then((show) => {
                const discountCode = show.discount_codes.find(({ code }) => code === discount_code);
                if (discountCode) {
                    req.flash('discountSuccess', 'Discount code has been applied.');
                    amount = discountCode.amount;
                }  else {
                    req.flash('discountFailure', 'Discount code not found.');
                }
            })
            .catch((err) => {
                console.log(err)
                res.render(err);
            });

    // update shows db
    await Show.findOneAndUpdate(
        { _id: id } ,
        { 
            $set: {
                'dealer_rsvp_list.$[el].rent_due': rent - amount
            }
        },
        { arrayFilters: [ { 'el.email': email }] }
    )
    .catch((err) => {
        console.log(err);
        res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
    });

    await Dealer.findOneAndUpdate(
        { email: email },
        { $set: {
            'shows.$[el].rent_due': rent - amount
            }
        },
        { arrayFilters: [{ 'el.id': id }] }
    )
    .catch((err) => {
        console.log(err);
        res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
    });

    res.redirect('/my-rsvps')
}

// render edit profile page
exports.render_edit_profile = async (req, res) => {
    let dealerInfo;
    await Dealer.findOne({ email: req.session.email })
        .then((result) => {
            dealerInfo = result;
        })
        .catch((err) => {
            console.log(err);
            res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
        });
    res.render('edit-profile', {
        dealerInfo: dealerInfo,
        image: dealerInfo.image
    });
}

// save profile
exports.save_profile = async (req, res) => {
    const filter = { email: req.session.email };

    const update = req.body;

    await Dealer.findOneAndUpdate(filter, update)
        .catch((err) => {
            console.log(err);
            res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
        });
    
    req.flash('profileUpdated', 'Profile has been successfully updated.');

    res.redirect('/home');
}