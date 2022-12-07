const express = require("express");
const path = require("path");
const catchAsync = require(path.join(__dirname, "..", "utils", "catchAsync"));
const AppErr = require(path.join(__dirname, "..", "utils", "AppErr"));
const Post = require("../model/jobPost");

exports.addPost = catchAsync(async (req, res, next) => {
  const user = req.user;
  console.log(user);
  const { title, body, status, geoLocation, id } = req.body;

  const post = await Post.create({
    title,
    body,
    status,
    geoLocation,
    createdBy: id,
  });
  res.status(200).json({
    status: "success",
    data: {
      message: "add post Successfully",
      post,
    },
  });
});

exports.updatePost = catchAsync(async (req, res, next) => {
  const user = req.user;
  const { id, title, body, status, geoLocation } = req.body;

  const post = await Post.findByIdAndUpdate(
    { _id: id },
    { ...req.body },
    { runValidator: true, useFindAndModify: false, new: true }
  );
  res.status(200).json({
    status: "success",
    data: {
      message: "update post Successfully",
      post,
    },
  });
});

exports.getPost = catchAsync(async (req, res, next) => {
  const user = req.user;
  const { id } = req.query;
  const post = await Post.findOne({ _id: id });
  res.status(200).json({
    status: "success",
    data: {
      message: "get post Successfully",
      post,
    },
  });
});

exports.deletePost = catchAsync(async (req, res, next) => {
  const user = req.user;
  const { id } = req.query;
  const post = await Post.findOneAndDelete({ _id: id });
  res.status(200).json({
    status: "success",
    data: {
      message: "delete post Successfully",
      post,
    },
  });
});

// count active job post
exports.countActiveJobs = catchAsync(async (req, res, next) => {
  const user = req.user;
  const activePost = await Post.find({ status: "Active" }).count();
  const inactivePost = await Post.find({ status: "Inactive" }).count();
  res.status(200).json({
    status: "success",
    data: {
      message: "active and inactive post",
      activePost,
      inactivePost,
    },
  });
});
