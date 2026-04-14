const express = require("express");
const router = express.Router();
const { getAllBookings, updateBookingStatus, assignServiceProvider, deleteBooking } = require("../controllers/adminBookingController");
const { protect, authorize } = require("../middleWare/auth");

router.use(protect, authorize("admin"));
router.get("/", getAllBookings);
router.put("/:id", updateBookingStatus);
router.patch("/:id/assign", assignServiceProvider);
router.delete("/:id", deleteBooking);

module.exports = router;
