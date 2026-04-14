const Review = require("../models/Review");
const Service = require("../models/Service");
const Booking = require("../models/Booking");

// @desc    Create review
// @route   POST /api/v1/reviews
exports.createReview = async (req, res) => {
  try {
    const { serviceId, bookingId, serviceProviderId, rating, title, comment, images } = req.body;
    const userId = req.user._id;

    // Validate booking exists and is completed
    if (bookingId) {
      const booking = await Booking.findOne({ _id: bookingId, userId, status: "completed" });
      if (!booking) {
        return res.status(400).json({ success: false, message: "Can only review completed bookings" });
      }
    }

    const review = await Review.create({
      serviceId, userId, bookingId, serviceProviderId,
      rating, title, comment,
      images: images || [],
      isVerifiedBooking: !!bookingId
    });

    // Update service average rating
    const reviews = await Review.find({ serviceId, isApproved: true });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Service.findByIdAndUpdate(serviceId, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });

    res.status(201).json({ success: true, message: "Review submitted successfully", data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already reviewed this service for this booking" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a service
// @route   GET /api/v1/reviews/service/:serviceId
exports.getServiceReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { serviceId: req.params.serviceId, isApproved: true };

    const [reviews, total] = await Promise.all([
      Review.find(filter).populate("userId", "firstName lastName profilePicture").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Review.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews (admin)
// @route   GET /api/v1/reviews/admin/all
exports.getAllReviewsAdmin = async (req, res) => {
  try {
    const filter = {};
    if (req.query.isApproved !== undefined) filter.isApproved = req.query.isApproved === "true";

    const reviews = await Review.find(filter)
      .populate("userId", "firstName lastName email")
      .populate("serviceId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/reject review (admin)
// @route   PATCH /api/v1/reviews/:id/approve
exports.moderateReview = async (req, res) => {
  try {
    const { isApproved } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { isApproved }, { new: true });
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Recalculate service average
    const reviews = await Review.find({ serviceId: review.serviceId, isApproved: true });
    const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    await Service.findByIdAndUpdate(review.serviceId, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });

    res.status(200).json({
      success: true,
      message: `Review ${isApproved ? "approved" : "rejected"}`,
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete review (admin)
// @route   DELETE /api/v1/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
