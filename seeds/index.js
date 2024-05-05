const mongoose = require('mongoose');          
const cities = require('./cities');
const {places, descriptors} = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = (array) => array[Math.floor(Math.random()*array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for(let i = 0; i < 2; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random()*20) + 10;
        const camp = new Campground({
          // your user id
            author: '6598f0a69120f2ca7bc525c6',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quod omnis quidem aliquid maiores eaque vitae suscipit in accusantium debitis earum dignissimos nisi pariatur officia, vero et placeat necessitatibus reprehenderit. Modi?',
            // default location is there
            geometry: {
              type: "Point", 
              coordinates: [
                cities[random1000].longitude, 
                cities[random1000].latitude
              ]
            },
            // below is the shorthend of price: price,
            price,
            images: [
              {
                url: 'https://res.cloudinary.com/dwoqqbfk6/image/upload/v1705417210/YelpCamp/yp6jfgdodie3hseftkyy.avif',
                filename: 'YelpCamp/yp6jfgdodie3hseftkyy',
              },
              {
                url: 'https://res.cloudinary.com/dwoqqbfk6/image/upload/v1705417210/YelpCamp/f0y6qpza7fviblgd98ui.jpg',
                filename: 'YelpCamp/f0y6qpza7fviblgd98ui',
                
              }
            ],
        })
        await camp.save();
    }
}
// seedDB returns a promise as it is a async function
seedDB().then(() => {
    mongoose.connection.close();
})