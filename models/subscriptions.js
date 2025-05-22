const mongoose = require("mongoose");

//CLAIRE
const subscriptionsSchema = mongoose.Schema({
  type: {
    type: String,
    enum: ["normal", "réduit", "public", "entreprise"], // option enum dans le schéma Mongoose pour restreindre les valeurs acceptées pour le champ
    required: true,
  },
  numberOfLoans: Number,
  price: Number,
  durationMonth: Number,
  loanDurationMonth: Number,
});

const Subscriptions = mongoose.model("subscriptions", subscriptionsSchema);

module.exports = Subscriptions;
