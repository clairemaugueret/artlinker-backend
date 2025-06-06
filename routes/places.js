//CLAIRE
var express = require("express");
var router = express.Router();

const { checkBody } = require("../modules/checkBody");
const { getDistanceInKm } = require("../modules/getDistanceInKm");
const Places = require("../models/places");

// ROUTE to get all places within 50 km of the given coordinates
// fields required in the body: latitude, longitude
router.post("/all", (req, res) => {
  if (!checkBody(req.body, ["latitude", "longitude"])) {
    res.json({ result: false, error: "Missing or empty fields" });
  } else {
    Places.find()
      .then((data) => {
        const filteredData = [];

        data.forEach((item) => {
          const distance = getDistanceInKm(
            req.body.latitude,
            req.body.longitude,
            item.latitude,
            item.longitude
          );

          if (distance <= 50) {
            filteredData.push({
              ...item._doc, // Spread the item properties to include all fields from the content, but not the fields of the metadata
              distance: distance,
            });
          }
        });

        filteredData.sort((a, b) => a.distance - b.distance);

        res.json({ result: true, placesList: filteredData });
        // Send back the places list filtered with each time the calculated distance added
        // Send back an empty array if no items are found
      })
      .catch((err) => {
        console.error("Error fetching documents:", err);
        res.status(500).json({ result: false, error: "Internal server error" });
      });
  }
});

module.exports = router;
