const mongoose = require("mongoose");

const WalletLotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    originalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0
    },
    expiresAt: {
      type: Date,
      required: true
    },
    sourceBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null
    },
    reason: {
      type: String,
      enum: ["first_order_cashback", "referral", "refund", "promotional", "other"],
      default: "other"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WalletLot", WalletLotSchema);
