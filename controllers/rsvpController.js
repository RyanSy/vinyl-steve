const Show = require('../models/show'); 
const Dealer = require('../models/dealer');
const Rsvp = require('../models/rsvp');
const helperFunctions = require('../util/helperFunctions');
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

// save rsvp
exports.save_rsvp = async (req, res, next) => {
    const user = req.session.name;
    // *** TODO *** find fallbak image
    const userImage = req.session.image;
    const userEmail = req.session.email;

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
    const dealerName = req.session.name;
    const numberOfTables = req.body.number_of_tables;
    const dealerNotes = req.body.notes;
    const paid = req.body.paid;
    const newNumberOfTablesForRent = numberOfTablesForRent - numberOfTables;

    const rentDue = numberOfTables * tableRent;

    const show = await Show.find({ _id: showId });

    const postedBy = show[0].posted_by;

    let postedBySteve;
    let postedByJohn;
    let dealerListSteve;
    let dealerListJohn;

    if (postedBy == 'mayfieldmouse') {
        postedBySteve = true;
        dealerListSteve = true;
        postedByJohn = false;
    }
    if (postedBy == 'john bastone') {
        postedByJohn = true;
        dealerListJohn = true;
        postedBySteve = false;
    }

    // if dealer rsvp list contains user, dont save and inform user
    const containsDealer = show[0].dealer_rsvp_list.some((user) => user.email === req.session.email);
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
        rent_due: rentDue,
        posted_by_steve: postedBySteve,
        posted_by_john: postedByJohn
    };
    show[0].number_of_tables_for_rent = newNumberOfTablesForRent;
    show[0].dealer_rsvp_list.addToSet(dealerRsvp);
    show[0].save();

    // save rsvp to dealers db
    const filter = { 
        email: userEmail 
    };

    const update = { 
        $set: {
            dealer_list_steve: dealerListSteve,
            dealer_list_john: dealerListJohn
        },    
        $push: {
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
                rent_due: rentDue,
                posted_by: postedBy,
                posted_by_steve: postedBySteve,
                posted_by_john: postedByJohn
            }
        } 
    };

    // const options = { 
    //     new: true
    // };

    Dealer.findOneAndUpdate(filter, update)
        .catch((err) =>{
            console.log(err);
            res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
        });

    // save to rsvp collection
    const rsvp = new Rsvp({
        name: user,
        show: showName,
        date: showDate,
        posted_by: postedBy,
        tables_rented: numberOfTables,
        rent_due: rentDue,
        createdAt: new Date()
    });

    await rsvp.save()
            .catch((err) => {
                console.log(err);
                res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
            });
    
    let paymentMessage;

    postedBySteve ? paymentMessage = 'You can pay for your tables with ??? or CREDIT CARD through the Vinyl Steve payment portal OR pay for tables in CASH on the day of the show when we collect (around 2 PM). Either method is acceptable.' : paymentMessage = 'Table rent (in CASH or VENMO) will be collected around 1:30PM.'
    // send confirmation email
    const textMessage = `Thanks ${user}! Your RSVP for the Jersey City Record Riot on Saturday, April 5th, 2025 has been confirmed. We're happy that you'll be selling with us! \r\n ${paymentMessage} \r\n If your circumstances change and you need to CANCEL your reservation, it is YOUR responsibility to go back into www.vinylsteve.com and cancel the reservation in your account---not by calling or texting us. Abuse of NOT cancelling your RSVP could lead to a pre-payment requirement. Please be thoughtful. \r\n We greatly appreciate your support of Record Riots! \r\n Steve & John \r\n PS: When is load-in time? All Record Riots start at 10 AM and load-in GENERALLY starts at 8 AM. Please check info for the Vinyl Steve website for specific details of load-in at each venue---but you'll NEVER be wrong arriving at 8 AM!`;

    const htmlMessage = `<p>Thanks ${user}! Your RSVP for the ${showName} on ${showDate} has been confirmed. We're happy that you'll be selling with us!</p> 

    <p>You can pay for your tables in advance with a CREDIT CARD through the Vinyl Steve payment portal OR pay for tables in CASH on the day of the show when we collect (around 2 PM). Either method is acceptable.</p>

    <p>If your circumstances change and you need to CANCEL your reservation, it is YOUR responsibility to go back into www.vinylsteve.com and cancel the reservation in your account---not by calling or texting us. Abuse of NOT cancelling your RSVP could lead to a pre-payment requirement. Please be thoughtful.</p>

    <p>We greatly appreciate your support of Record Riots!</p>

    <p>Steve & John</p>

    <p>PS: When is load-in time? All Record Riots start at 10 AM and load-in GENERALLY starts at 8 AM. Please check info for the Vinyl Steve website for specific details of load-in at each venue---but you'll NEVER be wrong arriving at 8 AM!</p>`;

    async function main() {
        await transporter.sendMail({
            from: '"Vinyl Steve" <info@vinylsteve.com>', // sender address
            to: userEmail, // recipient
            subject: `RSVP Confirmation: ${showName} - ${showDate}`, // subject line
            text: textMessage, // plain text body
            html: htmlMessage // html body
        });
    }

    main().catch(console.error);

    // data for confirmation message
    const dataObject = {
        name: user,
        image: userImage,
        email: userEmail,
        id: showId,
        name: showName,
        date: showDate,
        rentDue: rentDue,
        posted_by_steve: postedBySteve,
        posted_by_john: postedByJohn,
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
    if (numberOfTablesForRent + dealerShow.number_of_tables < maxTablesPerDealer) {
        maxTablesAvailable = numberOfTablesForRent + dealerShow.number_of_tables;
    } else {
        maxTablesAvailable = maxTablesPerDealer;
    }
    let tablesAvailable = true;
    if (maxTablesAvailable == 0) {
        tablesAvailable = false;
    }

    res.render('edit-rsvp', {
        name: req.session.name,
        image: req.session.image,
        email: email,
        dealerShow: dealerShow,
        show: showObject,
        maxTablesPerDealer: maxTablesPerDealer, 
        maxTablesAvailable: maxTablesAvailable,
        tablesAvailable: tablesAvailable
    });
}

exports.update_rsvp = async (req, res, next) => {
    const id = req.body.id;
    const tableRent = req.body.table_rent;
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
        res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
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
        res.render('error', {userName: req.oidc.user.name, userEmail: req.oidc.user.email});
    });

    if (req.body.updated_by_admin) {
        req.flash('rsvpUpdated', 'RSVP has been updated.');
        res.redirect(`/admin/rsvp-list/${id}`);
    } else{
        next();
    }
}

exports.render_update_confirmation = (req, res) => {
    res.render('update-confirmation', {
        name: req.session.name,
        image: req.session.image
    });
}