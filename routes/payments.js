const express = require("express");
const router = express.Router();
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

// Cette grille associe chaque type d'abonnement et nombre d'œuvres à un Price ID Stripe spécifique
const stripePriceIds = {
  INDIVIDUAL_BASIC_COST: "price_1RWar9CRuiuQazlKlSEstSxv", // Price ID pour 1 œuvre - Particulier normal
  INDIVIDUAL_REDUCT_COST: "price_1RWat4CRuiuQazlKD9XOHvIo",
  PUBLIC_ESTABLISHMENT: "price_1RWLeYCRuiuQazlKgiQ90MCe", // Price ID pour 5 œuvres - Établissement public
  LIBERAL_PRO: "price_1RWNUECRuiuQazlKO3hIvbGK", // Price ID pour 3 œuvres - Entreprise
};

// Route pour créer un abonnement
router.post("/create-subscription", async (req, res) => {
  // On récupère le customerId et le priceId envoyés dans le body de la requête
  const { customerId, subscriptionType, quantity } = req.body;

  try {
    // Création de l'abonnement Stripe avec les paramètres nécessaires
    const subscription = await stripe.subscriptions.create({
      customer: customerId, // L'identifiant du client Stripe à abonner
      items: [
        {
          price: stripePriceIds[subscriptionType], // L'identifiant du prix Stripe correspondant à l'abonnement choisi
          quantity: quantity, // La quantité d'abonnements (par exemple, le nombre de licences)
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
      clientSecret:
        subscription.latest_invoice.confirmation_secret.client_secret,
    });
  } catch (error) {
    // En cas d'erreur, on renvoie un message d'erreur au front
    res.status(400).json({ error: { message: error.message } });
  }
});

module.exports = router;
