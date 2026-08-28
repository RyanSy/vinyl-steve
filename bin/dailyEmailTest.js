const fs = require('fs');

// Include config file if testing locally; if in production use env variables.
// (Same pattern as bin/dealerReminderEmail.js.)
const filePath = __dirname + '/config.json';

let host;
let port;
let login;
let pass;
let db_uri;

if (fs.existsSync(filePath)) {
    console.log('Config file detected.');
    const config = require('./config.json');
    host = config.BREVO_SMTP_SERVER;
    port = config.BREVO_SMTP_PORT;
    login = config.BREVO_LOGIN;
    pass = config.BREVO_SMTP_KEY;
    db_uri = config.MONGODB_URI;
} else {
    console.log('No config file detected.');
    host = process.env.BREVO_SMTP_SERVER;
    port = process.env.BREVO_SMTP_PORT;
    login = process.env.BREVO_LOGIN;
    pass = process.env.BREVO_SMTP_KEY;
    db_uri = process.env.MONGODB_URI;
}

const mongoose = require('mongoose');
const Rsvp = require('../models/rsvp');
const Cancellation = require('../models/cancellation');
const WaitlistEvent = require('../models/waitlistEvent');
const nodemailer = require('nodemailer');

const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: login,
        pass: pass,
    },
});

/**
 * Builds the RSVP / cancellation / waitlist summary for a single organizer
 * ('mayfieldmouse' = Steve, 'john bastone' = John) over the last 24 hours.
 * Mirrors the queries in bin/dailyEmail.js so the test output matches what
 * the real daily email would contain.
 */
async function buildSummary(postedBy, label) {
    const rsvps = await Rsvp.find({
        createdAt: { $gte: yesterday, $lte: now },
        posted_by: postedBy
    }).catch((err) => {
        console.log('findRsvps() error:', err);
        return [];
    });

    const cancellations = await Cancellation.find({
        canceledOn: { $gte: yesterday, $lte: now },
        posted_by: postedBy
    }).catch((err) => {
        console.log('findCancellations() error:', err);
        return [];
    });

    const waitlistEvents = await WaitlistEvent.find({
        eventAt: { $gte: yesterday, $lte: now },
        posted_by: postedBy
    }).catch((err) => {
        console.log('findWaitlistEvents() error:', err);
        return [];
    });

    const waitlistJoins = waitlistEvents.filter((event) => event.action === 'joined');
    const waitlistLeaves = waitlistEvents.filter((event) => event.action === 'left');

    const rsvpList = rsvps.map((rsvp) => `<li>${rsvp.name} - ${rsvp.show} / ${rsvp.date}</li>`).join('') || '<li>None</li>';
    const cancellationList = cancellations.map((c) => `<li>${c.name} - ${c.show} / ${c.date}</li>`).join('') || '<li>None</li>';
    const waitlistJoinsList = waitlistJoins.map((e) => `<li>${e.name} - ${e.show} / ${e.date}</li>`).join('') || '<li>None</li>';
    const waitlistLeavesList = waitlistLeaves.map((e) => `<li>${e.name} - ${e.show} / ${e.date}</li>`).join('') || '<li>None</li>';

    return `
        <h2>${label}</h2>
        <h4>RSVPs Confirmed</h4>
        <ul>${rsvpList}</ul>
        <h4>Cancellations</h4>
        <ul>${cancellationList}</ul>
        <h4>Dealers Joined Waiting List</h4>
        <ul>${waitlistJoinsList}</ul>
        <h4>Dealers Left Waiting List</h4>
        <ul>${waitlistLeavesList}</ul>
        <hr>`;
}

async function main() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(db_uri).catch((err) => {
        console.log('error connecting to MongoDB', err);
    });
    console.log('MongoDB connected.');

    const steveSummary = await buildSummary('mayfieldmouse', "Steve's Shows");
    const johnSummary = await buildSummary('john bastone', "John's Shows");

    console.log('Sending test daily summary to Ryan only...');

    await transporter.sendMail({
        from: '"Vinyl Steve" <info@vinylsteve.com>',
        to: 'ryanbsy@gmail.com', // TEST: only Ryan, never Steve or John
        subject: `[TEST] Daily Summary from Vinyl Steve - ${yesterday.toDateString()}`,
        html: `<h3>Daily Summary for ${yesterday}:</h3>
               <p><em>This is a test run. Only Ryan received this email.</em></p>
               ${steveSummary}
               ${johnSummary}`
    }).catch((err) => {
        console.error('Error sending test email:', err);
    });

    console.log('Test email sent.');

    await mongoose.connection.close().catch((err) => {
        console.error('Error closing Mongoose connection:', err);
    });
    console.log('Mongoose connection closed.');
}

main();
