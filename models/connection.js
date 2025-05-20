const mongoose = require("mongoose");

const connectionString = process.env.CONNECTION_STRING;

//CLAIRE
mongoose
  .connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log("Database connected"))
  .catch((error) => console.error(error));

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});
