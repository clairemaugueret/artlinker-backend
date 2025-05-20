const mongoose = require("mongoose");

//CLAIRE
const artitemsSchema = mongoose.Schema({
  title: String,
  authors: [String],
  imgMain: String,
  imgList: [String],
  description: String,
  dimensions: String,
  typeArt: String,
  productionYear: Date,
  sellingPrice: Number,
  artothequePlace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "places",
  },
  disponibility: Boolean,
  expectedReturnDate: Date,
});

const Artitems = mongoose.model("artitems", artitemsSchema);

module.exports = Artitems;
