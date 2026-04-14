const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking"
    },
    serviceProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider"
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    comment: {
      type: String,
      trim: true
    },
    images: [String],
    isVerifiedBooking: {
      type: Boolean,
      default: false
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0
    },
    unhelpfulCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isApproved: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate reviews from same user for same service per booking
ReviewSchema.index({ serviceId: 1, userId: 1, bookingId: 1 }, { unique: true });

module.exports = mongoose.model("Review", ReviewSchema);
