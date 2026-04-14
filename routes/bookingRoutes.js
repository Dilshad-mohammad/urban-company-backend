const express = require("express");
const router = express.Router();
const { createBooking, getUserBookings, getSingleBooking, cancelBooking, rebookService } = require("../controllers/bookingController");
const { protect } = require("../middleWare/auth");
const { validateBooking, handleValidationErrors } = require("../middleWare/validation");

// All routes require authentication
router.use(protect);

router.post("/", validateBooking, handleValidationErrors, createBooking);
router.get("/my-bookings", getUserBookings);
router.get("/:id", getSingleBooking);
router.post("/:id/cancel", cancelBooking);
router.post("/:id/rebook", rebookService);

module.exports = router;
