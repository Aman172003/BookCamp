const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const mySqlPool = require("./db");

module.exports.isLoggedIn = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    res.cookie(
      "flash",
      { type: "error", message: "You must be signed in first!" },
      { httpOnly: true }
    );
    return res.redirect("/login");
  }
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    res.cookie(
      "flash",
      { type: "error", message: "Invalid token!" },
      { httpOnly: true }
    );
    return res.redirect("/login");
  }
};

module.exports.genToken = (user) => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "8h" });
};

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const campgroundQuery = `SELECT author_id FROM Campground WHERE id = ?`;
  const [campgroundRow] = await mySqlPool.query(campgroundQuery, [id]);

  if (
    campgroundRow.length === 0 ||
    campgroundRow[0].author_id !== req.user.id
  ) {
    // Assuming req.user.id holds the ID of the currently authenticated user
    return res.redirect(`/campgrounds/${id}`);
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const reviewQuery = `SELECT author_id FROM Review WHERE id = ?`;
  const [reviewRow] = await mySqlPool.query(reviewQuery, [reviewId]);

  if (reviewRow.length === 0 || reviewRow[0].author_id !== req.user.id) {
    // Assuming req.user.id holds the ID of the currently authenticated user
    return res.redirect(`/campgrounds/${id}`);
  }
  next();
};
