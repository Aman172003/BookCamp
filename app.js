// process.env.NODE_ENV is an environment variable that is usually just development or
// production
// we have been running in development this whole time, but eventualy when we deploy
// we will be running our code in production

// when we wre in development mode we require the dotenv package which is going to take the
// variable that is defined in .env file and add them into process dotenv in my node app
// to do this
// npm i dotenv
// nothing
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
// npm i ejs-mate
// it adds functionality to the ejs
const ejsMate = require("ejs-mate");
// data validator
// const Joi = require('joi');
const session = require("express-session");
const ExpressError = require("./utils/ExpressError");
const flash = require("connect-flash");
// npm i method-override run in terminal
// to use methods from queryString like put(updata), delete etc
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");
// used for security purpose to don't alloe symbols to be used as a query string
const mongoSanitize = require("express-mongo-sanitize");
// npm i helmet
// it makes our site more secure
const helmet = require("helmet");
// npm i connect-mongo
// to use mongo for our session store
const MongoStore = require("connect-mongo");
// mongo atlas is the cloud database
const dbUrl = process.env.DB_URL;
// const dbUrl = 'mongodb://127.0.0.1:27017/yelp-camp';

mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const app = express();

// it tells the app to use ejs functionality
app.engine("ejs", ejsMate);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  // update automatically after 24*60*60 sec
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: "thisshouldbeabettersecret!",
  },
});

store.on("error", function (e) {
  console.log("Store error", e);
});

// The app.use(session(sessionConfig)) line in your code is used to apply the session middleware to your Express.js application. This middleware handles session data, which includes user authentication status and user-specific settings. Here's what each property in the sessionConfig object means:
// secret: This is a string used to sign the session ID cookie. This is important for security because it prevents tampering with the session ID 6.
// resave: This option forces the session to be saved back to the session store, even if the session was never modified during the request. It's generally safe to set this to false 6.
// saveUninitialized: This option forces a session that is "uninitialized" to be saved to the store. An uninitialized session is one that is new but not modified. It's generally safe to set this to false 6.
// cookie: This is an object that defines properties for the session ID cookie. The expires and maxAge properties define the lifetime of the cookie, expressed in milliseconds. In your case, the cookie will expire after 7 days 6.
const sessionConfig = {
  store,
  // chaging the name of session
  name: "Blah",
  secret: "thisshouldbeabettersecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    // it does not reveal the cokkie data
    httpOnly: true,
    // below doesn't work when we are in development environment
    // it only works when we deploy it
    // secure: true,
    // a week
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());
app.use(
  mongoSanitize({
    // replaces dollar sign or periods with _
    replaceWith: "_",
  })
);
// below middleware includes 11 middlewares in it
// contentSecurityPolicy helps mitigate cross-site scripting attacks
// isko use krne ke liye jo bhi photos ya maps humne use kiya hai uske source ko validate krna hoga
// tabhi wo maps aur photos humare website me dikhega nhi to unauthorized ho jaega
app.use(helmet());

// validating sources
const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://api.tiles.mapbox.com/",
  "https://api.mapbox.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://api.mapbox.com/",
  "https://api.tiles.mapbox.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
];
const connectSrcUrls = [
  "https://api.mapbox.com/",
  "https://a.tiles.mapbox.com/",
  "https://b.tiles.mapbox.com/",
  "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", "*"],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        // this should match my cloudinary account
        "https://res.cloudinary.com/dwoqqbfk6/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
        "https://images.unsplash.com/",
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

// used for the req.body by the post
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "public")));

app.use(passport.initialize());
// if we want persistent login sessions
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
// how to store users in the session
passport.serializeUser(User.serializeUser());
// how to remove user from the session
passport.deserializeUser(User.deserializeUser());

// <!-- aisa krke koi bhi attack kar skta hai aur saare user ka data access kar skta hai (as a query string use krke)-->
// <!-- iska avoid krne ke liye hum npm i express-mongo-sanitize kar skte hai -->
// <!-- aur $ sign jaise caracters ko use krne se rok skte hai -->
// <!-- db.users.find({username: {"$gt": ""}}); -->

// it will make the local functionalities
app.use((req, res, next) => {
  console.log(req.query);
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.render("home");
});

// for every single request and for every path
// if none of the above route works this will work for sure
// and pass to error middleware
app.all("*", (req, res, next) => {
  next(new ExpressError("Page not found", 404));
});

// error handler middleware
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong!";
  // it will send back a status code
  res.status(statusCode).render("error", { err });
});

app.listen(3000, () => {
  console.log("Serving on port 3000");
});

// xss
// cross site scrypting
// it is a very powerful security vulnerabilty
// the idea is to inject some client side script into sombody else web page
// means some attackers is going to inject their own client side code/scripts that will run in the browser on somebody else application
