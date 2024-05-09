const stripe = require("stripe")(process.env.STRIPE_KEY_SECRET);
require("dotenv").config();

module.exports.createPayment = async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: "Camp",
          },
          unit_amount: 500,
        },
        quantity: 1,
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
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  console.log();
  res.redirect(`${process.env.BASE_URL}`);
  //   res.send("Payment successful");
};

module.exports.cancelPayment = async (req, res) => {
  res.redirect(`${process.env.BASE_URL}`);
  //   res.send("Payment unsuccessful");
};

// module.exports.page = async (req, res) => {
//   res.render("paymentPage");
// };
