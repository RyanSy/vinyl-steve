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

    // define paypal client id based on who posted show
    let paypalClientIdSteve;
    let paypalClientIdJohn;
    let postedBySteve;
    let postedByJohn;

    if (show[0].posted_by == 'mayfieldmouse') {
        paypalClientIdSteve = process.env.PAYPAL_CLIENT_ID_STEVE;
        postedBySteve = true;
        postedByJohn = false;
    }
    if (show[0].posted_by == 'john bastone') {
        paypalClientIdJohn = process.env.PAYPAL_CLIENT_ID_JOHN;
        postedByJohn = true;
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
        paypalClientIdSteve: paypalClientIdSteve,
        paypalClientIdJohn: paypalClientIdJohn,
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
            rent_due: rentDue,
            paypalClientIdSteve: paypalClientIdSteve,
            paypalClientIdJohn: paypalClientIdJohn,
            posted_by_steve: postedBySteve,
            posted_by_john: postedByJohn
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

    // save to rsvp collection
    const rsvp = new Rsvp({
        name: user,
        show: showName,
        date: showDate,
        tables_rented: numberOfTables,
        rent_due: rentDue,
        createdAt: new Date()
    });

    await rsvp.save()
            .catch((err) => {
                console.log(err);
                res.render('error');
            });

    // send confirmation email
    const textMessage = "Thanks Ryan! Your RSVP for the Jersey City Record Riot on Saturday, April 5th, 2025 has been confirmed. We're happy that you'll be selling with us! \r\n You can pay for your tables with PAYPAL or CREDIT CARD through the Vinyl Steve payment portal OR pay for tables in CASH on the day of the show when we collect (around 2 PM). Either method is acceptable. \r\n If your circumstances change and you need to CANCEL your reservation, it is YOUR responsibility to go back into www.vinylsteve.com and cancel the reservation in your account---not by calling or texting me. If you are still listed on the Record Riot dealer list on the date of the show, then you are liable for the rent of those tables. So be thoughtful and keep my dealer lists clean and accurate! \r\n I greatly appreciate your support of Record Riots! -Steve \r\n PS: When is load-in time? All Record Riots start at 10 AM and load-in GENERALLY starts at 8 AM. Please check info for the Vinyl Steve website for specific details of load-in at each venue---but you'll NEVER be wrong arriving at 8 AM!";

    const htmlMessage = `<p>Thanks ${user}! Your RSVP for the ${showName} on ${showDate} has been confirmed. We're happy that you'll be selling with us!</p> 

    <p>You can pay for your tables with PAYPAL or CREDIT CARD through the Vinyl Steve payment portal OR pay for tables in CASH on the day of the show when we collect (around 2 PM). Either method is acceptable.</p>

    <p>If your circumstances change and you need to CANCEL your reservation, it is YOUR responsibility to go back into www.vinylsteve.com and cancel the reservation in your account---not by calling or texting me. If you are still listed on the Record Riot dealer list on the date of the show, then you are liable for the rent of those tables. So be thoughtful and keep my dealer lists clean and accurate!</p>

    <p>I greatly appreciate your support of Record Riots!  -Steve</p>

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
        paypalClientIdSteve: paypalClientIdSteve,
        paypalClentIdJohn: paypalClientIdJohn,
        posted_by_steve: postedBySteve,
        posted_by_john: postedByJohn
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
        name: req.session.name,
        image: req.session.image,
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

    res.render('update-confirmation', {
        name: req.session.name,
        image: req.session.image
    });
}