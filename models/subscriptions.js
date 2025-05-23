const mongoose = require("mongoose");

//CLAIRE
const subscriptionsSchema = mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  createdAt: Date,
  updatedAt: Date,
  subscriptiontype: {
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
  worksCount: Number,
  durationMonth: Number,
  price: Number,
  loanDurationMonth: Number,

  transactionId: String,
  transactionStatus: String,
});

const Subscriptions = mongoose.model("subscriptions", subscriptionsSchema);

module.exports = Subscriptions;
