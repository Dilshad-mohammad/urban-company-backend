const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, addAddress, getAddresses, updateAddress, deleteAddress, getAllUsers, getSingleUser, updateUserStatus } = require("../controllers/userController");
const { protect, authorize } = require("../middleWare/auth");
const { validateUpdateProfile, validateAddress, handleValidationErrors } = require("../middleWare/validation");
const { uploadProfilePicture } = require("../middleWare/upload");

// All routes require authentication
router.use(protect);

// User routes
router.get("/profile", getProfile);
router.put("/profile", uploadProfilePicture, validateUpdateProfile, handleValidationErrors, updateProfile);
router.post("/addresses", validateAddress, handleValidationErrors, addAddress);
router.get("/addresses", getAddresses);
router.put("/addresses/:id", updateAddress);
router.delete("/addresses/:id", deleteAddress);

// Admin routes
router.get("/admin/all", authorize("admin"), getAllUsers);
router.get("/admin/:id", authorize("admin"), getSingleUser);
router.patch("/admin/:id/status", authorize("admin"), updateUserStatus);

module.exports = router;
