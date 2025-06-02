//RAPHAEL
const express = require("express");
const router = express.Router();
const Users = require("../models/users");

router.post("/create", async (req, res) => {
  try {
    const { token, subscriptionType, count, price, stripeSubscriptionId } =
      req.body; // Ajoutez stripeSubscriptionId

    if (!token || !subscriptionType || !count || !price) {
      res.json({ result: false, error: "Champs vides ou manquants." });
      return;
    }

    const user = await Users.findOne({ token });
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

    // Mise à jour de l'abonnement de l'utilisateur
    user.subscription = {
      subscriptionType,
      createdAt,
      worksCount: count,
      price,
      durationMonth,
      calculatedEndDate,
      //stripeSubscriptionId: stripeSubscriptionId || null, // Utilisez la valeur passée depuis le front
    };

    // // Marquer l'utilisateur comme ayant un abonnement
    // user.hasSubcribed = true; // Ajoutez cette ligne si ce champ existe
    // user.authorisedLoans = count; // Mettez à jour le nombre d'emprunts autorisés

    await user.save();

    // Construction de l'objet subscriptionDetails à renvoyer au front
    const subscriptionDetails = {
      id: user.subscription._id,
      type: subscriptionType,
      worksCount: count,
      price: price,
      startDate: createdAt,
      endDate: calculatedEndDate,
      status: "active",
      stripeSubscriptionId: stripeSubscriptionId || null,
    };

    // Renvoi de la réponse vers le front
    res.json({
      result: true, // Changez "success" en "result" pour être cohérent avec vos autres routes
      subscriptionDetails,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'abonnement:", error);
    res.json({ result: false, error: error.message });
  }
});

module.exports = router;
