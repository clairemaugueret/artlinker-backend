const mongoose = require("mongoose");

//CLAIRE
const loansSchema = mongoose.Schema({
  artItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "artitems",
  },
  startDate: Date,
  requestedStatus: {
    type: String,
    enum: [
      // option enum dans le schéma Mongoose pour restreindre les valeurs acceptées pour le champ
      "loan requested",
      "loan accepted",
      "loan refused",
      "loan cancelled",
      "loan ongoing",
      "pending return",
      "returned",
      "return confirmed",
      "return refused",
      "late return",
    ],
    required: true,
  },
  isExtendedLoan: Boolean,
  loanPhotos: [String],
  returnPhotos: [String],
});

const usersSchema = mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  password: String,
  token: String,
  accountType: String,
  phone: String,
  address: String,
  avatar: String,
  favoriteItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "artitems",
    },
  ],
  subscription: {
    ref: { type: mongoose.Schema.Types.ObjectId, ref: "subscriptions" },
    startDate: Date,
    endDate: Date,
    borrowCapacity: Number,
    paidPrice: Number,
    isPaid: Boolean,
    paymentDate: Date,
    acceptedGTC: Boolean,
    acceptedGCU: Boolean,
  },
  ongoingLoans: [loansSchema],
  previousLoans: [loansSchema],
  identityCard: {
    document: String,
    expirationDate: Date,
  },
  civilLiabilityCertificate: {
    document: String,
    expirationDate: Date,
  },
});

const Users = mongoose.model("users", usersSchema);

module.exports = Users;
