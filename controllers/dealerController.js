const Show = require('../models/show');
const Dealer = require('../models/dealer');
const Cancellation = require('../models/cancellation');
const moment = require('moment');
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

// Show docs use posted_by to indicate which organizer to send dealer-facing
// email from ('mayfieldmouse' = Steve, 'john bastone' = John). Falls back to
// Steve's address for any other value so a sendMail call never gets an
// empty 'from'.
function getSenderEmail(postedBy) {
    if (postedBy === 'john bastone') {
        return '"John Bastone" <john@vinylsteve.com>';
    }
    return '"Steve Gritzan" <steve@vinylsteve.com>';
}

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
    res.redirect('/my-rsvps');
}

// show dealer rsvps - dealer view
exports.show_dealer_rsvps = async (req, res) => {
    const name = req.session.name;
    // *** TODO *** find fallback image
    const image = req.session.image;
    const email = req.session.email;
 
    let message;
    let shows = []; // Array is now 'shows' and will only contain upcoming events
    let waitingListShows = []; // Shows the dealer is on the waiting list for (upcoming only)

    // Helper function to sort shows by date
    // Sorts in ascending order (oldest date first) to show the next upcoming show first.
    let sortByDate = (array, ascending = true) => {
        return array.sort(function (a, b) {
            // Use moment with the formatted date string for reliable date comparison
            const dateA = moment(a.date, 'MMM D, YYYY');
            const dateB = moment(b.date, 'MMM D, YYYY');

            if (ascending) {
                return dateA - dateB;
            } else {
                return dateB - dateA;
            }
        });
    };

    try {
        const result = await Dealer.find({ email: email });

        if (!result[0] || result[0].shows.length === 0) {
            // No dealer found or dealer has no RSVP history
            message = 'You have no shows listed.';
        } else {
            const allShows = result[0].shows;

            for (let i = 0; i < allShows.length; i++) {
                const dealerShow = allShows[i];
                
                // Fetch the full show details using the ID stored in the dealer's array
                const showData = await Show.findOne({ _id: dealerShow.id }); 

                if (showData) {
                    const rawDate = showData.date; // Assuming this is in a sortable format like YYYY-MM-DD
                    const formattedDate = moment(rawDate).format('MMM D, YYYY');
                    
                    // Assign the formatted date and location for display
                    dealerShow.date = formattedDate; 
                    dealerShow.city = showData.city; 
                    dealerShow.state = showData.state; 

                    // Check if the show date is today or in the future
                    if (moment().isSameOrBefore(rawDate, 'day')) {
                        shows.push(dealerShow); // Only push upcoming shows
                    } 
                    // Past shows are now ignored and not added to the 'shows' array.
                } else {
                    console.log(`Show with ID ${dealerShow.id} not found and was skipped.`);
                }
            }

            // Apply sorting (ascending, next show first)
            shows = sortByDate(shows, true); 
        }

        // Waiting list is stored on the Show doc itself (waiting_list array),
        // not on the Dealer doc, so it needs its own query.
        const waitingListShowDocs = await Show.find({ 'waiting_list.email': email });

        for (let i = 0; i < waitingListShowDocs.length; i++) {
            const showData = waitingListShowDocs[i];
            const rawDate = showData.date;

            // Only show upcoming waiting-list entries, same as confirmed RSVPs
            if (moment().isSameOrBefore(rawDate, 'day')) {
                const waitingListEntry = showData.waiting_list.find((entry) => entry.email === email);
                waitingListShows.push({
                    id: showData._id.toString(),
                    user_id: waitingListEntry ? waitingListEntry.user_id : undefined,
                    name: showData.name,
                    city: showData.city,
                    state: showData.state,
                    date: moment(rawDate).format('MMM D, YYYY')
                });
            }
        }

        waitingListShows = sortByDate(waitingListShows, true);
    } catch(err) {
        console.error(err);
        // Handle database or other errors
        res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
        return; 
    }
        
    const dataObject = {
        name: name,
        image: image,
        email: email,
        // Pass the single 'shows' array containing only upcoming RSVPs
        shows: shows,
        waitingListShows: waitingListShows,
        message: message,
        discountFailure: req.flash('discountFailure'),
        discountSuccess: req.flash('discountSuccess'),
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
    
    await transporter.sendMail({
            from: '"Vinyl Steve" <info@vinylsteve.com>', // sender address
            to: 'ryanbsy@gmail.com', 
            subject: 'Vinyl Steve Cancellation', // subject line
            text: `${name} has canceled their RSVP for "${showName}" on ${date}.`, // plain text body
            /**
             * html:// html body
             *  */ 
        }).catch(console.error);

    // notify anyone on the waiting list that a table opened up. Re-query
    // rather than reuse an earlier read, since we need the state after the
    // $inc/$pull above was applied.
    const showAfterCancellation = await Show.findOne({ _id: showId }).catch((err) => {
        console.log(err);
        return null;
    });

    if (showAfterCancellation && showAfterCancellation.waiting_list.length > 0) {
        const senderEmail = getSenderEmail(postedBy);

        const textMessage = `Good news! A table has opened up for ${showName} on ${date}, since another dealer canceled their reservation. If you'd still like a table, please go to vinylsteve.com and RSVP as soon as possible \u2014 tables are given out on a first-come, first-served basis, so this isn't a guaranteed spot. If you're no longer interested, there's nothing you need to do.`;

        const htmlMessage = `<p>Good news! A table has opened up for <strong>${showName}</strong> on ${date}, since another dealer canceled their reservation.</p>
        <p>If you'd still like a table, please go to <a href="https://vinylsteve.com">vinylsteve.com</a> and RSVP as soon as possible &mdash; tables are given out on a first-come, first-served basis, so this isn't a guaranteed spot.</p>
        <p>If you're no longer interested, there's nothing you need to do.</p>`;

        // Send individually (not bcc) so a bad address for one dealer
        // doesn't block delivery to the others.
        for (const entry of showAfterCancellation.waiting_list) {
            await transporter.sendMail({
                from: senderEmail,
                to: entry.email,
                subject: `Table Available: ${showName} - ${date}`,
                text: textMessage,
                html: htmlMessage
            }).catch(console.error);
        }
    }
    
    next();
}

// save dealer to waitinglist
exports.save_dealer_to_waitinglist = async (req, res) => {
    const showId = req.body.id;
    const userId = req.body.user_id;
    const name = req.body.name;
    const email = req.body.email;

    const show = await Show.findOne({ _id: showId });

    // if dealer already has a confirmed RSVP for this show, send them to
    // the same page used elsewhere for that case instead of letting them
    // double up on a waiting list they don't need to be on
    const alreadyRegistered = show.dealer_rsvp_list.some((entry) => entry.email === email);
    if (alreadyRegistered) {
        res.redirect('/already-registered');
        return;
    }

    // if dealer is already on the waiting list, don't add them again
    const alreadyOnWaitingList = show.waiting_list.some((entry) => entry.email === email);
    if (alreadyOnWaitingList) {
        res.redirect('/already-on-waiting-list');
        return;
    }

    // addToSet doesn't dedupe here since waiting_list entries are schema
    // subdocuments (each gets its own auto-generated _id), so the explicit
    // check above is what actually prevents duplicates. This atomic guard
    // also covers the race where two requests from the same dealer land
    // at nearly the same time (including one that RSVPs while the other
    // is still trying to join the waiting list).
    await Show.findOneAndUpdate(
        { _id: showId, 'waiting_list.email': { $ne: email }, 'dealer_rsvp_list.email': { $ne: email } },
        { $push: { waiting_list: { user_id: userId, name: name, email: email } } }
    );

    // send waiting list confirmation email
    const senderEmail = getSenderEmail(show.posted_by);

    const textMessage = `Thanks ${name}! You've been added to the waiting list for ${show.name} on ${show.date}. If a table becomes available, we'll email you to let you know \u2014 tables are given out on a first-come, first-served basis, so getting the email isn't a guarantee of a table. You are NOT required to take a "waiting list" table if offered, since often this would be at the last minute. \r\n We appreciate your interest in this event!`;

    const htmlMessage = `<p>Thanks ${name}! You've been added to the waiting list for <strong>${show.name}</strong> on ${show.date}.</p>
    <p>If a table becomes available, we'll email you to let you know &mdash; tables are given out on a first-come, first-served basis, so getting the email isn't a guarantee of a table.</p>
    <p>You are NOT required to take a "waiting list" table if offered, since often this would be at the last minute.</p>
    <p>We appreciate your interest in this event!</p>`;

    await transporter.sendMail({
        from: senderEmail,
        to: email,
        subject: `Waiting List Confirmation: ${show.name} - ${show.date}`,
        text: textMessage,
        html: htmlMessage
    }).catch(console.error);

    res.render('waitinglist-confirmation');
}

// leave waiting list - dealer
exports.leave_waiting_list = async (req, res) => {
    const showId = req.body.show_id;
    const email = req.session.email;

    await Show.updateOne(
        { _id: showId },
        { $pull: { waiting_list: { email: email } } }
    ).catch((err) => {
        console.log(err);
        res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
    });

    res.redirect('/my-rsvps');
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