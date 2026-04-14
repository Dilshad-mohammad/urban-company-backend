const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    altText: {
      type: String,
      default: ""
    },
    redirectUrl: {
      type: String,
      default: ""
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", BannerSchema);
