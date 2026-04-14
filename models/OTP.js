const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // OTP expires in 5 minutes (300 seconds)
  }
});

// Index to quickly find the latest OTP for a phone number
OTPSchema.index({ phone: 1, createdAt: -1 });

module.exports = mongoose.model("OTP", OTPSchema);
