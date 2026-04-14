const Service = require("../models/Service");

// @desc    Get all services (admin - including inactive)
// @route   GET /api/v1/admin/services
exports.getAllServicesAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: "i" };
    }

    const [services, total] = await Promise.all([
      Service.find(filter).populate("categoryId", "name slug").sort({ createdAt: -1 }).skip(skip).limit(limit),
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

// @desc    Create service (admin only)
// @route   POST /api/v1/admin/services
exports.createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service
    });
  } catch (error) {
    let statusCode = 500;
    let message = error.message;
    if (error.code === 11000) {
      statusCode = 409;
      const field = Object.keys(error.keyPattern)[0];
      message = `Service with this ${field} already exists`;
    }
    if (error.name === "ValidationError") {
      statusCode = 400;
      message = Object.values(error.errors).map(val => val.message).join(", ");
    }
    res.status(statusCode).json({ success: false, message });
  }
};

// @desc    Update service (admin only)
// @route   PUT /api/v1/admin/services/:id
exports.updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    if (req.body.title) {
      req.body.slug = req.body.title.toLowerCase().replace(/\s+/g, "-");
    }
    service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: service
    });
  } catch (error) {
    let statusCode = 500;
    let message = error.message;
    if (error.code === 11000) { statusCode = 409; message = "Service with this title already exists"; }
    res.status(statusCode).json({ success: false, message });
  }
};

// @desc    Delete service (admin only)
// @route   DELETE /api/v1/admin/services/:id
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    res.status(200).json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle service active status (admin only)
// @route   PATCH /api/v1/admin/services/:id/toggle
exports.toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    service.isActive = !service.isActive;
    await service.save();
    res.status(200).json({
      success: true,
      message: `Service ${service.isActive ? "activated" : "deactivated"} successfully`,
      data: service
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
