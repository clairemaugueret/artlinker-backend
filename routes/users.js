var express = require("express");
var router = express.Router();

require("../models/connection");
const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");
const Users = require("../models/users");
const Subscriptions = require("../models/subscriptions");
const Artitems = require("../models/artitems");
const Places = require("../models/places");

//CLAIRE
// ROUTE signup
// required body fields: firstname, lastname, email, password
router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["firstname", "lastname", "email", "password"])) {
    res.json({ result: false, error: "Champs vides ou manquants." }); // Error message that can be displayed in the frontend
    return;
  }

  // Check if the user has not already been registered
  Users.findOne({ email: req.body.email })
    .then((data) => {
      if (data === null) {
        const hash = bcrypt.hashSync(req.body.password, 10);

        const newUser = new Users({
          email: req.body.email,
          password: hash,
          token: uid2(32),
          accountType: "user", //default value for new users (could be changed later if needed when the app and the website will be linked)
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          phone: req.body.phone || "",
          address: req.body.address || "",
          avatar: null,
          favoriteItems: [],
          subscription: null,
          ongoingLoans: [],
          previousLoans: [],
          identityCard: null,
          civilLiabilityCertificate: null,
        });

        newUser.save().then((newDoc) => {
          const userInfo = {
            token: newDoc.token,
            email: newDoc.email,
            firstname: newDoc.firstname,
            lastname: newDoc.lastname,
            favoriteItems: newDoc.favoriteItems,
            hasSubcribed: false,
            authorisedLoans: 0,
            ongoingLoans: newDoc.ongoingLoans.length,
          };

          res.json({ result: true, userInfo: userInfo });
          // Send back all the information needed for the Redux store
        });
      } else {
        // User already exists in database
        res.json({
          result: false,
          error: "Utilisateur déjà existant, veuillez vous connecter.",
        }); // Error message that can be displayed in the frontend
      }
    })
    .catch((err) => {
      console.error("Error fetching documents:", err);
      res.status(500).json({ result: false, error: "Internal server error" });
    });
});

//CLAIRE
//ROUTE signin
//required body fields: email, password
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Champs vides ou manquants." }); // Error message that can be displayed in the frontend
    return;
  }

  Users.findOne({ email: req.body.email })
    .populate("favoriteItems")
    .populate("subscription.type")
    .then((data) => {
      console.log("data", data);
      if (data && bcrypt.compareSync(req.body.password, data.password)) {
        const userInfo = {
          token: data.token,
          email: data.email,
          firstname: data.firstname,
          lastname: data.lastname,
          favoriteItems: data.favoriteItems,
        };

        if (data.subscription?.type) {
          // Check if the user has a subscription
          userInfo.hasSubcribed = true;
          userInfo.authorisedLoans = data.subscription.type.numberOfLoans;
          userInfo.ongoingLoans = data.ongoingLoans.length;
        } else {
          // If the user does not have a subscription
          userInfo.hasSubcribed = false;
          userInfo.authorisedLoans = 0;
          userInfo.ongoingLoans = 0;
        }
        res.json({ result: true, userInfo: userInfo });
        // Send back all the information needed for the Redux store
      } else {
        res.json({ result: false, error: "Email ou mot de passe erroné." }); // Error message that can be displayed in the frontend
      }
    });
});

//CLAIRE
//ROUTE to get the user info for the profile page
router.get("/:token", (req, res) => {
  if (!req.params.token) {
    res.json({
      result: false,
      error: "Veuillez vous inscrire ou vous connecter.", // Error message that can be displayed in the frontend
    });
    return;
  }

  Users.findOne({ token: req.params.token })
    .populate({
      path: "favoriteItems",
      populate: {
        path: "artothequePlace",
        model: "places",
      },
    })
    .populate("subscription.type")
    .populate({
      path: "ongoingLoans.artItem",
      populate: {
        path: "artothequePlace",
        model: "places",
      },
    })
    .populate({
      path: "previousLoans.artItem",
      populate: {
        path: "artothequePlace",
        model: "places",
      },
    })
    .then((data) => {
      res.json({ result: true, userData: data });
      // Send back all the user information needed for the profile page
    })
    .catch((err) => {
      console.error("Error fetching documents:", err);
      res.status(500).json({ result: false, error: "Internal server error" });
    });
});

//thomas
//Route post sub user
router.post("/user/sub", async (req, res) => {
  const { userId, subDocId } = req.body;

  // Trouver l'utilisateur
  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).send("User not found");
  }

  // Trouver le sous-document
  const subDoc = user.subDocuments.id(subDocId);
  if (!subDoc) {
    return res.status(404).send("Sub-document not found");
  }

  // Envoyer le sous-document en réponse
  res.status(200).json(subDoc);
});

module.exports = router;
