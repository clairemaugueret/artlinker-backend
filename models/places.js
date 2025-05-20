const mongoose = require("mongoose");

//CLAIRE
const placesSchema = mongoose.Schema({
  type: String,
  name: String,
  address: String,
  latitude: Number,
  longitude: Number,
});

const Places = mongoose.model("places", placesSchema);

module.exports = Places;
