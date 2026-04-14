const Booking = require("../models/Booking");

// @desc    Get all bookings (admin)
// @route   GET /api/v1/admin/bookings
exports.getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { bookingNumber: { $regex: req.query.search, $options: "i" } }
      ];
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("userId", "firstName lastName email phoneNumber")
        .populate("serviceProviderId", "name phoneNumber")
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      Booking.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update booking status (admin)
// @route   PUT /api/v1/admin/bookings/:id
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, serviceProviderId } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (serviceProviderId) updates.serviceProviderId = serviceProviderId;
    if (status === "started") updates.actualStartTime = new Date();
    if (status === "completed") {
      updates.actualEndTime = new Date();
      updates.paymentStatus = "completed";
    }
    if (status === "cancelled") {
      updates.cancelledAt = new Date();
      updates.cancelReason = req.body.cancelReason || "Cancelled by admin";
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("userId", "firstName lastName email")
      .populate("serviceProviderId", "name phoneNumber");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign service provider (admin)
// @route   PATCH /api/v1/admin/bookings/:id/assign
exports.assignServiceProvider = async (req, res) => {
  try {
    const { serviceProviderId } = req.body;
    if (!serviceProviderId) {
      return res.status(400).json({ success: false, message: "Service provider ID is required" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { serviceProviderId, status: "assigned" },
      { new: true }
    ).populate("serviceProviderId", "name phoneNumber profilePicture");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      message: "Service provider assigned successfully",
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete booking (admin)
// @route   DELETE /api/v1/admin/bookings/:id
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.status(200).json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
