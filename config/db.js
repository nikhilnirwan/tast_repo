const mongoose = require("mongoose");

const DB_URL = "mongodb://localhost:27017/register";
const dbConnect = () => {
  mongoose
    .connect(DB_URL)
    .then((data) => {
      console.log(`MongoDB connection succesfull :${data.connection.host}`);
    })
    .catch((err) => {
      console.log(`error connecting to the database ${err}`);
    });
};

module.exports = dbConnect;
