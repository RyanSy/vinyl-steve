const moment = require('moment');

exports.createShowsArray = (shows) => {
    let showsArray = [];
    let discount_codes;

    for (let i = 0; i < shows.length; i++) {
        shows[i].discount_codes ? discount_codes = shows[i].discount_codes : discount_codes = [];
        let showObject = {
            id: shows[i]._id,
            date: moment(shows[i].date, 'YYYY-MM-DD').format(
                'dddd, MMMM Do, YYYY'
            ),
            month: moment(shows[i].date, 'YYYY-MM-DD').format('MMM'),
            day: moment(shows[i].date, 'YYYY-MM-DD').format('D'),
            year: moment(shows[i].date, 'YYYY-MM-DD').format('YYYY'),
            date_og: shows[i].date,
            name: shows[i].name,
            name_formatted: shows[i].name
                .toLowerCase()
                .replace(/[\s-@#!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g, '-'),
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
            early_admission_time: moment(
                shows[i].early_admission_time,
                'HH:mm'
            ).format('LT'),
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
            rsvp: shows[i].rsvp,
            dealer_rsvp_list: shows[i].dealer_rsvp_list,
            number_of_tables_for_rent: shows[i].number_of_tables_for_rent,
            max_tables_per_dealer: shows[i].max_tables_per_dealer,
            discount_codes: discount_codes,
            dealer_information: shows[i].dealer_information,
            tables_rented: shows[i].dealer_rsvp_list.reduce((n, {number_of_tables}) => n + number_of_tables, 0),
            archive_notes: shows[i].archive_notes,
        };
        showsArray.push(showObject);
    }
    return showsArray;
};

exports.sortByDateStart = (showsArray) => {
    return showsArray.sort(function (a, b) {
        return new Date(a.date_start) - new Date(b.date_start);
    });
};

exports.createShowObject = (show) => {
    let discount_codes;
    show.discount_codes ? discount_codes = show.discount_codes : discount_codes = [];
    
    let showObject = {
        id: show._id,
        date: moment(show.date, 'YYYY-MM-DD').format('dddd, MMMM Do, YYYY'),
        date_og: show.date,
        month: moment(show.date, 'YYYY-MM-DD').format('MMM'),
        day: moment(show.date, 'YYYY-MM-DD').format('D'),
        year: moment(show.date, 'YYYY-MM-DD').format('YYYY'),
        name: show.name,
        name_formatted: show.name
            .toLowerCase()
            .replace(/[\s-@#!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g, '-'),
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
        early_admission_time: moment(show.early_admission_time, 'HH').format(
            'LT'
        ),
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
        rsvp: show.rsvp,
        dealer_rsvp_list: show.dealer_rsvp_list,
        number_of_tables_for_rent: show.number_of_tables_for_rent,
        max_tables_per_dealer: show.max_tables_per_dealer,
        discount_codes: discount_codes,
        dealer_information: show.dealer_information,
        tables_rented: show.dealer_rsvp_list.reduce((n, {number_of_tables}) => n + number_of_tables, 0),
        archive_notes: show.archive_notes
    };

    return showObject;
};
