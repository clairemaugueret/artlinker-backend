var express = require("express");
var router = express.Router();
require("dotenv").config();
require("../models/connection");
const { getUpdatedFields } = require("../modules/getUpdatedFields");
const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");
const Users = require("../models/users");
const Artitems = require("../models/artitems");
const Places = require("../models/places");

//POUR RECEPTION FICHIER ET STOCKAGE DANS CLOUDINARY
const uniqid = require("uniqid");
const path = require("path"); //module natif Node.js pour manipuler facilement et de façon fiable les chemins de fichiers et d’extensions
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

//Avec un backend déployé sur Vercel, les routes ne peuvent pas faire appel à stockage temporaire dans le backend le temps de l'upload vers Cloudinary
// Le module 'streamifier' permet de convertir un buffer (comme un fichier uploadé via express-fileupload) en flux lisible (readable stream).
// Cela est utile pour envoyer directement un fichier à un service comme Cloudinary sans l'enregistrer sur le disque.
// On l’utilise ici pour transmettre un fichier en mémoire (Buffer) via .pipe() au flux d’upload de Cloudinary.
// lien du module streamifier sur npm: https://www.npmjs.com/package/streamifier
const streamifier = require("streamifier");

const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PHONE_REGEX = /^(\+?\d{1,3}[-.\s]?)?(\d{10})$/;

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
          subscription: {},
          ongoingLoans: [],
          previousLoans: [],
          identityCard: {},
          proofOfResidency: {},
          civilLiabilityCertificate: {},
        });

        newUser.save().then((newDoc) => {
          const userInfo = {
            token: newDoc.token,
            email: newDoc.email,
            firstname: newDoc.firstname,
            lastname: newDoc.lastname,
            favoriteItems: newDoc.favoriteItems,
            hasSubscribed: false,
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
          userInfo.hasSubscribed = true;
          userInfo.authorisedLoans = data.subscription.worksCount;
          userInfo.ongoingLoans = data.ongoingLoans.length;
        } else {
          // If the user does not have a subscription
          userInfo.hasSubscribed = false;
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

  // Vérification du format email si l'email est présent dans la requête
  if (req.body.email && !EMAIL_REGEX.test(req.body.email)) {
    return res
      .status(400)
      .json({ result: false, error: "Format d'email invalide" });
  }

  // Vérification du format téléphone si le téléphone est présent dans la requête
  if (req.body.phone && !PHONE_REGEX.test(req.body.phone)) {
    return res
      .status(400)
      .json({ result: false, error: "Format de téléphone invalide" });
  }

  // recherche de l'utilisateur
  Users.findOne({ token: req.body.token })
    .then((data) => {
      if (!data) {
        return res.status(404).json({ result: false, error: "User not found" });
      }

      //comparaison des données du body avec les infos de l'utilisateur dans la base de données
      const allowedFields = [
        "email",
        "password",
        "firstname",
        "lastname",
        "phone",
        "address",
      ];
      const updateData = getUpdatedFields(req.body, data, allowedFields);
      // Si les informations sont identiques, alors la base de données n'est pas mise à jour
      if (Object.keys(updateData).length === 0) {
        res.json({ result: false, message: "Aucun changement détecté." }); // message qui pourra être affiché dans le frontend
        return;
      }
      // Si une ou des informations sont différentes, la base de données est mise à jour
      if (updateData.password) {
        // Si le mot de passe est modifié, on le hash avant de l'enregistrer
        updateData.password = bcrypt.hashSync(updateData.password, 10);
      }
      Users.updateOne({ token: req.body.token }, { $set: updateData })
        .then(({ modifiedCount }) => {
          if (modifiedCount === 0) {
            res.json({ result: false, message: "Aucun changement détecté." }); // message qui pourra être affiché dans le frontend
          } else {
            // Fetch the updated user document to return the latest data
            Users.findOne({ token: req.body.token })
              .then((updatedUser) => {
                res.json({
                  result: true,
                  message: "Information(s) personnelle(s) modifiée(s).", // le message pourra être affiché dans le frontend
                  userInfo: updatedUser, // Renvoie toutes les infos utilisateur à jour
                });
              })
              .catch((err) => {
                console.error("Error fetching updated user:", err);
                res
                  .status(500)
                  .json({ result: false, error: "Internal server error" });
              });
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

//FATOUMATA
//ROUTE update user avatar
router.put("/updateAvatar", (req, res) => {
  const token = req.body.token;
  const avatar = req.files?.avatar;

  if (!token || !avatar) {
    return res
      .status(400)
      .json({ result: false, error: "Token et avatar requis" });
  }

  const uniqueFileName = `user-${token}_avatar_${uniqid()}`;

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "ArtLinkerUsersAvatars",
      public_id: uniqueFileName,
      resource_type: "image",
    },
    (error, result) => {
      if (error || !result) {
        return res
          .status(500)
          .json({ result: false, error: "Échec de l'upload Cloudinary" });
      }

      Users.updateOne({ token }, { $set: { avatar: result.secure_url } })
        .then((updateResult) => {
          if (updateResult.modifiedCount === 0) {
            return res.status(404).json({
              result: false,
              error: "Utilisateur non trouvé ou avatar non modifié",
            });
          }

          // Renvoie les infos mises à jour pour rafraîchir le frontend
          Users.findOne({ token }).then((userInfo) => {
            if (!userInfo) {
              return res.status(404).json({
                result: false,
                error: "Utilisateur introuvable après la mise à jour",
              });
            }

            res.json({
              result: true,
              message: "Avatar mis à jour avec succès",
              userInfo,
            });
          });
        })
        .catch((err) => {
          res
            .status(500)
            .json({ result: false, error: "Erreur lors de la mise à jour" });
        });
    }
  );

  // Important : envoyer le flux de l'image à Cloudinary
  streamifier.createReadStream(avatar.data).pipe(uploadStream);
});

//CLAIRE
//ROUTE to put user update carte identité
router.put("/addidentitycard", async (req, res) => {
  const file = req.files?.userDocument;
  const expirationDate = req.body.expirationDate;
  const token = req.body.userToken;

  if (!file || !expirationDate || !token) {
    res.json({
      result: false,
      error:
        "Fichier, date d'expiration ou identification de l'utilisateur manquant",
    });
    return;
  }

  //ADAPTATION DE L'ENVOI A CLOUDINARY UN PEU DIFFERENT DU COURS POUR DEJA POURVOIR FONCTIONNER QUAND ON AURA DEPLOYER
  //différence: on ne passe par un stockage temporaire dans le backend (car Vercel est serverless) mais on envoie en direct grâce au module streamifier
  const uniqueFileName = `user-${token}_identityCard_${uniqid()}`;

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "ArtLinkerUsersDocuments",
      public_id: uniqueFileName,
      resource_type: "auto", // pdf ou image
    },
    (error, result) => {
      if (error || !result) {
        res.json({ result: false, error: "Échec de l'upload" });
        return;
      }

      Users.findOneAndUpdate(
        { token },
        {
          "identityCard.document": result.secure_url,
          "identityCard.expirationDate": expirationDate,
        },
        { new: true }
      )
        .then((updatedUser) => {
          if (!updatedUser) {
            res.json({ result: false, error: "Utilisateur non trouvé" });
          } else {
            res.json({ result: true, user: updatedUser });
          }
        })
        .catch((dbError) => {
          res.json({ result: false, error: dbError.message });
        });
    }
  );

  streamifier.createReadStream(file.data).pipe(uploadStream);
});

//CLAIRE
//ROUTE to put user update justificatif de domicile
router.put("/addproofresidency", async (req, res) => {
  const file = req.files?.userDocument;
  const expirationDate = req.body.expirationDate;
  const token = req.body.userToken;

  if (!file || !expirationDate || !token) {
    res.json({
      result: false,
      error:
        "Fichier, date d'expiration ou identification de l'utilisateur manquant",
    });
    return;
  }

  //ADAPTATION DE L'ENVOI A CLOUDINARY UN PEU DIFFERENT DU COURS POUR DEJA POURVOIR FONCTIONNER QUAND ON AURA DEPLOYER
  //différence: on ne passe par un stockage temporaire dans le backend (car Vercel est serverless) mais on envoie en direct grâce au module streamifier
  const uniqueFileName = `user-${token}_proofOfResidency_${uniqid()}`;

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "ArtLinkerUsersDocuments",
      public_id: uniqueFileName,
      resource_type: "auto", // pdf ou image
    },
    (error, result) => {
      if (error || !result) {
        res.json({ result: false, error: "Échec de l'upload" });
        return;
      }

      Users.findOneAndUpdate(
        { token },
        {
          "proofOfResidency.document": result.secure_url,
          "proofOfResidency.expirationDate": expirationDate,
        },
        { new: true }
      )
        .then((updatedUser) => {
          if (!updatedUser) {
            res.json({ result: false, error: "Utilisateur non trouvé" });
          } else {
            res.json({ result: true, user: updatedUser });
          }
        })
        .catch((dbError) => {
          res.json({ result: false, error: dbError.message });
        });
    }
  );

  streamifier.createReadStream(file.data).pipe(uploadStream);
});

//CLAIRE
//ROUTE to put user update responsabilité civile
router.put("/addcertificate", async (req, res) => {
  const file = req.files?.userDocument;
  const expirationDate = req.body.expirationDate;
  const token = req.body.userToken;

  if (!file || !expirationDate || !token) {
    res.json({
      result: false,
      error:
        "Fichier, date d'expiration ou identification de l'utilisateur manquant",
    });
    return;
  }

  //ADAPTATION DE L'ENVOI A CLOUDINARY UN PEU DIFFERENT DU COURS POUR DEJA POURVOIR FONCTIONNER QUAND ON AURA DEPLOYER
  //différence: on ne passe par un stockage temporaire dans le backend (car Vercel est serverless) mais on envoie en direct grâce au module streamifier
  const uniqueFileName = `user-${token}_civilLiabilityCertificate_${uniqid()}`;

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "ArtLinkerUsersDocuments",
      public_id: uniqueFileName,
      resource_type: "auto", // pdf ou image
    },
    (error, result) => {
      if (error || !result) {
        res.json({ result: false, error: "Échec de l'upload" });
        return;
      }

      Users.findOneAndUpdate(
        { token },
        {
          "civilLiabilityCertificate.document": result.secure_url,
          "civilLiabilityCertificate.expirationDate": expirationDate,
        },
        { new: true }
      )
        .then((updatedUser) => {
          if (!updatedUser) {
            res.json({ result: false, error: "Utilisateur non trouvé" });
          } else {
            res.json({ result: true, user: updatedUser });
          }
        })
        .catch((dbError) => {
          res.json({ result: false, error: dbError.message });
        });
    }
  );

  streamifier.createReadStream(file.data).pipe(uploadStream);
});

module.exports = router;
