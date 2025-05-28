//RAPHAEL
const express = require("express");
const router = express.Router();
const axios = require("axios");
const Users = require("../models/users"); // Assurez-vous que le chemin est correct

router.post("/create", async (req, res) => {
  try {
    const { token, subscriptionType, count, price } = req.body;

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

    // Envoi d'une requête vers la route de paiement en utilisant axios (équivalent simplifié des fetch)
    const paymentResponse = await axios.post(
      "http://localhost:3000/payments/create-subscription",
      {
        email: user.email,
        subscriptionType,
        price,
      }
    );

    // Mise à jour de l'abonnement de l'utilisateur
    user.subscription = {
      subscriptionType,
      createdAt,
      worksCount: count,
      price,
      durationMonth,
      calculatedEndDate,
      stripeSubscriptionId: paymentResponse.data.subscriptionId,
    };

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
      stripeSubscriptionId: paymentResponse.data.subscriptionId,
    };

    // Renvoi de la réponse vers le front
    res.json({
      success: true,
      subscriptionDetails,
      clientSecret: paymentResponse.data.clientSecret,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'abonnement:", error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
