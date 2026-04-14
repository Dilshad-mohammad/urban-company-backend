const express = require("express");
const router = express.Router();
const { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } = require("../controllers/adminCouponController");
const { protect, authorize } = require("../middleWare/auth");

router.use(protect, authorize("admin"));
router.get("/", getAllCoupons);
router.post("/", createCoupon);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

module.exports = router;
