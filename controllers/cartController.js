const Cart = require("../models/Cart");
const Service = require("../models/Service");

// @desc    Get user cart
// @route   GET /api/v1/cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id })
      .populate("items.serviceId", "title price discountPrice duration thumbnail images isActive");

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Filter out inactive services
    cart.items = cart.items.filter(item => item.serviceId && item.serviceId.isActive);

    // Calculate totals
    let subtotal = 0;
    let totalDuration = 0;
    cart.items.forEach(item => {
      const price = item.serviceId.discountPrice || item.serviceId.price;
      subtotal += price * item.quantity;
      totalDuration += (item.serviceId.duration || 60) * item.quantity;
    });

    res.status(200).json({
      success: true,
      data: {
        items: cart.items,
        itemCount: cart.items.length,
        subtotal: Math.round(subtotal * 100) / 100,
        totalDuration
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/v1/cart
exports.addToCart = async (req, res) => {
  try {
    const { serviceId, quantity = 1 } = req.body;

    // Validate service
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: "Service not found or inactive" });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Check if service already in cart
    const existingItem = cart.items.find(item => item.serviceId.toString() === serviceId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ serviceId, quantity });
    }

    await cart.save();

    // Populate and return
    cart = await Cart.findById(cart._id)
      .populate("items.serviceId", "title price discountPrice duration thumbnail images");

    res.status(200).json({
      success: true,
      message: "Added to cart",
      data: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/:serviceId
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find(item => item.serviceId.toString() === req.params.serviceId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(item => item.serviceId.toString() !== req.params.serviceId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();

    res.status(200).json({ success: true, message: "Cart updated", data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/:serviceId
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(item => item.serviceId.toString() !== req.params.serviceId);
    await cart.save();

    res.status(200).json({ success: true, message: "Item removed from cart", data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/v1/cart
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });
    res.status(200).json({ success: true, message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
