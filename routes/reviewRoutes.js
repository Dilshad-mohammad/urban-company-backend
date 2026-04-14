const express = require("express");
const router = express.Router();
const { createReview, getServiceReviews, getAllReviewsAdmin, moderateReview, deleteReview } = require("../controllers/reviewController");
const { protect, authorize } = require("../middleWare/auth");
const { validateReview, handleValidationErrors } = require("../middleWare/validation");

// Public
router.get("/service/:serviceId", getServiceReviews);

// Protected
router.post("/", protect, validateReview, handleValidationErrors, createReview);

// Admin
router.get("/admin/all", protect, authorize("admin"), getAllReviewsAdmin);
router.patch("/:id/approve", protect, authorize("admin"), moderateReview);
router.delete("/:id", protect, authorize("admin"), deleteReview);

module.exports = router;
