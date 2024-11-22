const mongoose = require('mongoose');
const Rsvp = require('../models/rsvp');
const Cancellation = require('../models/cancellation');
const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
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

/**
 * email Steve
 */
async function emailSteve() {
    // connect to db
    await mongoose
        .connect(process.env.MONGODB_URI)
        .catch((err) => console.log('error connecting to MongoDB', err));

    // find rsvps
    const rsvps =  await Rsvp.find({
            createdAt: {
                $gte: yesterday,
                $lte: now
            },
            posted_by: 'mayfieldmouse'
        })
        .catch((err) => {
            console.log('findRsvps() error:', err)
        });
    
    const rsvpList = rsvps.map((rsvp) => `<li>${rsvp.name} - ${rsvp.show} / ${rsvp.date}</li>`).join('');

    // find cancellations
    const cancellations =  await Cancellation.find({
        canceledOn: {
            $gte: yesterday,
            $lte: now,
        },
        posted_by: 'mayfieldmouse'
    })
    .catch((err) => {
        console.log('findRsvps() error:', err)
    });
    
    const cancellationList = cancellations.map((cancellation) => `<li>${cancellation.name} - ${cancellation.show} / ${cancellation.date}</li>`).join('');

    // send email
    await transporter.sendMail({
        from: '"Vinyl Steve" <info@vinylsteve.com>', // sender address
        to: ['clubmekon@gmail.com', 'ryanbsy@gmail.com'], // recipient
        subject: 'Daily Summary from Vinyl Steve', // subject line
        text: `Daily Summary for ${yesterday} \n RSVPs Confirmed: \n ${rsvpList} \n Cancellations: \n ${cancellationList}`, // plain text body
        html: `<h3>Daily Summary for ${yesterday}:<h3>
                <h4>RSVPs Confirmed</h4>
                ${rsvpList}
                <h4>Cancellations</h4>
                ${cancellationList}`
    });
}
/**
 * email John Bastone
 */
async function emailJohn() {
    // connect to db
    await mongoose
        .connect(process.env.MONGODB_URI)
        .catch((err) => console.log('error connecting to MongoDB', err));

    // find rsvps
    const rsvps =  await Rsvp.find({
            createdAt: {
                $gte: yesterday,
                $lte: now
            },
            posted_by: 'john bastone'
        })
        .catch((err) => {
            console.log('findRsvps() error:', err)
        });
    
    const rsvpList = rsvps.map((rsvp) => `<li>${rsvp.name} - ${rsvp.show} / ${rsvp.date}</li>`).join('');

    // find cancellations
    const cancellations =  await Cancellation.find({
        canceledOn: {
            $gte: yesterday,
            $lte: now
        },
        posted_by: 'john bastone'
    })
    .catch((err) => {
        console.log('findRsvps() error:', err)
    });
    
    const cancellationList = cancellations.map((cancellation) => `<li>${cancellation.name} - ${cancellation.show} / ${cancellation.date}</li>`).join('');

    // send email
    await transporter.sendMail({
        from: '"Vinyl Steve" <info@vinylsteve.com>', // sender address
        to: ['ryanbsy@gmail.com'], // recipient
        subject: 'Daily Summary from Vinyl Steve', // subject line
        text: `Daily Summary for ${yesterday} \n RSVPs Confirmed: \n ${rsvpList} \n Cancellations: \n ${cancellationList}`, // plain text body
        html: `<h3>Daily Summary for ${yesterday}:<h3>
                <h4>RSVPs Confirmed</h4>
                ${rsvpList}
                <h4>Cancellations</h4>
                ${cancellationList}`
    });
}

emailSteve()
    .catch((err) => {
        console.error(err);
    });

emailJohn()
    .catch((err) => {
        console.error(err);
    });

