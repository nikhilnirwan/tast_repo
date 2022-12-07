const express = require("express");
const path = require("path");
const userAuthController = require("../controller/userAuthController");
const router = express.Router();
router.post("/signup", userAuthController.signup);
router.post("/loginWithPassword", userAuthController.loginWithPassword);
router.get("/logout", userAuthController.logout);
router.post("/forgotPwdGenerateOtp", userAuthController.forgotPwdGenerateOtp);
router.post("/forgotPwdVerifyOtp", userAuthController.forgotPwdVerifyOtp);
router.patch("/resetPassword", userAuthController.resetPassword);
router.use(userAuthController.protect); //below this protected routes
router.get("/getUserProfile", userAuthController.getUserProfile);

module.exports = router;
