const express = require("express");
const catchAsync = require("../utils/catchAsync");
const router = express.Router({ mergeParams: true });
const { isLoggedIn, isAuthor } = require("../middleware");
const campgrounds = require("../controllers/campgrounds");
// multer adds a body object and a file or files object.
// the body object contains the values of the text fields of the form, the files or file object contains the files uploaded via the form
const multer = require("multer");

const { storage } = require("../cloudinary");
const upload = multer({ storage });

router
  .route("/")
  .get(isLoggedIn, catchAsync(campgrounds.index))
  // below is the multer middleware that retrives the file data
  .post(
    isLoggedIn,
    upload.array("image"),
    catchAsync(campgrounds.createCampground)
  );

// to add a new campground
router.get("/new", isLoggedIn, campgrounds.renderNewForm);

router
  .route("/:id")
  // to find a campground by id
  .get(isLoggedIn, catchAsync(campgrounds.showCampground))
  // to update
  .put(
    isLoggedIn,
    isAuthor,
    upload.array("image"),
    catchAsync(campgrounds.updateCampground)
  )
  .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

// to edit a campground
router.get(
  "/:id/edit",
  isLoggedIn,
  isAuthor,
  catchAsync(campgrounds.renderEditForm)
);

module.exports = router;
