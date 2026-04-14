const MediaImage = require("../models/MediaImage");
const cloudinary = require("../utils/cloudinaryConfig");

// @desc    Upload single image
// @route   POST /api/v1/media/upload
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const media = await MediaImage.create({
      url: req.file.path,
      publicId: req.file.filename,
      folder: req.query.folder || "general",
      altText: req.body.altText || "",
      uploadedBy: req.user._id
    });
    res.status(201).json({ success: true, message: "Image uploaded successfully", data: media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all media images (admin)
// @route   GET /api/v1/media
exports.getAllMedia = async (req, res) => {
  try {
    const filter = {};
    if (req.query.folder) filter.folder = req.query.folder;
    const media = await MediaImage.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete media image (admin)
// @route   DELETE /api/v1/media/:id
exports.deleteMedia = async (req, res) => {
  try {
    const media = await MediaImage.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ success: false, message: "Media not found" });
    }
    // Delete from cloudinary
    if (media.publicId) {
      await cloudinary.uploader.destroy(media.publicId);
    }
    await MediaImage.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Media deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
