const express = require("express");
const router = express.Router();
const { getActiveBanners, getAllBannersAdmin, createBanner, updateBanner, deleteBanner } = require("../controllers/bannerController");
const { protect, authorize } = require("../middleWare/auth");

router.get("/", getActiveBanners);
router.get("/admin/all", protect, authorize("admin"), getAllBannersAdmin);
router.post("/", protect, authorize("admin"), createBanner);
router.put("/:id", protect, authorize("admin"), updateBanner);
router.delete("/:id", protect, authorize("admin"), deleteBanner);

module.exports = router;
