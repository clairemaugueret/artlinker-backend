//RAPHAEL
var express = require("express");
var router = express.Router();

const { checkBody } = require("../modules/checkBody");

const Users = require("../models/users");

router.put("/update", (req, res) => {
  const { token, subscriptionType, count, price } = req.body;

  if (!checkBody(req.body, ["token", "subscriptionType", "count", "price"])) {
    res.json({ result: false, error: "Champs vides ou manquants." });
    return;
  }

  Users.findOne({ token })
    .then((user) => {
      if (!user) {
        res.json({ result: false, error: "Utilisateur non trouvé." });
        return;
      }

      // Calcul des dates
      const now = new Date();
      const durationMonth = 12;
      const createdAt = now;
      const calculatedEndDate = new Date(now);
      calculatedEndDate.setMonth(calculatedEndDate.getMonth() + durationMonth);

      // Mise à jour du sous-document subscription
      user.subscription = user.subscription || {}; // S'assure que le sous-document subscription existe (sinon on l'initialise à un objet vide)
      user.subscription.subscriptionType = subscriptionType;
      user.subscription.createdAt = createdAt;
      user.subscription.worksCount = count;
      user.subscription.price = price;
      user.subscription.durationMonth = durationMonth;
      user.subscription.calculatedEndDate = calculatedEndDate;

      user
        .save()
        .then(() => {
          res.json({ result: true, message: "Abonnement mis à jour." });
        })
        .catch((err) => {
          console.error("Erreur lors de la sauvegarde :", err);
          res
            .status(500)
            .json({ result: false, error: "Erreur lors de la sauvegarde." });
        });
    })
    .catch((err) => {
      console.error("Erreur lors de la recherche de l'utilisateur :", err);
      res.status(500).json({ result: false, error: "Erreur serveur." });
    });
});

module.exports = router;
