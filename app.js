// THIRD PARTY MODULES
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const util = require("util");
const logger = require("morgan");
// CORE MODULES
const express = require("express");

// SELF MODULES
const UserAuthRouter = require("./route/userAuthRoute");
const jobPostRoute = require("./route/jobPostRoute");

const requestBodyLogger = require(path.join(__dirname, "helpers", "winstonLogger"));

const globalErrorHandler = require(path.join(__dirname, "utils", "globalErrorHandler"));
const app = express();

app.disable("etag");
app.use(logger("dev"));
// app.use(cors({ credentials: true, origin: whiteList }));
app.options("*", cors());
app.use(cookieParser());
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("*", (req, res, next) => {
  requestBodyLogger.info(
    `REQUEST BODY = ${util.inspect(req.body, { depth: null })}
     COOKIES = ${util.inspect(req.cookies, {
       depth: null,
     })}
     AUTHORIZATION HEADER = ${util.inspect(req.headers, {
       depth: null,
     })}
    `
  );
  next();
});

// GET DOCUMENT ROUTE
app.use("/auth", UserAuthRouter);
app.use("/post", jobPostRoute);

// LANDING PAGE

app.use(globalErrorHandler);
app.use("*", (req, res, next) => {
  res.status(404).json({
    message: "API REQUEST NOT FOUND!!",
  });
});
module.exports = app;
