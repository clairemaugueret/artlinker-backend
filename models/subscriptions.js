const mongoose = require("mongoose");

//CLAIRE
const subscriptionsSchema = mongoose.Schema({
  title: String,
  numberOfLoans: Number,
  price: Number,
  loanMonthPeriod: Number,
});

const Subscriptions = mongoose.model("subscriptions", subscriptionsSchema);

module.exports = Subscriptions;
