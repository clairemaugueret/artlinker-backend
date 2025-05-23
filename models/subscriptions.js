const mongoose = require("mongoose");

//CLAIRE
const subscriptionsSchema = mongoose.Schema({
  type: {
    type: String,
    enum: [
      // option enum dans le schéma Mongoose pour restreindre les valeurs acceptées pour le champ
      "INDIVIDUAL_BASIC_COST",
      "INDIVIDUAL_REDUCT_COST",
      "PUBLIC_ESTABLISHMENT",
      "LIBERAL_PRO",
      "GIFT_CARD",
    ],
    required: true,
  },
  numberOfLoans: Number,
  price: Number,
  durationMonth: Number,
  loanDurationMonth: Number,
});

const Subscriptions = mongoose.model("subscriptions", subscriptionsSchema);

module.exports = Subscriptions;
