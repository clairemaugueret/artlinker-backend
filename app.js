require("dotenv").config();

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

require("./models/connection");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var artitemsRouter = require("./routes/artitems");
var placesRouter = require("./routes/places");
var subscriptionsRouter = require("./routes/subscriptions");
var paymentsRouter = require("./routes/payments");

var app = express();
const cors = require("cors");
app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/artitems", artitemsRouter);
app.use("/places", placesRouter);
app.use("/payments", paymentsRouter);
app.use("/subscriptions", subscriptionsRouter);

//const StripeSecretKey = process.env.SECRET_KEY_STRIPE;
//const stripe = require("stripe")(StripeSecretKey);

module.exports = app;
