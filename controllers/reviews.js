const mySqlPool = require("../db");


module.exports.createReview = async (req, res) => {
  const campgroundId = req.params.id;
  const reviewData = req.body;

  const rating = reviewData['review[rating]'];
  const body = reviewData['review[body]'];

  console.log("Rating:", rating);
  console.log("Body:", body);

  const campground = await mySqlPool.query(
    `
    SELECT * FROM Campground WHERE id = ?
  `,
    [campgroundId]
  );

  if (!campground) {
    console.log("Campground not found!");
    // req.flash("error", "Campground not found!");
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

  // req.flash("success", "Created new review!");
  console.log("Created new review!");
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

  console.log("Successfully deleted a review");
  // req.flash("success", "Successfully deleted a review");
  res.redirect(`/campgrounds/${id}`);
};
