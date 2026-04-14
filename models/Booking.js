const mongoose = require("mongoose");


// ---------------- BOOKING ITEM ----------------
const BookingItemSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true
    },

    serviceName: String,
    serviceImage: String,

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },

    price: {
      type: Number,
      required: true
    },

    duration: {
      type: Number,
      default: 60
    }

  },
  { _id: false }
);


// ---------------- SERVICE ADDRESS ----------------
const ServiceAddressSchema = new mongoose.Schema(
  {
    name: String,
    phoneNumber: String,
    flatNo: String,
    street: String,
    landmark: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    latitude: Number,
    longitude: Number
  },
  { _id: false }
);


// ---------------- BOOKING ----------------
const BookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    items: {
      type: [BookingItemSchema],
      required: true
    },

    serviceAddress: ServiceAddressSchema,

    scheduledDate: {
      type: Date,
      required: true
    },

    scheduledSlot: {
      type: String,
      required: true // e.g. "10:00 AM - 11:00 AM"
    },

    serviceProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      default: null
    },

    otp: {
      type: String,
      default: null
    },

    paymentMethod: {
      type: String,
      enum: [
        "credit_card",
        "debit_card",
        "upi",
        "google_pay",
        "apple_pay",
        "cash_on_delivery",
        "wallet"
      ],
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending"
    },

    transactionId: String,

    subtotal: {
      type: Number,
      required: true
    },

    tax: {
      type: Number,
      default: 0
    },

    discount: {
      type: Number,
      default: 0
    },

    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null
    },

    couponCode: {
      type: String,
      default: null
    },

    walletAmountUsed: {
      type: Number,
      default: 0,
      min: 0
    },

    cashbackCredited: {
      type: Boolean,
      default: false
    },

    total: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "assigned",
        "en_route",
        "started",
        "completed",
        "cancelled",
        "refunded"
      ],
      default: "pending",
      index: true
    },

    estimatedArrival: Date,

    actualStartTime: Date,

    actualEndTime: Date,

    cancelReason: String,

    cancelledAt: Date,

    notes: String

  },
  { timestamps: true }
);



// ---------------- BOOKING NUMBER GENERATOR ----------------
BookingSchema.pre("validate", function (next) {

  if (this.isNew && !this.bookingNumber) {
    const random = Math.floor(1000 + Math.random() * 9000);
    this.bookingNumber = `UC-${Date.now()}-${random}`;

  }

  next();

});



module.exports = mongoose.model("Booking", BookingSchema);
