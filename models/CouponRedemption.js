const mongoose = require("mongoose");

const CouponRedemptionSchema = new mongoose.Schema(
  {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

CouponRedemptionSchema.index({ couponId: 1, userId: 1 });

module.exports = mongoose.model("CouponRedemption", CouponRedemptionSchema);
