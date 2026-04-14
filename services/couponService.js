const Coupon = require("../models/Coupon");
const CouponRedemption = require("../models/CouponRedemption");

/**
 * Validate a coupon for a given user and booking subtotal
 */
async function validateCoupon(code, userId, subtotal, categoryIds = []) {
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true
  });

  if (!coupon) {
    return { valid: false, message: "Invalid coupon code" };
  }

  const now = new Date();

  // Check dates
  if (now < coupon.startDate || now > coupon.endDate) {
    return { valid: false, message: "Coupon has expired or is not yet active" };
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: "Coupon usage limit reached" };
  }

  // Check per-user limit
  const userRedemptions = await CouponRedemption.countDocuments({
    couponId: coupon._id,
    userId
  });
  if (userRedemptions >= coupon.perUserLimit) {
    return { valid: false, message: "You have already used this coupon" };
  }

  // Check minimum order amount
  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum booking amount of ₹${coupon.minOrderAmount} required`
    };
  }

  // Check applicable categories
  if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
    const hasMatch = categoryIds.some(catId =>
      coupon.applicableCategories.some(ac => ac.toString() === catId.toString())
    );
    if (!hasMatch) {
      return { valid: false, message: "Coupon is not applicable for selected services" };
    }
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
  } else {
    discount = coupon.discountValue;
  }

  discount = Math.round(Math.min(discount, subtotal) * 100) / 100;

  return {
    valid: true,
    coupon,
    discount,
    message: `Coupon applied! You save ₹${discount}`
  };
}

/**
 * Record a coupon redemption
 */
async function redeemCoupon(couponId, userId, bookingId, discountAmount) {
  await CouponRedemption.create({
    couponId,
    userId,
    bookingId,
    discountAmount
  });

  await Coupon.findByIdAndUpdate(couponId, {
    $inc: { usedCount: 1 }
  });
}

module.exports = {
  validateCoupon,
  redeemCoupon
};
