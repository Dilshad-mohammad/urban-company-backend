const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const { generateUniqueReferralCode } = require("../services/referralService");

// Generate JWT access token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d"
  });
};

// Generate JWT refresh token (longer-lived)
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId, type: "refresh" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d"
  });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
exports.register = async (req, res) => {
  try {
    const { fireBaseId, firstName, lastName, email, password, dateOfBirth, gender, phoneNumber, profilePicture } = req.body;
    const savedProfilePicture = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : (profilePicture || null);

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Check if this is the first user (make them admin)
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "admin" : "user";

    // Create new user
    const referralCode = await generateUniqueReferralCode();

    user = await User.create({
      fireBaseId,
      firstName,
      lastName,
      email,
      gender,
      dateOfBirth,
      password,
      phoneNumber,
      profilePicture: savedProfilePicture,
      role,
      referralCode
    });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      refreshToken,
      user: user.getProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email/phone number and password"
      });
    }

    const isEmail = emailOrPhone.includes("@");

    const user = await User.findOne(
      isEmail
        ? { email: emailOrPhone }
        : { phoneNumber: emailOrPhone }
    ).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      user: user.getProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Social login/register (Google/Facebook)
// @route   POST /api/v1/auth/social-login
exports.socialLogin = async (req, res) => {
  try {
    const { provider, fireBaseId, email, firstName, lastName, profilePicture, phoneNumber } = req.body;

    if (!["google", "facebook"].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider"
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required"
      });
    }

    let user = await User.findOne({
      $or: [
        fireBaseId ? { fireBaseId } : null,
        { email }
      ].filter(Boolean)
    });

    let isNewUser = false;

    if (user) {
      if (fireBaseId && !user.fireBaseId) {
        user.fireBaseId = fireBaseId;
      }
      if (!user.provider || user.provider === "local") {
        user.provider = provider;
      }
      user.lastLogin = new Date();
      await user.save();
    } else {
      const referralCode = await generateUniqueReferralCode();

      user = await User.create({
        fireBaseId,
        provider,
        firstName: firstName || "User",
        lastName: lastName || "",
        email,
        phoneNumber,
        profilePicture,
        isEmailVerified: true,
        role: "user",
        lastLogin: new Date(),
        referralCode
      });

      isNewUser = true;
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, { refreshToken });

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? "Account created & login successful"
        : "Login successful",
      token,
      refreshToken,
      provider,
      isNewUser,
      user: user.getProfile()
    });

  } catch (error) {
    if (error.code === 11000) {
      try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
          existingUser.lastLogin = new Date();
          await existingUser.save();
          const token = generateToken(existingUser._id);
          const refreshToken = generateRefreshToken(existingUser._id);
          await User.findByIdAndUpdate(existingUser._id, { refreshToken });
          return res.status(200).json({
            success: true,
            message: "Logged in (resolved duplicate)",
            token,
            refreshToken,
            isNewUser: false,
            user: existingUser.getProfile()
          });
        }
      } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user: user.getProfile()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) {
      return res.status(400).json({
        success: false,
        message: "Please provide email or phone number"
      });
    }
    const isEmail = emailOrPhone.includes("@");
    const user = await User.findOne(
      isEmail ? { email: emailOrPhone } : { phoneNumber: emailOrPhone }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "Password reset link sent" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { emailOrPhone, newPassword } = req.body;
    if (!emailOrPhone || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide email/phone number and new password"
      });
    }
    const isEmail = emailOrPhone.includes("@");
    const user = await User.findOne(
      isEmail ? { email: emailOrPhone } : { phoneNumber: emailOrPhone }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create admin user (admin only)
// @route   POST /api/v1/auth/create-admin
exports.createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;
    if (!firstName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "firstName, email, and password are required"
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }
    const admin = await User.create({
      firstName, lastName, email, password, phoneNumber, role: "admin"
    });
    const token = generateToken(admin._id);
    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      token,
      user: admin.getProfile()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
exports.refreshUserToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token is required" });
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }
    if (decoded.type !== "refresh") {
      return res.status(401).json({ success: false, message: "Invalid token type" });
    }
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send OTP to phone
// @route   POST /api/v1/auth/send-otp
exports.sendOtp = async (req, res) => {
  try {
    const { phone, fcmToken } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to DB
    await OTP.create({ phone, otp });

    // Send via Firebase if token provided
    if (fcmToken) {
      const message = {
        token: fcmToken,
        notification: {
          title: "Verification Code",
          body: `Your OTP for Urban Company is: ${otp}`
        },
        data: {
          title: "Verification Code",
          body: `Your OTP for Urban Company is: ${otp}`,
          otp: otp,
          type: "OTP_VERIFICATION"
        }
      };

      try {
        await admin.messaging().send(message);
        console.log(`✓ OTP Notification sent to ${phone}`);
      } catch (err) {
        console.log(`✗ FCM Error for ${phone}:`, err.message);
      }
    }

    // In development, log the OTP to console
    console.log(`
╔════════════════════════════════════════╗
║  Verification Code for ${phone.padEnd(15)} ║
╠════════════════════════════════════════╣
║  OTP: ${otp.padEnd(32)} │
╚════════════════════════════════════════╝
    `);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP and Login/Register
// @route   POST /api/v1/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: "Phone and OTP are required" });
    }

    // Find the latest OTP for this phone
    const otpRecord = await OTP.findOne({ phone }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP expired or not found" });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Delete used OTP
    await OTP.deleteMany({ phone });

    // Check if user exists
    let user = await User.findOne({ phoneNumber: phone });
    let isNewUser = false;

    if (!user) {
      // Create new user (Auto-registration)
      const referralCode = await generateUniqueReferralCode();
      const randomPassword = Math.random().toString(36).slice(-10); // Random 10-char password
      user = await User.create({
        firstName: "User",
        lastName: phone.slice(-4),
        email: `${phone.replace("+", "")}@urbancompany.local`, // Mock email
        phoneNumber: phone,
        password: randomPassword,
        role: "user",
        referralCode
      });
      isNewUser = true;
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: isNewUser ? "Account created successfully" : "Login successful",
      token,
      refreshToken,
      user: user.getProfile()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
