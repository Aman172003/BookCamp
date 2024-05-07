const express = require("express");
const router = express.Router({ mergeParams: true });
const { isLoggedIn } = require("../middleware");
const payment = require("../controllers/payment");
const catchAsync = require("../utils/catchAsync");

router.route("/checkout").post(isLoggedIn, catchAsync(payment.createPayment));

router.route("/complete").get(isLoggedIn, catchAsync(payment.completePayment));

router.route("/cancel").get(isLoggedIn, catchAsync(payment.cancelPayment));

module.exports = router;
