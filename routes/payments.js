const express = require("express");
const router = express.Router();
console.log("Stripe API Key:", process.env.STRIPE_SECRET_KEY);
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Route pour créer un customer
router.post("/create-customer", async (req, res) => {
  try {
    // On récupère l'email et le nom envoyés dans le body de la requête
    const { email, name } = req.body;

    // Création du client Stripe avec les informations fournies
    const customer = await stripe.customers.create({
      email: email, // Email du client
      name: name, // Nom du client
      // Possibilité d'ajouter d'autres paramètres comme l'adresse, le téléphone, etc.
    });

    // On renvoie au front l'ID du client créé ainsi que ses informations principales
    res.status(200).json({
      customerId: customer.id, // Identifiant Stripe du client
      email: customer.email, // Email du client
      name: customer.name, // Nom du client
    });
  } catch (error) {
    // En cas d'erreur, on renvoie un message d'erreur au front
    res.status(400).json({ error: { message: error.message } });
  }
});

// Route pour créer un abonnement
router.post("/create-subscription", async (req, res) => {
  // On récupère le customerId et le priceId envoyés dans le body de la requête
  const { customerId, priceId } = req.body;

  try {
    // Création de l'abonnement Stripe avec les paramètres nécessaires
    const subscription = await stripe.subscriptions.create({
      customer: customerId, // L'identifiant du client Stripe à abonner
      items: [
        {
          price: priceId, // L'identifiant du prix Stripe correspondant à l'abonnement choisi
        },
      ],
      payment_behavior: "default_incomplete", // Permet de créer l'abonnement sans valider le paiement immédiatement (utile pour SCA/3D Secure)
      payment_settings: { save_default_payment_method: "on_subscription" }, // Sauvegarde la méthode de paiement pour les paiements futurs de cet abonnement
      expand: ["latest_invoice.confirmation_secret"], // Permet de récupérer le client_secret pour confirmer le paiement côté front
    });

    // On renvoie au front l'ID de l'abonnement et le clientSecret pour la confirmation du paiement
    res.status(200).json({
      subscriptionId: subscription.id,
      subscription: subscription,
      //clientSecret:subscription.latest_invoice.confirmation_secret.client_secret,
    });
  } catch (error) {
    // En cas d'erreur, on renvoie un message d'erreur au front
    res.status(400).json({ error: { message: error.message } });
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
