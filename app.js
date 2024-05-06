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
const cookieParser = require("cookie-parser");
const path = require("path");
const ejsMate = require("ejs-mate");
const cors = require("cors");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");
const helmet = require("helmet");
const mySqlPool = require("./db");

mySqlPool
  .query("SELECT 1")
  .then(() => {
    console.log("MySql Db connected");
  })
  .catch((error) => {
    console.log(error);
  });

const app = express();
app.use(cors());
// it tells the app to use ejs functionality
app.engine("ejs", ejsMate);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "public")));

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  const token = req.cookies.token;
  res.render("home", { currentUser: token });
});

app.get("/get-token", (req, res) => {
  const token = req.cookies.token;
  res.json({ token: token });
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

const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  console.log("Serving on port 7000");
});

// xss
// cross site scrypting
// it is a very powerful security vulnerabilty
// the idea is to inject some client side script into sombody else web page
// means some attackers is going to inject their own client side code/scripts that will run in the browser on somebody else application
