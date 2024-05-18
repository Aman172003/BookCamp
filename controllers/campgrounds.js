// npm i @mapbox/mapbox-sdk
// require to get longitude-latitude through location name and vice-versa
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");
const mySqlPool = require("../db");

module.exports.index = async (req, res) => {
  try {
    // Fetch all campgrounds along with their images from the database
    const [campgrounds] = await mySqlPool.query(`
      SELECT DISTINCT c.*, i.url AS image_url, i.filename AS image_filename
      FROM Campground c
      LEFT JOIN Image i ON c.id = i.campground_id
    `);

    // Initialize an object to store unique campgrounds by ID
    const campgroundMap = {};

    // Group campgrounds by ID and aggregate images for each campground
    campgrounds.forEach((campground) => {
      const {
        id,
        title,
        geometry_type,
        coordinates_x,
        coordinates_y,
        price,
        description,
        location,
        author_id,
        image_url,
        image_filename,
      } = campground;

      const popUpMarkup = `
        <strong><a href="/campgrounds/${id}">${title}</a></strong>
        <p>${description.substring(0, 20)}...</p>
        <p>${price}/night</p>
      `;

      // If the campground is not in the map, add it
      if (!campgroundMap[id]) {
        campgroundMap[id] = {
          id,
          title,
          geometry: {
            type: geometry_type,
            coordinates: [coordinates_x, coordinates_y],
          },
          price,
          description,
          location,
          author_id,
          properties: {
            popUpMarkup,
          },
          image_url,
          image_filename,
        };
      }
    });

    // Convert object values to an array of campgrounds
    const aggregatedCampgrounds = Object.values(campgroundMap);
    // Render the index page with the retrieved campgrounds
    res.render("campgrounds/index", {
      campgrounds: aggregatedCampgrounds,
      username: req.user.username,
      userId: req.user.id,
    });
  } catch (error) {
    console.error("Error fetching campgrounds:", error);
    // Handle error appropriately, e.g., render an error page
    res.status(500).send("Internal Server Error");
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
};

module.exports.createCampground = async (req, res, next) => {
  try {
    const location = req.body.campground.location;
    // Geocode the location to obtain coordinates
    const geoData = await geocoder
      .forwardGeocode({
        query: location,
        limit: 1,
      })
      .send();
    const coordinates = geoData.body.features[0].geometry.coordinates;
    const type = geoData.body.features[0].geometry.type;

    // Insert new campground into Campground table
    const title = req.body.campground.title;
    const description = req.body.campground.description;
    const price = req.body.campground.price;
    const authorId = req.user.id;

    const insertCampgroundQuery = `
      INSERT INTO Campground (title, geometry_type, coordinates_x, coordinates_y, price, description, location, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertCampgroundValues = [
      title,
      type,
      coordinates[0],
      coordinates[1],
      price,
      description,
      location,
      authorId,
    ];
    const [insertCampgroundResult] = await mySqlPool.query(
      insertCampgroundQuery,
      insertCampgroundValues
    );
    const campgroundId = insertCampgroundResult.insertId;

    // Insert images into Image table
    const imageInsertQueries = req.files.map((f) => {
      const imageUrl = f.path;
      const imageName = f.filename;
      const insertImageQuery = `
        INSERT INTO Image (campground_id, url, filename)
        VALUES (?, ?, ?)
      `;
      const insertImageValues = [campgroundId, imageUrl, imageName];
      return mySqlPool.query(insertImageQuery, insertImageValues);
    });
    await Promise.all(imageInsertQueries);
    res.cookie(
      "flash",
      { type: "success", message: "Successfully created a new campground" },
      { httpOnly: true }
    );
    res.redirect(`/campgrounds/${campgroundId}`);
  } catch (error) {
    console.error("Error creating campground:", error);
    res.cookie(
      "flash",
      { type: "error", message: "Failed to create campground" },
      { httpOnly: true }
    );
    res.redirect("back");
  }
};

module.exports.showCampground = async (req, res) => {
  try {
    const campgroundId = req.params.id;

    // Retrieve campground information
    const campgroundQuery = `
      SELECT
        c.id AS campground_id,
        c.title AS campground_title,
        c.geometry_type AS campground_geometry_type,
        c.coordinates_x AS campground_coordinates_x,
        c.coordinates_y AS campground_coordinates_y,
        c.price AS campground_price,
        c.description AS campground_description,
        c.location AS campground_location,
        c.author_id AS campground_author_id
      FROM
        Campground c
      WHERE
        c.id = ?
    `;
    const [campgroundRows] = await mySqlPool.query(campgroundQuery, [
      campgroundId,
    ]);

    if (campgroundRows.length === 0) {
      res.cookie(
        "flash",
        { type: "error", message: "Cannot find the campground" },
        { httpOnly: true }
      );

      return res.redirect("/campgrounds");
    }

    const {
      campground_id,
      campground_title,
      campground_geometry_type,
      campground_coordinates_x,
      campground_coordinates_y,
      campground_price,
      campground_description,
      campground_location,
      campground_author_id,
    } = campgroundRows[0];

    const userQuery = ` SELECT username FROM User WHERE id = ?`;
    const [userRows] = await mySqlPool.query(userQuery, [campground_author_id]);
    const author_username = userRows[0] ? userRows[0].username : null;

    const campground = {
      id: campground_id,
      title: campground_title,
      geometry_type: campground_geometry_type,
      coordinates: [campground_coordinates_x, campground_coordinates_y],
      price: campground_price,
      description: campground_description,
      location: campground_location,
      author_id: campground_author_id,
      author_username: author_username,
    };

    // Retrieve reviews for the campground
    const reviewsQuery = `
      SELECT
        r.id AS review_id,
        r.body AS review_body,
        r.rating AS review_rating,
        r.author_id AS review_author_id
      FROM
        Review r
      WHERE
        r.campground_id = ?
    `;
    const [reviewsRows] = await mySqlPool.query(reviewsQuery, [campgroundId]);

    const reviews = await Promise.all(
      reviewsRows.map(async (row) => {
        const { review_id, review_body, review_rating, review_author_id } = row;
        const userQuery = `
        SELECT username
        FROM User
        WHERE id = ?
      `;
        const [userRows] = await mySqlPool.query(userQuery, [review_author_id]);
        const username = userRows[0] ? userRows[0].username : null;

        // Return the modified object with username
        return {
          id: review_id,
          body: review_body,
          rating: review_rating,
          author_id: review_author_id,
          username: username,
        };
      })
    );

    campground.reviews = reviews;

    // Retrieve images for the campground
    const imagesQuery = `
    SELECT
      i.id AS image_id,
      i.url AS image_url,
      i.filename AS image_filename
    FROM
      Image i
    WHERE
      i.campground_id = ?
  `;
    const [imagesRows] = await mySqlPool.query(imagesQuery, [campgroundId]);

    const images = imagesRows.map((row) => ({
      id: row.image_id,
      url: row.image_url,
      filename: row.image_filename,
    }));

    campground.images = images;

    const token = req.cookies.token;
    const currentUserId = req.user.id;
    res.render("campgrounds/show", {
      campground,
      currentUser: token,
      currentUserId,
    });
  } catch (error) {
    console.error("Error retrieving campground:", error);
    res.cookie(
      "flash",
      { type: "error", message: "Failed to retrieve campground" },
      { httpOnly: true }
    );

    res.redirect("/campgrounds");
  }
};

module.exports.renderEditForm = async (req, res) => {
  try {
    const { id } = req.params;

    const campgroundQuery = `SELECT id, title, geometry_type, coordinates_x, coordinates_y, price, description, location
                              FROM Campground
                              WHERE id = ?`;

    const [campgroundRows] = await mySqlPool.query(campgroundQuery, [id]);

    if (campgroundRows.length === 0) {
      res.cookie(
        "flash",
        { type: "error", message: "Cannot find the campground" },
        { httpOnly: true }
      );

      return res.redirect("/campgrounds");
    }

    const campground = {
      id: campgroundRows[0].id,
      title: campgroundRows[0].title,
      geometry_type: campgroundRows[0].geometry_type,
      coordinates: {
        x: campgroundRows[0].coordinates_x,
        y: campgroundRows[0].coordinates_y,
      },
      price: campgroundRows[0].price,
      description: campgroundRows[0].description,
      location: campgroundRows[0].location,
    };

    const imagesQuery = `
    SELECT
      i.id AS image_id,
      i.url AS image_url,
      i.filename AS image_filename
    FROM
      Image i
    WHERE
      i.campground_id = ?
  `;
    const [imagesRows] = await mySqlPool.query(imagesQuery, [id]);

    const images = imagesRows.map((row) => {
      const thumbnailUrl = row.image_url.replace("/upload", "/upload/w_80");
      return {
        id: row.image_id,
        url: row.image_url,
        filename: row.image_filename,
        thumbnail: thumbnailUrl,
      };
    });

    campground.images = images;

    res.render("campgrounds/edit", { campground });
  } catch (error) {
    console.error("Error retrieving campground:", error);
    res.cookie(
      "flash",
      { type: "error", message: "Failed to retrieve campground" },
      { httpOnly: true }
    );
    res.redirect("/campgrounds");
  }
};

module.exports.updateCampground = async (req, res) => {
  const { id } = req.params;
  const campgroundData = req.body.campground;

  const location = req.body.campground.location;
  const geoData = await geocoder
    .forwardGeocode({
      query: location,
      limit: 1,
    })
    .send();
  const coordinates = geoData.body.features[0].geometry.coordinates;

  // Update campground in the Campground table
  await mySqlPool.query(
    `
    UPDATE Campground
    SET title = ?, description = ?, location = ?, price = ?,  coordinates_x = ?,  coordinates_y = ?
    WHERE id = ?
  `,
    [
      campgroundData.title,
      campgroundData.description,
      campgroundData.location,
      campgroundData.price,
      coordinates[0],
      coordinates[1],
      id,
    ]
  );

  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  for (const img of imgs) {
    await mySqlPool.query(
      `
      INSERT INTO Image (campground_id, url, filename)
      VALUES (?, ?, ?)
    `,
      [id, img.url, img.filename]
    );
  }

  // Handle deletion of images
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      // Remove image from Cloudinary
      await cloudinary.uploader.destroy(filename);
      // Delete image from Image table
      await mySqlPool.query(
        `
        DELETE FROM Image
        WHERE campground_id = ? AND filename = ?
      `,
        [id, filename]
      );
    }
  }

  res.cookie(
    "flash",
    { type: "success", message: "Successfully Updated campground" },
    { httpOnly: true }
  );
  res.redirect(`/campgrounds/${id}`);
};

module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;
  try {
    // Begin a transaction
    await mySqlPool.query("START TRANSACTION");
    await mySqlPool.query("DELETE FROM Image WHERE campground_id = ?", [id]);
    await mySqlPool.query("DELETE FROM Review WHERE campground_id = ?", [id]);
    await mySqlPool.query("DELETE FROM Campground WHERE id = ?", [id]);

    res.cookie(
      "flash",
      { type: "success", message: "Successfully deleted a campground" },
      { httpOnly: true }
    );

    await mySqlPool.query("COMMIT");

    res.redirect("/campgrounds");
  } catch (error) {
    console.error("Error deleting campground:", error);
    res.cookie(
      "flash",
      { type: "error", message: "Error deleting campground" },
      { httpOnly: true }
    );
    // Rollback the transaction in case of an error
    await mySqlPool.query("ROLLBACK");
    res.redirect("/campgrounds");
  }
};
