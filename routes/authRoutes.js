const express = require("express");
const router = express.Router();
const { register, login, socialLogin, getCurrentUser, logout, forgotPassword, resetPassword, createAdmin, refreshUserToken, sendOtp, verifyOtp } = require("../controllers/authController");
const { protect, authorize } = require("../middleWare/auth");
const { validateRegister, validateLogin, handleValidationErrors } = require("../middleWare/validation");
const { uploadProfilePicture } = require("../middleWare/upload");

// Public routes
router.post("/register", uploadProfilePicture, validateRegister, handleValidationErrors, register);
router.post("/login", validateLogin, handleValidationErrors, login);
router.post("/social-login", socialLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshUserToken);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Protected routes
router.get("/me", protect, getCurrentUser);
router.post("/logout", protect, logout);

// Admin-only routes
router.post("/create-admin", protect, authorize("admin"), createAdmin);

module.exports = router;
