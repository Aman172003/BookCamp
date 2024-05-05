// stores media on a cloud(named cloudinary)
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
// nothing
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  // above cloudinary object is passed
  cloudinary,
  params: {
    // we are making a folder on a cloud in which media is stored
    folder: "YelpCamp",
    // only these formats are allowed to store on a cloud
    allowedFormat: ["jpeg", "png", "jpg"],
  },
});

module.exports = {
  cloudinary,
  storage,
};
