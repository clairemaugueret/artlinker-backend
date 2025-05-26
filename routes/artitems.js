//CLAIRE
var express = require("express");
var router = express.Router();

const { checkBody } = require("../modules/checkBody");
const { getDistanceInKm } = require("../modules/getDistanceInKm");
const Artitems = require("../models/artitems");
const Places = require("../models/places");
const User = require("../models/users");
const { token } = require("morgan");

// ROUTE to get all art items within 50 km of the given coordinates
// fields required in the body: latitude, longitude
router.post("/all", (req, res) => {
  if (!checkBody(req.body, ["latitude", "longitude"])) {
    res.json({ result: false, error: "Missing or empty fields" });
  } else {
    Artitems.find()
      .populate("artothequePlace")
      .then((data) => {
        const filteredData = [];

        data.forEach((item) => {
          const distance = getDistanceInKm(
            req.body.latitude,
            req.body.longitude,
            item.artothequePlace.latitude,
            item.artothequePlace.longitude
          );

          if (distance <= 50) {
            filteredData.push({
              ...item._doc, // Spread the item properties to include all fields from the content, but not the fields of the metadata
              distance: distance,
            });
          }
        });

        filteredData.sort((a, b) => a.distance - b.distance);

        res.json({ result: true, artitemsList: filteredData });
        // Send back the art items list filtered with each time the calculated distance added
        // Send back an empty array if no items are found
      })
      .catch((err) => {
        console.error("Error fetching documents:", err);
        res.status(500).json({ result: false, error: "Internal server error" });
      });
  }
});

//thomas
//route creation d'un prêt
router.post("/createloan", async (req, res) => {
  try {
    const user = await User.findOne({ token: req.body.token });
    if (!user) {
      return res.json({ result: false, error: "User not found" });
    }

    // Calcul de la date de fin de prêt (3 mois)
    const endDate = new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000);

    // Ajout dans ongoingLoans de l'utilisateur
    await user.updateOne({
      $push: {
        ongoingLoans: {
          artItem: req.body.artitemId,
          startDate: new Date(),
          requestStatus: "INIT_DEMAND_DISPO",
          isExtendedLoan: false,
          loanPhotos: [],
          returnPhotos: [],
        },
      },
    });

    // Ajout du prêt dans l'œuvre
    const artitem = await Artitems.findById(req.body.artitemId);
    if (!artitem) {
      return res.json({ result: false, error: "Art item not found" });
    }

    artitem.disponibility = false;
    artitem.expectedReturnDate = endDate;

    // Mise à jour du champ expectedReturnDate

    await artitem.save();

    res.json({
      result: true,
      message: "Loan created successfully",
    });
  } catch (err) {
    console.error("Error in /createloan:", err);
    res.status(500).json({ result: false, error: "Internal server error" });
  }
});

module.exports = router;
