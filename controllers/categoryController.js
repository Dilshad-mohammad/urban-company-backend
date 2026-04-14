const Category = require("../models/Category");

// @desc    Get all categories
// @route   GET /api/v1/categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single category
// @route   GET /api/v1/categories/:id
exports.getSingleCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get subcategories for a category
// @route   GET /api/v1/categories/:id/subcategories
exports.getSubcategories = async (req, res) => {
  try {
    const subcategories = await Category.find({
      parentCategory: req.params.id,
      isActive: true
    }).sort({ displayOrder: 1 });
    res.status(200).json({ success: true, count: subcategories.length, data: subcategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all categories (admin only)
// @route   GET /api/v1/categories/admin/all
exports.getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ displayOrder: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create category (admin only)
// @route   POST /api/v1/categories
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image, icon, parentCategory, displayOrder, isFeatured } = req.body;
    const category = await Category.create({
      name, description, image, icon,
      parentCategory: parentCategory || null,
      displayOrder: displayOrder || 0,
      isFeatured: isFeatured || false
    });
    res.status(201).json({ success: true, message: "Category created successfully", data: category });
  } catch (error) {
    let statusCode = 500;
    let message = error.message;
    if (error.code === 11000) {
      statusCode = 409;
      const field = Object.keys(error.keyPattern)[0];
      message = `Category with this ${field} already exists`;
    }
    if (error.name === "ValidationError") {
      statusCode = 400;
      message = Object.values(error.errors).map(val => val.message).join(", ");
    }
    res.status(statusCode).json({ success: false, message });
  }
};

// @desc    Update category (admin only)
// @route   PUT /api/v1/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    if (name) {
      req.body.slug = name.toLowerCase().replace(/\s+/g, "-");
    }
    category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: "Category updated successfully", data: category });
  } catch (error) {
    let statusCode = 500;
    let message = error.message;
    if (error.code === 11000) { statusCode = 409; message = "Category with this name already exists"; }
    if (error.name === "CastError") { statusCode = 400; message = `Invalid format for field ${error.path}`; }
    res.status(statusCode).json({ success: false, message });
  }
};

// @desc    Delete category (admin only)
// @route   DELETE /api/v1/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
