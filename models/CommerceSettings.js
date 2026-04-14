const mongoose = require("mongoose");

const CommerceSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true
    },
    taxPercentage: {
      type: Number,
      default: 18
    },
    minBookingAmount: {
      type: Number,
      default: 99
    },
    walletMaxUsagePercentOfSubtotal: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    firstOrderCashbackPercent: {
      type: Number,
      default: 10
    },
    firstOrderCashbackMaxAmount: {
      type: Number,
      default: 200
    },
    cashbackExpiryDays: {
      type: Number,
      default: 90
    },
    defaultServiceProviderCommission: {
      type: Number,
      default: 20,
      min: 0,
      max: 100
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommerceSettings", CommerceSettingsSchema);
