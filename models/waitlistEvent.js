const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Logs each time a dealer joins or leaves a show's waiting list, so the
// daily summary email can report waitlist activity the same way it already
// reports RSVPs (Rsvp model) and cancellations (Cancellation model). The
// waiting_list array on the Show doc only reflects *current* state — once a
// dealer leaves (or is removed by an admin), that entry is gone, so a
// separate log is needed to know who joined/left in the last 24 hours.
const waitlistEventSchema = new Schema(
    {
        name: { type: String },
        email: { type: String },
        show: { type: String },
        date: { type: String },
        posted_by: { type: String },
        action: { type: String, enum: ['joined', 'left'] },
        eventAt: { type: Date },
    },
    { strict: false }
);

module.exports = mongoose.model('WaitlistEvent', waitlistEventSchema);
