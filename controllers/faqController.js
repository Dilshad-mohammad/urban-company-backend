const Faq = require("../models/Faq");

// @desc    Get active FAQs
// @route   GET /api/v1/faqs
exports.getFaqs = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    const faqs = await Faq.find(filter).sort({ displayOrder: 1 });
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all FAQs (admin)
// @route   GET /api/v1/faqs/admin/all
exports.getAllFaqsAdmin = async (req, res) => {
  try {
    const faqs = await Faq.find({}).populate("categoryId", "name").sort({ displayOrder: 1 });
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create FAQ (admin)
// @route   POST /api/v1/faqs
exports.createFaq = async (req, res) => {
  try {
    const faq = await Faq.create(req.body);
    res.status(201).json({ success: true, message: "FAQ created successfully", data: faq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update FAQ (admin)
// @route   PUT /api/v1/faqs/:id
exports.updateFaq = async (req, res) => {
  try {
    const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }
    res.status(200).json({ success: true, message: "FAQ updated successfully", data: faq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete FAQ (admin)
// @route   DELETE /api/v1/faqs/:id
exports.deleteFaq = async (req, res) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (!faq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }
    res.status(200).json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
