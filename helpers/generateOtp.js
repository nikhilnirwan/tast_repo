const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "config.env") });

const twilio = require("twilio");
// (process.env.TWILIO_ACC_SID, process.env.TWILIO_AUTH_TOKEN);
const Email = require(path.join(__dirname, "..", "utils", "Email"));
// this function only sends otp to mailtrap for email and password otp verification, but can be configured for mobile as well
const generateOtp = async function (mode, user, message, body) {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const date = Date.now() + 10 * 60 * 1000;
  user[`verificationToken`][`${mode}Token`] = otp;
  user[`verificationToken`][`${mode}TokenExpiry`] = date;
  await user.save();
  // SENDING OTP TO USER PART
  if (mode === "email") {
    try {
      await new Email(user, otp).send(message, body);
    } catch (error) {
      console.log("EMAIL ERROR", error);
    }
  }
  if (mode === "mobile") {
  }
};

module.exports = generateOtp;
