const express = require("express");
const router = express.Router();
const { validateCouponCode, getAvailableCoupons } = require("../controllers/couponController");
const { protect } = require("../middleWare/auth");

router.use(protect);
router.get("/", getAvailableCoupons);
router.post("/validate", validateCouponCode);

module.exports = router;
