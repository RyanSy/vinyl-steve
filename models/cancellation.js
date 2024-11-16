const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const cancellationSchema = new Schema(
    {
        name: {type: String},
        show: {type: String},
        date: {type: String},
        canceledOn: {type: Date},
    },
    { strict: false }
);

module.exports = mongoose.model('Cancellation', cancellationSchema);
