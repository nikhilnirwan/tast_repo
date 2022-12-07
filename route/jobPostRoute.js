const express = require("express");
const path = require("path");
const router = express.Router();
const postController = require("../controller/postController");
const userAuthController = require("../controller/userAuthController");

// router.use(userAuthController.protect); //below this protected routes

router.post("/addPost", postController.addPost);

router.put("/updatePost", postController.updatePost);
router.get("/getPost", postController.getPost);
router.delete("/deletePost", postController.deletePost);
router.get("/countActiveJobs", postController.countActiveJobs);

module.exports = router;
