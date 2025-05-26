var express = require("express");
var router = express.Router();

require("../models/connection");
const { getUpdatedFields } = require("../modules/getUpdatedFields");
const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");
const Users = require("../models/users");
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
            ongoingLoans: 0,
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
    .then((data) => {
      if (data && bcrypt.compareSync(req.body.password, data.password)) {
        const userInfo = {
          token: data.token,
          email: data.email,
          firstname: data.firstname,
          lastname: data.lastname,
          favoriteItems: data.favoriteItems,
        };

        if (data.subscription?.subscriptionType) {
          // Check if the user has a subscription
          userInfo.hasSubcribed = true;
          userInfo.authorisedLoans = data.subscription.worksCount;
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

//FATOUMATA
//ROUTE to put user update info
router.put("/update", (req, res) => {
  if (!req.body.token) {
    return res.status(400).json({ result: false, error: "Token is required" });
  }
  // recherche de l'utilisateur
  Users.findOne({ token: req.body.token })
    .then((data) => {
      if (!data) {
        return res.status(404).json({ result: false, error: "User not found" });
      }

      //comparaison des données du body avec les infos de l'utilisateur dans la base de données
      const allowedFields = [
        "firstname",
        "lastname",
        "phone",
        "address",
        "avatar",
      ];
      const updateData = getUpdatedFields(req.body, data, allowedFields);
      // Si les informations sont identiques, alors la base de données n'est pas mise à jour
      if (Object.keys(updateData).length === 0) {
        res.json({ result: false, message: "Aucun changement détecté." }); // message qui pourra être affiché dans le frontend
        return;
      }
      // Si une ou des informations sont différentes, la base de données est mise à jour
      Users.updateOne({ token: req.body.token }, { $set: updateData })
        .then(({ modifiedCount }) => {
          if (modifiedCount === 0) {
            res.json({ result: false, message: "Aucun changement détecté." }); // message qui pourra être affiché dans le frontend
          } else {
            res.json({
              result: true,
              message: "Information(s) personnelle(s) modifiée(s).", // le message pourra être affiché dans le frontend
              userInfo: updateData, // Ne renvoie que les champs modifiés (et pas la totalité des champs possibles)
            });
            // → à voir quand on sera sur l'écran si OK comme ça ou si préférable de tout renvoyer (et si on change d'avis, changer aussi TDD !!)
          }
        })
        .catch((err) => {
          console.error("Error updating user:", err);
          res
            .status(500)
            .json({ result: false, error: "Internal server error" });
        });
    })
    .catch((err) => {
      console.error("Error fetching user:", err);
      res.status(500).json({ result: false, error: "Internal server error" });
    });
});

module.exports = router;
