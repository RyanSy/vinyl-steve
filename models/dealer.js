const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const dealerSchema = new Schema(
  {
    name: {type: String, max: 50},
    first_name: {type: String, required: true, max: 50},
    last_name: {type: String, required: true, max: 50},
    company_name: {type: String, max: 50},
    email: {type: String},
    image: {type: String},
    address: {type: String},
    city: {type: String},
    state: {type: String},
    zip: {type: String},
    phone: {type: String},
    socialmedia: {type: String},
    website: {type: String},
    help: {type: String},
    shows: [{id: String, name: String, city: String, state: String, date: String, month: String, day: String, year: String, number_of_tables: Number, discount_code: String, discount_amount: Number, discount_applied: Boolean, rent_due: Number, notes: String, paid: Boolean, posted_by: String, posted_by_steve: Boolean, posted_by_john: Boolean}],
    dealer_list_steve: { type: Boolean},
    dealer_list_john: {type: Boolean}
  }
);

module.exports = mongoose.model('Dealer', dealerSchema);