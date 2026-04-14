const Coupon = require("../models/Coupon");
const { validateCoupon } = require("../services/couponService");

// @desc    Validate coupon (public)
// @route   POST /api/v1/coupons/validate
exports.validateCouponCode = async (req, res) => {
  try {
    const { code, subtotal, categoryIds } = req.body;
    const result = await validateCoupon(code, req.user._id, subtotal, categoryIds || []);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get available coupons (public)
// @route   GET /api/v1/coupons
exports.getAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
      ]
    }).select("-usedCount -usageLimit -perUserLimit");

    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
