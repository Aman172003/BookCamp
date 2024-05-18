const mySqlPool = require("../db");

module.exports.createReview = async (req, res) => {
  const campgroundId = req.params.id;
  const reviewData = req.body;

  const rating = reviewData["review[rating]"];
  const body = reviewData["review[body]"];

  const campground = await mySqlPool.query(
    `
    SELECT * FROM Campground WHERE id = ?
  `,
    [campgroundId]
  );

  if (!campground) {
    res.cookie(
      "flash",
      { type: "error", message: "Campground not found!" },
      { httpOnly: true }
    );
    return res.redirect("/campgrounds");
  }

  // Insert the review into the Review table
  await mySqlPool.query(
    `
    INSERT INTO Review (campground_id, author_id, rating, body)
    VALUES (?, ?, ?, ?)
  `,
    [campgroundId, req.user.id, rating, body]
  );

  res.cookie(
    "flash",
    { type: "success", message: "Created new review!" },
    { httpOnly: true }
  );
  res.redirect(`/campgrounds/${campgroundId}`);
};

module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;

  // Delete the review from the Review table
  await mySqlPool.query(
    `
    DELETE FROM Review
    WHERE id = ?
  `,
    [reviewId]
  );

  res.cookie(
    "flash",
    { type: "success", message: "Successfully deleted a review" },
    { httpOnly: true }
  );
  res.redirect(`/campgrounds/${id}`);
};
