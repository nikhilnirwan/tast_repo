const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const User = require("./userModel");
const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    geoLocation: {
      latitude: {
        type: String,
        required: false,
        trim: true,
      },
      longitude: {
        type: String,
        required: false,
        trim: true,
      },
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  { toJSON: { virtuals: true } }
);

const Post = mongoose.model("Post", PostSchema);
module.exports = Post;
