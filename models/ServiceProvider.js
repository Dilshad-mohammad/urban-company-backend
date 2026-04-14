const mongoose = require("mongoose");

const ServiceProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true
    },
    profilePicture: {
      type: String,
      default: null
    },
    skills: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    }],
    experience: {
      type: Number,
      default: 0,
      min: 0
    },
    bio: {
      type: String,
      default: ""
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0
    },
    totalJobsCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "banned"],
      default: "pending"
    },
    city: {
      type: String,
      default: ""
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    serviceRadius: {
      type: Number,
      default: 10 // km
    },
    commissionRate: {
      type: Number,
      default: 20,
      min: 0,
      max: 100
    },
    documents: {
      aadhaar: { type: String, default: null },
      pan: { type: String, default: null },
      bankDetails: {
        accountNumber: { type: String, default: null },
        ifscCode: { type: String, default: null },
        bankName: { type: String, default: null }
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceProvider", ServiceProviderSchema);
