const User = require("../models/User");
const Address = require("../models/Address");

// @desc    Get user profile
// @route   GET /api/v1/users/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("addresses");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user.getProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ["firstName", "lastName", "phoneNumber", "gender", "dateOfBirth", "profilePicture"];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.file) {
      updates.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user.getProfile()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add address
// @route   POST /api/v1/users/addresses
exports.addAddress = async (req, res) => {
  try {
    const address = await Address.create({ ...req.body, userId: req.user._id });

    // If it's the first address or marked as default, update user
    const addressCount = await Address.countDocuments({ userId: req.user._id });
    if (addressCount === 1 || req.body.isDefault) {
      await User.findByIdAndUpdate(req.user._id, { defaultAddressId: address._id });
      if (req.body.isDefault) {
        await Address.updateMany(
          { userId: req.user._id, _id: { $ne: address._id } },
          { isDefault: false }
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: address
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all addresses
// @route   GET /api/v1/users/addresses
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update address
// @route   PUT /api/v1/users/addresses/:id
exports.updateAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }
    if (req.body.isDefault) {
      await Address.updateMany(
        { userId: req.user._id, _id: { $ne: address._id } },
        { isDefault: false }
      );
      await User.findByIdAndUpdate(req.user._id, { defaultAddressId: address._id });
    }
    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete address
// @route   DELETE /api/v1/users/addresses/:id
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }
    if (address.isDefault) {
      const nextDefault = await Address.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      await User.findByIdAndUpdate(req.user._id, {
        defaultAddressId: nextDefault ? nextDefault._id : null
      });
    }
    res.status(200).json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/v1/users/admin/all
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: "i" } },
        { lastName: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
        { phoneNumber: { $regex: req.query.search, $options: "i" } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single user (admin only)
// @route   GET /api/v1/users/admin/:id
exports.getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("addresses");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user.getProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user status (admin only)
// @route   PATCH /api/v1/users/admin/:id/status
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: user.getProfile()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
