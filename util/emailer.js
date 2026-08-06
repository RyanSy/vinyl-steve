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
 * Notify everyone on a show's waiting list that a table has opened up,
 * e.g. after a dealer cancels their RSVP.
 *
 * @param {Object} show - the show document (must include waiting_list, name, date, _id)
 * @returns {Promise<void>}
 */
async function notifyWaitlistOfOpening(show) {
    const waitingList = show && show.waiting_list ? show.waiting_list : [];

    if (!waitingList.length) {
        return;
    }

    const showName = show.name;
    const showDate = require('moment')(show.date, 'YYYY-MM-DD').format('dddd, MMMM Do, YYYY');
    const showUrl = `${process.env.AUTH0_BASE_URL || 'https://vinylsteve.com'}/show/${show._id}`;

    const emails = waitingList
        .map((entry) => {
            const textBody = `Hi ${entry.name || 'there'},\n\nA table has just opened up for ${showName} on ${showDate}! You're receiving this because you're on the waiting list for this show.\n\nIf you'd still like to reserve a table, log in and RSVP as soon as possible, as spots are first come, first served: ${showUrl}\n\nThanks,\nVinyl Steve`;

            const htmlBody = `
                <p>Hi ${entry.name || 'there'},</p>
                <p>A table has just opened up for <strong>${showName}</strong> on ${showDate}! You're receiving this because you're on the waiting list for this show.</p>
                <p>If you'd still like to reserve a table, log in and RSVP as soon as possible, as spots are first come, first served: <a href="${showUrl}" target="_blank">${showUrl}</a></p>
                <p>Thanks,<br>Vinyl Steve</p>
            `;

            return transporter
                .sendMail({
                    from: '"Vinyl Steve" <info@vinylsteve.com>',
                    to: entry.email,
                    subject: `A table just opened up for ${showName}!`,
                    text: textBody,
                    html: htmlBody,
                })
                .catch((err) => {
                    console.log(`Failed to notify waitlisted dealer ${entry.email}:`, err);
                });
        });

    await Promise.all(emails);
}

module.exports = {
    transporter,
    notifyWaitlistOfOpening,
};