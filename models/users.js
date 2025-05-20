const mongoose = require("mongoose");

//CLAIRE
const loansSchema = mongoose.Schema({
  artItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "artitems",
  },
  startDate: Date,
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
    type: { type: mongoose.Schema.Types.ObjectId, ref: "subscriptions" },
    startDate: Date,
    endDate: Date,
    isPaid: Boolean,
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
