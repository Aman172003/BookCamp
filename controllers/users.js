// const User = require("../models/user");
const mySqlPool = require("../db");
const bcrypt = require("bcrypt");
const { genToken } = require("../middleware");

// it will render the register form
module.exports.renderRegister = (req, res) => {
  res.render("users/register");
};

// logic for registering the user
module.exports.register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    await mySqlPool.query(
      "SELECT email FROM User WHERE email = ?",
      [email],
      (error, results) => {
        if (error) {
          console.log(error);
        }
        if (results.length > 0) {
          req.flash("error", "User already exists!");
        }
      }
    );

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query =
      "INSERT INTO User (username, email, password) VALUES (?, ?, ?)";
    const values = [username, email, hashedPassword];

    await mySqlPool.query(query, values);

    const [userRows] = await mySqlPool.query(
      "SELECT * FROM User WHERE email = ?",
      [email]
    );
    const registeredUser = userRows[0];

    const payload = {
      id: registeredUser.id,
      username: username,
    };

    const token = genToken(payload);

    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: true,
    };

    res.cookie("token", token, options);
    console.log("Successfully Signed up!");
    // req.flash("success", );
    res.redirect("/campgrounds");
  } catch (error) {
    console.error("Error registering user:", error);
    // req.flash("error", "Failed to register user");

    res.redirect("back");
  }
};

// render the login page
module.exports.renderLogin = (req, res) => {
  res.render("users/login");
};

// logic for logging in
module.exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const [userRows] = await mySqlPool.query(
      "SELECT * FROM User WHERE username = ?",
      [username]
    );
    if (userRows.length === 0) {
      // req.flash("error", "Invalid username or password");
      res.redirect("back");
      return;
    }
    const user = userRows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      // Passwords don't match
      // req.flash("error", "Invalid password");
      res.redirect("back");
      return;
    }

    const payload = {
      id: user.id,
      username: username,
    };

    const token = genToken(payload);

    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: true,
    };

    res.cookie("token", token, options);

    // req.flash("success", "Welcome back!");
    console.log("Successfully logged in!");
    const redirectUrl = res.locals.returnTo || "/campgrounds"; // update this line to use res.locals.returnTo now
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error logging in:", error);
    // req.flash("error", "Failed to log in");
    res.redirect("back");
  }
};

// logic for logging out
module.exports.logout = (req, res, next) => {
  res.clearCookie("token");
  // req.flash("success", "Goodbye!");
  res.redirect("/campgrounds");
};
