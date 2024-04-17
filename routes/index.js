const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected!'));
const Show = require('../models/show');
const moment = require('moment');
const todaysDate = moment().format('YYYY-MM-DD');

// render index, redirect to home page if logged in
router.get('/', (req, res) => {
  req.oidc.isAuthenticated() ? res.redirect('/home') : res.render('index', { title: 'Vinyl Steve' });
});

// render home page with list of record riots
router.get('/home', async (req, res) => {
  const user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
  const shows = await Show.find({ date: {$gte: todaysDate}, name: /record riot/i });
  const showsArray = createShowsArray(shows);
  const showsArraySorted = sortByDateStart(showsArray);
  const dataObject = {
    user: user,
    shows: showsArraySorted
  };
  res.render('home', dataObject);
});

// get user profile info
router.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

/* helper functions */
function createShowsArray(shows) {
  var showsArray = [];
  for (var i = 0; i < shows.length; i++) {
    var showObject = {
      id: shows[i]._id,
      date: moment(shows[i].date, 'YYYY-MM-DD').format('dddd, MMMM Do, YYYY'),
      month: moment(shows[i].date, 'YYYY-MM-DD').format('MMM'),
      day: moment(shows[i].date, 'YYYY-MM-DD').format('D'),
      year: moment(shows[i].date, 'YYYY-MM-DD').format('YYYY'),
      date_og: shows[i].date,
      name: shows[i].name,
      name_formatted: shows[i].name.toLowerCase().replace(/[\s-@#!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g, '-'),
      country: shows[i].country,
      isInternational: shows[i].isInternational,
      international_address: shows[i].international_address,
      venue: shows[i].venue,
      address: shows[i].address,
      city: shows[i].city,
      state: shows[i].state,
      zip: shows[i].zip,
      start: moment(shows[i].start, 'HH:mm').format('LT'),
      end: moment(shows[i].end, 'HH:mm').format('LT'),
      date_start: new Date(shows[i].date + ' ' + shows[i].start),
      currency: shows[i].currency,
      regular_admission_fee: shows[i].regular_admission_fee,
      early_admission: shows[i].early_admission,
      early_admission_time: moment(shows[i].early_admission_time, 'HH:mm').format('LT'),
      early_admission_fee: shows[i].early_admission_fee,
      number_of_dealers: shows[i].number_of_dealers,
      number_of_tables: shows[i].number_of_tables,
      size_of_tables: shows[i].size_of_tables,
      table_rent: shows[i].table_rent,
      featured_dealers: shows[i].featured_dealers,
      cd_dealers: shows[i].cd_dealers,
      fortyfive_dealers: shows[i].fortyfive_dealers,
      memorabilia_dealers: shows[i].memorabilia_dealers,
      food_drink: shows[i].food_drink,
      handicapped_access: shows[i].handicapped_access,
      more_information: shows[i].more_information,
      contact_name: shows[i].contact_name,
      contact_phone: shows[i].contact_phone,
      contact_email: shows[i].contact_email,
      website: shows[i].website,
      facebook: shows[i].facebook,
      image: shows[i].image,
      image_public_id: shows[i].image_public_id,
      posted_by: shows[i].posted_by,
      dealer_rsvp_list: shows[i].dealer_rsvp_list
    };
    showsArray.push(showObject);
  };
  return showsArray;
}

function sortByDateStart(showsArray) {
  return showsArray.sort(function(a, b) {
    return new Date(a.date_start) - new Date(b.date_start);
  });
}

module.exports = router;
