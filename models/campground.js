const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");

const ImageSchema = new Schema({
  url: String,
  filename: String,
});

// this is done to show thumbnail of the image while editing/deleting
// replacing /url with /url/w_300
// where w_300 is width 300
// below is not working propoerly
// below is connected to models/campgrounds where img.thumnail
ImageSchema.virtual("thumbnail").get(function () {
  return this.url.replace("/upload", "/upload/w_200");
});

// this is done to include virtual schemas into main schema
const opts = { toJSON: { virtuals: true } };

const CampgroundSchema = new Schema(
  {
    title: String,
    images: [
      // it will store two things
      // url of cloud media and filname in which media is stored
      // cloudinary will store the media
      // mongoDB stores the url and filename of the media
      ImageSchema,
    ],
    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    price: Number,
    description: String,
    location: String,
    // to provide specific field a owner such as review for a particular user
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // embedding many reviews  into one campground as an array
    reviews: [
      {
        type: Schema.Types.ObjectId,
        // object id from a Review model
        ref: "Review",
      },
    ],
  },
  opts
);

// below is done to provide properties when clicked on cluster
CampgroundSchema.virtual("properties.popUpMarkup").get(function () {
  return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0, 20)}...</p>
    `;
});


module.exports = mongoose.model("Campground", CampgroundSchema);
