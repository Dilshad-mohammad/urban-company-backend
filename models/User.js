const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    fireBaseId: { type: String, trim: true },
    provider: { type: String, enum: ["local", "google", "facebook"], default: "local" },
    providerId: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: false, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: {
      type: String, required: function () { return this.provider === "local"; }, minlength: 8, select: false
    },
    phoneNumber: { type: String, trim: true, required: function () { return this.provider === "local"; } },
    profilePicture: { type: String, required: false, default: null },
    dateOfBirth: { type: String, default: null },
    defaultAddressId: { type: mongoose.Schema.Types.ObjectId, ref: "Address", default: null },
    gender: { type: String, enum: ["male", "female", "other", null], default: null },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpire: Date,
    isActive: { type: Boolean, default: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    lastLogin: Date,
    deviceTokens: [String],
    twoFactorEnabled: { type: Boolean, default: false },
    subscribedEmailMarketing: { type: Boolean, default: false },
    refreshToken: { type: String, select: false },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true
    },
    hasReceivedFirstOrderCashback: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

UserSchema.index(
  { provider: 1, providerId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      provider: { $ne: "local" },
      providerId: { $exists: true, $ne: null }
    }
  }
);

UserSchema.virtual("addresses", {
  ref: "Address",
  localField: "_id",
  foreignField: "userId"
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.password) return next();
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Method to get user profile
UserSchema.methods.getProfile = function () {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetToken;
  delete user.passwordResetExpire;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpire;
  return user;
};

module.exports = mongoose.model("User", UserSchema);
