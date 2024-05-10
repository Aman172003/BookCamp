const mySqlPool = require("../db");

const stripe = require("stripe")(process.env.STRIPE_KEY_SECRET);
require("dotenv").config();

module.exports.createPayment = async (req, res) => {
  const campgroundId = req.body.campground_id;
  const campgroundQuery = `
  SELECT
    c.id AS campground_id,
    c.title AS campground_title,
    c.price AS campground_price
  FROM
    Campground c
  WHERE
    c.id = ?
`;
  const [campgroundRows] = await mySqlPool.query(campgroundQuery, [
    campgroundId,
  ]);

  const { campground_id, campground_title, campground_price } =
    campgroundRows[0];

  const parsedCampgroundPrice = parseInt(campground_price);
  var numberOfCampsites = req.body.numberOfCampsites;
  const checkInDate = new Date(req.body.checkInDate);
  const checkOutDate = new Date(req.body.checkOutDate);

  const differenceInTime = checkOutDate.getTime() - checkInDate.getTime();
  const numberOfDays = differenceInTime / (1000 * 3600 * 24);
  var roundedNumberOfDays = Math.round(numberOfDays);

  roundedNumberOfDays = parseInt(roundedNumberOfDays);
  numberOfCampsites = parseInt(numberOfCampsites);


  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: `${numberOfCampsites} Campsites`,
          },
          unit_amount: parsedCampgroundPrice * 100, // Adjust with the actual price of a campsite if needed
        },
        quantity: numberOfCampsites,
      },
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: `${numberOfDays} Nights`,
          },
          unit_amount: parsedCampgroundPrice * 100, // Adjust with the actual price per night if needed
        },
        quantity: numberOfDays,
      },
    ],
    mode: "payment",
    success_url: `${process.env.BASE_URL}/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/cancel`,
  });

  //   res.json(session.url);
  res.redirect(session.url);
};

module.exports.completePayment = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.query.session_id
    );
    res.render("payment/successPage"); // Render success page
  } catch (error) {
    console.error("Error completing payment:", error);
    res.redirect("/error"); // Redirect to an error page or handle the error accordingly
  }
};

module.exports.cancelPayment = async (req, res) => {
  try {
    res.render("payment/cancelPage"); // Render cancel page
  } catch (error) {
    console.error("Error canceling payment:", error);
    res.redirect("/error"); // Redirect to an error page or handle the error accordingly
  }
};
