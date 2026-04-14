const express = require("express");
const router = express.Router();
const { uploadImage, getAllMedia, deleteMedia } = require("../controllers/mediaController");
const { protect, authorize } = require("../middleWare/auth");
const { uploadMedia } = require("../middleWare/mediaUpload");

router.use(protect, authorize("admin"));
router.post("/upload", uploadMedia, uploadImage);
router.get("/", getAllMedia);
router.delete("/:id", deleteMedia);

module.exports = router;
