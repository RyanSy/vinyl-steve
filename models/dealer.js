const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const dealerSchema = new Schema(
  {
    name: {type: String, required: true, max: 50},
    shows: [{id: String, number_of_tables: Number, notes: String}],
  }
);

module.exports = mongoose.model('Dealer', dealerSchema);