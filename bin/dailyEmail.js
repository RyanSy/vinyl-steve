// db setup
const mongoose = require('mongoose');
const Rsvp = require('../models/rsvp');
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
const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

mongoose
    .connect(process.env.MONGODB_URI)
    .catch((err) => console.log('error connecting to MongoDB', err));

async function findRsvps() {
    const results = await Rsvp.find({
        createdAt: {
            $gte: yesterday,
            $lte: now
        }
    })
    .catch((err) => {
        console.log('findRsvps() error:', err)
    });
    return results;
}

findRsvps()
        .then((rsvps) => {
            const rsvpList = rsvps.map((rsvp) => `<li>${rsvp.name} - ${rsvp.show} / ${rsvp.date}</li>`).join('');
            const today = new Date().toDateString();
            async function main() {
                await transporter.sendMail({
                    from: '"Vinyl Steve" <info@vinylsteve.com>', // sender address
                    to: ['clubmekon@gmail.com', 'ryanbsy@gmail.com'], // recipient
                    subject: 'Daily Summary from Vinyl Steve', // subject line
                    text: `Daily Summary for ${today} \n ${rsvpList}`, // plain text body
                    html: `<h3>Daily Summary for ${today}:<h3>
                            ${rsvpList}`
                });
            }

            main().catch(console.error);
        })
        .catch((err) => {
            console.error('error finding rsvps:', err);
        });