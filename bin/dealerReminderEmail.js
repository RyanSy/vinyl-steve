const Show = require('../models/show');
const mongoose = require('mongoose');
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

// Connect to MongoDB
async function connectToDB() {
    console.log('Connecting to MongoDB...');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected.');
    } catch(err) {
        console.error(err);
    }
}

// Get shows that are 72 hours away
async function getShowsWithin72Hours() {
    console.log('Finding shows within 72 hours...');
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // "2025-05-20"
    const in72Hours = new Date(today.getTime() + 72 * 60 * 60 * 1000);

    try {
        const shows = await Show.find({
            posted_by: { $in: ['mayfieldmouse', 'john bastone'] },
            date: { $gt: todayString }
        });
        
        try {
            await mongoose.connection.close();
            console.log('Mongoose connection closed.');
        } catch (error) {
            console.error('Error closing Mongoose connection:', error);
        }

        const showsWithin72Hours = shows.filter(show => {
            const showDate = new Date(show.date); // Convert "YYYY-MM-DD" to Date
            return showDate >= today && showDate <= in72Hours;
        });

        return showsWithin72Hours;
    } catch(err) {
        console.error('Error finding shows:', err);
    }
}

async function emailDealerReminders(showInfo) {
    console.log('Emailing dealer reminders...');
    
    const dealers = showInfo.dealer_rsvp_list;
    const dealerEmails = dealers.map(dealer => dealer.email);

    const showName = showInfo.name;

    const showDate = showInfo.date;
    const jsDate = new Date(showDate);
    const showDateFormatted = jsDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const senderName = showInfo.contact_name;
    
    const contactEmail = showInfo.contact_email;
    
    let senderEmail;
    if (contactEmail == 'clubmekon@gmail.com' || contactEmail == 'recordriots@gmail.com' || contactEmail == 'ryanb.sy@gmail.com') {
        senderEmail = '"Steve Gritzan" <steve@vinylsteve.com>';
    }
    if (contactEmail == 'exilecds@optonline.net' || contactEmail == 'johnbastone@optonline.net') {
        senderEmail = '"John Bastone" <john@vinylsteve.com>';
    }

    const textBody = `Hello, \n\n This is a friendly reminder that you are registered for ${showName} on ${showDateFormatted}. Please log into https://vinylsteve.com for full details of your RSVP. \n\n Thank you, \n ${senderName}`;

    const htmlBody = `
        <p>Hello,</p>

        <p>
            This is a friendly reminder that you are registered for ${showName} on ${showDateFormatted}. Please log into <a href="https://vinylsteve.com" target="_blank">Vinyl Steve</a> for full details of your RSVP.
        </p>

        <p>Thank you,<br>
            ${senderName}
        </p>
    `;

    try {
        await transporter.sendMail({
            from: senderEmail,
            to: "Vinyl Steve Dealers", 
            bcc: 'ryanbsy@gmail.com',
            subject: `RSVP Reminder for ${showName} on ${showDateFormatted}`,
            text: textBody, // plain text body
            html: htmlBody
        });

        console.log('Emails sent.');
    } catch(err) {
        console.error('Error sending emails:', err);
    }
}

async function main() {
    connectToDB();

    const shows  = await getShowsWithin72Hours();

    if (shows.length > 0) {
        shows.forEach(show => emailDealerReminders(show));
    } else {
        console.log('No shows found.');
    }
}

main();