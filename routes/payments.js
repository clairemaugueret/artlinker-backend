const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-subscription", async (req, res) => {
  try {
    // Extraction des données envoyées depuis subscriptions.js
    const { email, subscriptionType, price } = req.body;

    // Vérification que toutes les données nécessaires sont présentes
    if (!email || !subscriptionType || !price) {
      return res.status(400).json({ error: "Données manquantes" });
    }

    // 1. Création ou récupération d'un client Stripe
    // Cela permet de lier l'abonnement à un client spécifique dans Stripe
    let customer = await stripe.customers.create({
      email: email,
      // Vous pouvez ajouter d'autres détails du client ici si nécessaire
    });

    // 2. Création de l'abonnement Stripe
    const subscription = await stripe.subscriptions.create({
      customer: customer.id, // Lie l'abonnement au client créé
      items: [
        {
          // Utilise une fonction helper pour obtenir l'ID de prix Stripe correspondant au type d'abonnement
          price: getPriceIdForSubscriptionType(subscriptionType),
        },
      ],
      // Permet de confirmer le paiement côté client, utile pour l'authentification 3D Secure
      payment_behavior: "default_incomplete",
      // Inclut les détails de la facture et de l'intention de paiement dans la réponse
      expand: ["latest_invoice.payment_intent"],
      // Ajoute des métadonnées personnalisées à l'abonnement pour un suivi facile
      metadata: {
        subscriptionType: subscriptionType,
        price: price,
      },
    });

    // 3. Préparation de la réponse à envoyer au client
    res.json({
      subscriptionId: subscription.id, // ID unique de l'abonnement créé
      // Client secret nécessaire pour finaliser le paiement côté client
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    // Gestion des erreurs
    console.error("Erreur lors de la création de l'abonnement:", error);
    res.status(400).json({ error: error.message });
  }
});

// Fonction helper pour obtenir l'ID de prix Stripe basé sur le type d'abonnement
function getPriceIdForSubscriptionType(subscriptionType) {
  // Cette fonction doit être implémentée selon votre configuration Stripe
  // Elle doit retourner l'ID de prix Stripe correspondant à chaque type d'abonnement
  switch (subscriptionType) {
    case "basic":
      return "price_basic123"; // Remplacez par votre vrai ID de prix Stripe
    case "premium":
      return "price_premium456"; // Remplacez par votre vrai ID de prix Stripe
    default:
      throw new Error("Type d'abonnement non reconnu");
  }
}

module.exports = router;
