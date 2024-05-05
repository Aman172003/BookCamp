const express = require("express");
const router = express.Router();
// below will handle the error
const catchAsync = require("../utils/catchAsync");
const users = require("../controllers/users");

router
  .route("/register")
  .get(users.renderRegister)
  .post(catchAsync(users.register));

router.route("/login").get(users.renderLogin).post(users.login);

router.get("/logout", users.logout);

module.exports = router;
