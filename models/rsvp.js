const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const rsvpSchema = new Schema(
    {
        name: {type: String},
        show: {type: String},
        date: {type: String},
        tables_rented: {type: String},
        rent_due: {type: Number},
        createdAt: {type: Date},
        editedAt: {type: Date},
        deletedAt: {type: Date}
    },
    { strict: false }
);

module.exports = mongoose.model('Rsvp', rsvpSchema);
