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
const axios = require("axios");
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");
const paymentRoutes = require("./routes/payment");
const cors = require("cors");
const mySqlPool = require("./db");
const favicon = require("serve-favicon");

require("dotenv").config();

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

app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

// it tells the app to use ejs functionality
app.engine("ejs", ejsMate);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// used for the req.body by the post
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride("_method"));

app.use((req, res, next) => {
  res.locals.flash = req.cookies.flash || null;
  if (res.locals.flash) {
    res.clearCookie("flash");
  }
  next();
});

// linked to api of flask
app.get("/sentiment", (req, res) => {
  // Make a GET request to the Flask API
  axios
    .get("http://127.0.0.1:5000/")
    .then((response) => {
      // Extract the data from the Flask API response
      const apiResult = response.data;
      // Send the API result back to the client
      res.send(apiResult);
    })
    .catch((error) => {
      // If there's an error, send an error message back to the client
      console.error("Error:", error);
      res.status(500).send("Error fetching data from the API");
    });
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.use("/", paymentRoutes);

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
