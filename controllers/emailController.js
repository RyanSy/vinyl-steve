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

// email all dealers - from rsvp list view
exports.email_all_dealers = async (req, res) => {
    const id = req.body.id;
    const dealerEmails = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;
    const adminEmail = req.oidc.user.email;
    let replyTo;
    
    if (adminEmail == 'clubmekon@gmail.com' || adminEmail == 'recordriots@gmail.com' || adminEmail == 'ryanb.sy@gmail.com') {
        replyTo = '"Steve Gritzan" <steve@vinylsteve.com>';
    }
    
    if (adminEmail == 'exilecds@optonline.net' || adminEmail == 'johnbastone@optonline.net') {
        replyTo = '"John Bastone" <john@vinylsteve.com>';
    }
    
    async function main() {
        await transporter.sendMail({
            from: replyTo, // sender address
            to: "Vinyl Steve Dealers", 
            bcc: dealerEmails, // list of receivers
            subject: subject, // subject line
            text: message, // plain text body
            /**
             * html:// html body
             *  */ 
        });
    }

    main().catch(console.error);

    req.flash('messageSent', 'Message sent successfully.');

    res.redirect(`/admin/rsvp-list/${id}`);
};

// email individual dealer - from rsvp list view
exports.email_individual_dealer = async (req, res) => {
    const id = req.body.id;
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;
    const adminEmail = req.oidc.user.email;
    let replyTo;
    
    if (adminEmail == 'clubmekon@gmail.com' || adminEmail == 'recordriots@gmail.com' || adminEmail == 'ryanb.sy@gmail.com') {
        replyTo = '"Steve Gritzan" <steve@vinylsteve.com>';
    }
    
    if (adminEmail == 'exilecds@optonline.net' || adminEmail == 'johnbastone@optonline.net') {
        replyTo = '"John Bastone" <john@vinylsteve.com>';
    }
    
    async function main() {
        await transporter.sendMail({
            from: replyTo, // sender address
            to: email, // recipient
            subject: subject, // subject line
            text: message, // plain text body
            /**
             * html:// html body
             *  */ 
        });
    }

    main().catch(console.error);

    req.flash('messageSent', 'Message sent successfully.');

    res.redirect(`/admin/rsvp-list/${id}`);
};

// email all dealers - from dealers list view
exports.email_all_dealers_from_dealers_list = async (req, res) => {
    const emails = req.body.emails;
    const subject = req.body.subject;
    const message = req.body.message;
    const adminEmail = req.oidc.user.email;
    let replyTo;
    
    if (adminEmail == 'clubmekon@gmail.com' || adminEmail == 'recordriots@gmail.com' || adminEmail == 'ryanb.sy@gmail.com') {
        replyTo = '"Steve Gritzan" <steve@vinylsteve.com>';
    }
    
    if (adminEmail == 'exilecds@optonline.net' || adminEmail == 'johnbastone@optonline.net') {
        replyTo = '"John Bastone" <john@vinylsteve.com>';
    }

    async function main() {
        await transporter.sendMail({
            from: replyTo, // sender address
            to: "Vinyl Steve Dealers", // list of receivers
            bcc: emails,
            subject: subject, // subject line
            text: message, // plain text body
            /**
             * html:// html body
             *  */ 
        });
    }

    main().catch(console.error);

    req.flash('messageSent', 'Message sent successfully.');

    res.redirect('/admin/dealers-list');
};

// email individual dealer - from dealer list view
exports.email_individual_dealer_from_dealers_list = async (req, res) => {
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;
    const adminEmail = req.oidc.user.email;
    let replyTo;
    
    if (adminEmail == 'clubmekon@gmail.com' || adminEmail == 'recordriots@gmail.com' || adminEmail == 'ryanb.sy@gmail.com') {
        replyTo = '"Steve Gritzan" <steve@vinylsteve.com>';
    }
    
    if (adminEmail == 'exilecds@optonline.net' || adminEmail == 'johnbastone@optonline.net') {
        replyTo = '"John Bastone" <john@vinylsteve.com>';
    }
    
    async function main() {
        await transporter.sendMail({
            from: replyTo, // sender address
            to: email, // recipient
            subject: subject, // subject line
            text: message, // plain text body
            /**
             * html:// html body
             *  */ 
        });
    }

    main().catch(console.error);

    req.flash('messageSent', 'Message sent successfully.');

    res.redirect('/admin/dealers-list');
};

// email individual dealers - from waiting list view
exports.email_individual_dealer_from_waitinglist = (req, res) => {
    const show_id = req.body.show_id;
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;
    const adminEmail = req.oidc.user.email;
    let replyTo;
    
    if (adminEmail == 'clubmekon@gmail.com' || adminEmail == 'recordriots@gmail.com' || adminEmail == 'ryanb.sy@gmail.com') {
        replyTo = '"Steve Gritzan" <steve@vinylsteve.com>';
    }
    
    if (adminEmail == 'exilecds@optonline.net' || adminEmail == 'johnbastone@optonline.net') {
        replyTo = '"John Bastone" <john@vinylsteve.com>';
    }
    
    async function main() {
        await transporter.sendMail({
            from: replyTo, // sender address
            to: email, // recipient
            subject: subject, // subject line
            text: message, // plain text body
            /**
             * html:// html body
             *  */ 
        });
    }

    main().catch(console.error);

    req.flash('messageSent', 'Message sent successfully.');

    res.redirect(`/admin/waitinglist/${show_id}`);
} 

// send email from error page
exports.email_support= (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const message = req.body.message;
    
    async function main() {
        await transporter.sendMail({
            from: '"Vinyl Steve" <info@vinylsteve.com>', // sender address
            to: 'support@vinylsteve.com', // recipient
            subject: `User message from ${name} via error page`, // subject line
            text: `${message} \n reply to: ${email}`, // plain text body
            /**
             * html:// html body
             *  */ 
        });
    }

    main().catch(console.error);

    req.flash('messageSent', 'Message sent successfully.');

    res.redirect('/');
} 
// use below script if app is always on/heroku dynos do not sleep
// // send daily email summary at 9pm
// cron.schedule('01 21 * * *', () => {
//     const now = new Date();
//     const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

//     async function findRsvps() {
//         const results = await Rsvp.find({
//             createdAt: {
//                 $gte: yesterday,
//                 $lte: now
//             }
//         });
//         return results;
//     }

//     findRsvps()
//         .then((rsvps) => {
//             const rsvpList = rsvps.map((rsvp) => `<li>${rsvp.name} - ${rsvp.show} / ${rsvp.date}</li>`).join('');
//             const today = new Date().toDateString();
//             async function main() {
//                 await transporter.sendMail({
//                     from: '"Vinyl Steve" <info@vinylsteve.com>', // sender address
//                     to: ['clubmekon@gmail.com', 'ryanbsy@gmail.com'], // recipient
//                     subject: 'Daily Summary from Vinyl Steve', // subject line
//                     text: `Daily Summary for ${today} \n ${rsvpList}`, // plain text body
//                     html: `<h3>Daily Summary for ${today}:<h3>
//                             ${rsvpList}`
//                 });
//             }

//             main().catch(console.error);
//         })
//         .catch((err) => {
//             console.error(err);
//         });
// }, {
//     scheduled: true,
//     timezone: 'America/New_York'
// });