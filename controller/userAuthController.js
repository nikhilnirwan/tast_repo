const path = require("path");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { promisify } = require("util");
const generateOtp = require(path.join(__dirname, "..", "helpers", "generateOtp"));
const catchAsync = require(path.join(__dirname, "..", "utils", "catchAsync"));
const AppErr = require(path.join(__dirname, "..", "utils", "AppErr"));
const encryptPassword = require(path.join(__dirname, "..", "helpers", "encryptPassword"));
const User = require(path.join(__dirname, "..", "model", "userModel"));

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, res) => {
  const payload = `${user}--${user.id}`;

  const token = signToken(payload);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res.cookie("jwt", token, cookieOptions);
  user.password = undefined; // hide password field from the response of document
  res.status(statusCode).json({
    status: "success",
    token: token,
    user: user,
  });
};

//
// SIGNUP
exports.signup = catchAsync(async (req, res, next) => {
  const { name, password, emailId, mobileNumber } = req.body;
  if (!name || !emailId || !mobileNumber || !password) {
    return next(new AppErr("Please Provide all the details to create user", 400));
  }
  // CHECK IF USER ALREADY EXISTS
  const userDoc = await User.findOne({
    $and: [{ "email.emailId": emailId }, { "mobile.mobileNumber": mobileNumber }],
  }).select("+password");
  if (userDoc && !userDoc?.email?.isEmailVerified) {
    await generateOtp("password", userDoc, "please verify your email", "complete your Sign Up procedures");
    userDoc.password = undefined;
    return res.status(200).json({
      status: "success",
      message: "User Exists With The Provided Email Id, An OTP Has Been Sent To The Registered Email",
      user: userDoc,
      data: {
        duplicateUser: true,
      },
    });
  }
  if (userDoc && userDoc?.email?.isEmailVerified)
    return next(new AppErr("User Already Exists with verified email, Please Login to continue", 400));
  // CANDIDATE
  if (await User.findOne({ "email.emailId": emailId })) {
    return next(new AppErr("User Already Exists, Please Login to continue", 400));
  }
  const hashedPassword = await encryptPassword.hashPassword(password);
  const doc = await User.create({
    name,
    password: hashedPassword,
    email: { emailId },
    mobile: { mobileNumber },
  });

  await generateOtp("password", doc, "[SL WORLD JOBS] Please Verify Your Email", "complete your Sign Up procedures");
  doc.password = undefined;
  res.status(200).json({
    status: "success",
    user: doc,
  });
});

// LOGIN with id and password
exports.loginWithPassword = catchAsync(async (req, res, next) => {
  // TODO:NO LOGIN TILL EMAIL VERIFIED
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppErr("Please Provide all the details to create user", 400));
  }
  let doc = await User.findOne({ "email.emailId": email }).select("+password");
  if (!doc) return next(new AppErr("Mobile is Incorrect", 400));
  if (!(await encryptPassword.unHashPassword(password, doc.password))) {
    return next(new AppErr("Password is Incorrect", 400));
  }
  // if (!doc?.email?.isEmailVerified) return next(new AppErr("Please Verify Your Email Address To Login", 401));//
  createSendToken(doc, 200, res);
});

//PROTECT route to chake user is login or not
exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting the tocken and check is it exist
  let token;
  if (
    // autharization = "Bearer TOKEN_STRING"
    req?.headers?.authorization &&
    req?.headers?.authorization?.startsWith("Bearer")
  ) {
    token = req?.headers?.authorization?.split(" ")[1];
  } else if (req?.cookies?.jwt) {
    token = req?.cookies?.jwt;
    const cookieToken = req?.cookies?.jwt;
  }
  if (!token) {
    return next(new AppErr("You are not logged  in!!! Please log in to get access.", 401));
  }

  //2) Validate token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) Get if user still exists

  const id = decoded?.id?.split("--")[1];
  if (!id) return next(new AppErr("JWT Malformed"), 401);
  const currentUser = await User.findById(id);

  if (!currentUser) {
    return next(new AppErr(" The user blonging to this token no longer exists", 401));
  }

  //4) Check if user change password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(new AppErr("App user recently changed password! Please log in again", 401));
  }
  // Grant access to protected route
  req.user = currentUser;
  req.identity = id;
  next();
});

// FORGOT PASSWORD STAGES
// 1) verify email
exports.forgotPwdGenerateOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({
      status: "fail",
      data: {
        message: "Please Provide All The Details",
      },
    });
  }
  const user = await User.findOne({ "email.emailId": email });
  if (!user) return next(new AppErr("Account Not Found"), 400);
  await generateOtp("password", user, "OTP for password change", "Reset Your Password");
  res.status(200).json({
    status: "success",
    data: {
      verificationToken: user.verificationToken,
      message: "An OTP has been sent,Please Verify OTP To Reset The Password",
    },
  });
});
// 2) verify otp email
exports.forgotPwdVerifyOtp = catchAsync(async (req, res, next) => {
  const { otp, email } = req.body;
  if (!email) {
    res.status(400).json({
      status: "fail",
      data: {
        message: "Please Provide All The Details",
      },
    });
  }

  const doc = await User.findOne({ "email.emailId": email });
  if (!doc) return next(new AppErr("Account Not Found"), 400);
  // check if token is present
  if (!doc?.verificationToken?.passwordToken && !doc?.verificationToken?.passwordTokenExpiry)
    return next(new AppErr("Token Not Issued, Route Is FORBIDDEN", 403));
  // check if time expired
  const currDate = new Date(Date.now());
  if (doc?.verificationToken?.passwordTokenExpiry < currDate) return next(new AppErr("OTP Expired", 400));
  // verify otp
  if (!(doc?.verificationToken?.passwordToken === otp)) return next(new AppErr("OTP Entered Is Incorrect", 400));
  // update token fields in document
  doc.verificationToken.passwordToken = undefined;
  doc.verificationToken.passwordTokenExpiry = undefined;
  doc.email.isEmailVerified = true;
  await doc.save();
  res.status(200).json({
    status: "success",
    data: {
      message: "User Email Verified",
      doc,
    },
  });
  createSendToken(doc, 200, res);
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // const user = req.user;
  const { email, password } = req.body;
  const user = await User.findOne({ "email.emailId": email });

  const hashedPassword = await encryptPassword.hashPassword(password);
  user.password = hashedPassword;
  user.passwordChangedAt = Date.now() - 1 * 60 * 100;
  await user.save();
  createSendToken(user, 200, res);
});

// logout
exports.logout = catchAsync(async (req, res, next) => {
  res.cookie("jwt", "loggedOut", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      message: "User Successfully Logged Out",
    },
  });
});

// get user
exports.getUserProfile = catchAsync(async (req, res, next) => {
  const user = req.user;
  const data = await User.findOne({ _id: user._id });
  res.status(200).json({
    status: "success",
    data,
  });
});
