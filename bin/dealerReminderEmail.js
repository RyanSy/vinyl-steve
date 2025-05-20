const Show = require('../models/show');

async function getShowsWithin72Hours() {
    console.log('Finding shows in 72 hours or less...');
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // "2025-05-20"
    const in72Hours = new Date(today.getTime() + 72 * 60 * 60 * 1000);

    const shows = await Show.find({
        posted_by: { $in: ['mayfieldmouse', 'john bastone'] },
        date: { $gt: todayString }
    });

    const showsWithin72Hours = shows.filter(show => {
        const showDate = new Date(show.date); // Convert "YYYY-MM-DD" to Date
        return showDate >= now && showDate <= in72Hours;
    });

    return showsWithin72Hours;
}

getShowsWithin72Hours()
    .then(shows => console.log(shows))
    .catch(err => console.log(err));