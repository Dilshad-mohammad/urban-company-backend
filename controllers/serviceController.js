const Service = require("../models/Service");

// @desc    Get all active services
// @route   GET /api/v1/services
exports.getAllServices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.isFeatured) filter.isFeatured = req.query.isFeatured === "true";
    if (req.query.isBestSeller) filter.isBestSeller = req.query.isBestSeller === "true";
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { tags: { $in: [new RegExp(req.query.search, "i")] } }
      ];
    }

    let sortOption = { displayOrder: 1, createdAt: -1 };
    if (req.query.sortBy === "price_low") sortOption = { price: 1 };
    if (req.query.sortBy === "price_high") sortOption = { price: -1 };
    if (req.query.sortBy === "rating") sortOption = { averageRating: -1 };
    if (req.query.sortBy === "popular") sortOption = { totalBookings: -1 };

    const [services, total] = await Promise.all([
      Service.find(filter).populate("categoryId", "name slug icon").sort(sortOption).skip(skip).limit(limit),
      Service.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: services,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single service
// @route   GET /api/v1/services/:id
exports.getSingleService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate("categoryId", "name slug icon");
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get featured services
// @route   GET /api/v1/services/featured
exports.getFeaturedServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true, isFeatured: true })
      .populate("categoryId", "name slug icon")
      .sort({ displayOrder: 1 })
      .limit(20);
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get services by category
// @route   GET /api/v1/services/category/:categoryId
exports.getServicesByCategory = async (req, res) => {
  try {
    const services = await Service.find({
      categoryId: req.params.categoryId,
      isActive: true
    }).populate("categoryId", "name slug icon").sort({ displayOrder: 1 });
    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
