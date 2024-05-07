const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const dealerSchema = new Schema(
  {
    name: {type: String, required: true, max: 50},
    email: {type: String},
    address: {type: String},
    city: {type: String},
    state: {type: String},
    zip: {type: String},
    phone: {type: String},
    socialmedia: {type: String},
    website: {type: String},
    help: {type: String},
    shows: [{id: String, name: String, city: String, state: String, date: String, month: String, day: String, year: String, number_of_tables: Number, notes: String, paid: Boolean}]
  }
);

module.exports = mongoose.model('Dealer', dealerSchema);