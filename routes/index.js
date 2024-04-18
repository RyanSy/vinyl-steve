const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected!'))
  .catch((err) => console.log('error'));
const Show = require('../models/show');
const moment = require('moment');
const todaysDate = moment().format('YYYY-MM-DD');

// render index, redirect to home page if logged in
router.get('/', (req, res) => {
  req.oidc.isAuthenticated() ? res.redirect('/home') : res.render('index', { title: 'Vinyl Steve' });
});

// render home page with list of record riots
router.get('/home', async (req, res) => {
  let user;
  if (req.oidc.user) {
    user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
  }
  const shows = await Show.find({ date: {$gte: todaysDate}, name: /record riot/i });
  const showsArray = createShowsArray(shows);
  const showsArraySorted = sortByDateStart(showsArray);
  const dataObject = {
    user: user,
    shows: showsArraySorted
  };
  res.render('home', dataObject);
});

// render specific record riot page
router.get('/show/:id', async (req, res) => {
  let user;
  if (req.oidc.user) {
    user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
  }
  const show = await Show.find({ _id: req.params.id });
  const showObject = createShowObject(show[0]);
  const dataObject = {
    user: user,
    show: showObject
  };
  res.render('show', dataObject);
});

// save dealer rsvp - pay at event
router.post('/rsvp', async (req, res) => {
  const show = await Show.find({ _id: req.body.id });
  show[0].dealer_rsvp_list.addToSet(req.body.user);
  show[0].save();
  res.render('confirmation', { name: req.body.name });
})

// save dealer rsvp - advance payment

// render admin dashboard
router.get('/admin', async (req, res) => {
  let user;
  let isAdmin = false;
  if (req.oidc.user) {
    user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
  }
  if (req.oidc.user.email == 'clubmekon@gmail.com' || req.oidc.user.email == 'ryanb.sy@gmail.com') {
    isAdmin = true;
  }
  const shows = await Show.find({ date: {$gte: todaysDate}, name: /record riot/i });
  const showsArray = createShowsArray(shows);
  const showsArraySorted = sortByDateStart(showsArray);
  const dataObject = {
    user: user,
    shows: showsArraySorted,
    isAdmin: isAdmin
  }; 
  isAdmin ? res.render('admin', dataObject) : res.send('Unauthorized');
});

// render rsvp list
router.get('/rsvp/:id', async (req, res) => {
  let user;
  if (req.oidc.user) {
    user = JSON.stringify(req.oidc.user.name).replace(/"/g, '');
  }
  const show = await Show.find({ _id: req.params.id });
  const showObject = createShowObject(show[0]);
  console.log(showObject)
  const dataObject = {
    user: user,
    show: showObject
  };
  res.render('rsvp', dataObject);
})

// render user profile
router.get('/my-rsvps', requiresAuth(), (req, res) => {
  res.send('Under Construction');
});

// get user profile info
router.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

/* helper functions */
function createShowsArray(shows) {
  let showsArray = [];
  for (let i = 0; i < shows.length; i++) {
    let showObject = {
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

function createShowObject(show) {
  let showObject = {
    id: show._id,
    date: moment(show.date, 'YYYY-MM-DD').format('dddd, MMMM Do, YYYY'),
    date_og: show.date,
    name: show.name,
    name_formatted: show.name.toLowerCase().replace(/[\s-@#!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g, '-'),
    isInternational: show.isInternational,
    international_address: show.international_address,
    venue: show.venue,
    address: show.address,
    city: show.city,
    state: show.state,
    zip: show.zip,
    start: moment(show.start, 'HH:mm').format('LT'),
    end: moment(show.end, 'HH:mm').format('LT'),
    currency: show.currency,
    regular_admission_fee: show.regular_admission_fee,
    early_admission: show.early_admission,
    early_admission_time: moment(show.early_admission_time, 'HH').format('LT'),
    early_admission_fee: show.early_admission_fee,
    number_of_dealers: show.number_of_dealers,
    number_of_tables: show.number_of_tables,
    size_of_tables: show.size_of_tables,
    table_rent: show.table_rent,
    featured_dealers: show.featured_dealers,
    cd_dealers: show.cd_dealers,
    fortyfive_dealers: show.fortyfive_dealers,
    memorabilia_dealers: show.memorabilia_dealers,
    food_drink: show.food_drink,
    handicapped_access: show.handicapped_access,
    more_information: show.more_information,
    contact_name: show.contact_name,
    contact_phone: show.contact_phone,
    contact_email: show.contact_email,
    website: show.website,
    facebook: show.facebook,
    image: show.image,
    image_public_id: show.image_public_id,
    posted_by: show.posted_by,
    dealer_rsvp_list: show.dealer_rsvp_list
  };

  return showObject;
}

module.exports = router;
