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

    const [results] = await mySqlPool.query(
      "SELECT email FROM User WHERE email = ?",
      [email]
    );

    if (results.length > 0) {
      res.cookie(
        "flash",
        { type: "error", message: "User already exists!" },
        { httpOnly: true }
      );
      return res.redirect("back");
    }

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
    res.cookie(
      "flash",
      { type: "success", message: "Successfully Signed up!" },
      { httpOnly: true }
    );
    res.redirect("/campgrounds");
  } catch (error) {
    console.error("Error registering user:", error);
    res.cookie(
      "flash",
      { type: "error", message: "Failed to register user" },
      { httpOnly: true }
    );

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
      res.cookie(
        "flash",
        { type: "error", message: "Invalid username or password" },
        { httpOnly: true }
      );
      res.redirect("back");
      return;
    }
    const user = userRows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      // Passwords don't match
      res.cookie(
        "flash",
        { type: "error", message: "Invalid password" },
        { httpOnly: true }
      );
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

    res.cookie(
      "flash",
      { type: "success", message: "Welcome back!" },
      { httpOnly: true }
    );
    const redirectUrl = res.locals.returnTo || "/campgrounds";
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error logging in:", error);
    res.cookie(
      "flash",
      { type: "error", message: "Failed to log in" },
      { httpOnly: true }
    );
    res.redirect("back");
  }
};

// logic for logging out
module.exports.logout = (req, res, next) => {
  res.clearCookie("token");
  res.cookie(
    "flash",
    { type: "success", message: "Goodbye!" },
    { httpOnly: true }
  );
  res.redirect("/login");
};
