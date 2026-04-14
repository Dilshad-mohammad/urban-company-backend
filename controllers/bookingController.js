const Booking = require("../models/Booking");
const Cart = require("../models/Cart");
const Service = require("../models/Service");
const Address = require("../models/Address");
const { validateCoupon, redeemCoupon } = require("../services/couponService");
const { getSettings } = require("../services/commerceSettingsService");
const { sumAvailableBalance, computeMaxWalletUse, debitWallet } = require("../services/walletService");

// @desc    Create a booking from cart
// @route   POST /api/v1/bookings
exports.createBooking = async (req, res) => {
  try {
    const userId = req.user._id;
    const { addressId, scheduledDate, scheduledSlot, paymentMethod, couponCode, useWallet } = req.body;

    // Get cart
    const cart = await Cart.findOne({ userId }).populate("items.serviceId");
    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Get address
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // Calculate subtotal
    let subtotal = 0;
    const bookingItems = cart.items.map(item => {
      const service = item.serviceId;
      const price = service.discountPrice || service.price;
      subtotal += price * item.quantity;
      return {
        serviceId: service._id,
        serviceName: service.title,
        serviceImage: service.thumbnail,
        quantity: item.quantity,
        price,
        duration: service.duration
      };
    });

    const settings = await getSettings();
    const tax = Math.round(subtotal * (settings.taxPercentage / 100) * 100) / 100;

    // Apply coupon if provided
    let discount = 0;
    let couponId = null;
    if (couponCode) {
      const categoryIds = cart.items.map(item => item.serviceId.categoryId);
      const couponResult = await validateCoupon(couponCode, userId, subtotal, categoryIds);
      if (!couponResult.valid) {
        return res.status(400).json({ success: false, message: couponResult.message });
      }
      discount = couponResult.discount;
      couponId = couponResult.coupon._id;
    }

    // Wallet usage
    let walletAmountUsed = 0;
    if (useWallet) {
      const balance = await sumAvailableBalance(userId);
      walletAmountUsed = computeMaxWalletUse(subtotal, balance, settings);
    }

    const total = Math.max(0, Math.round((subtotal + tax - discount - walletAmountUsed) * 100) / 100);

    // Generate OTP for service verification
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Create booking
    const booking = await Booking.create({
      userId,
      items: bookingItems,
      serviceAddress: {
        name: address.name,
        phoneNumber: address.phoneNumber,
        flatNo: address.flatNo,
        street: address.street,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
        latitude: address.latitude,
        longitude: address.longitude
      },
      scheduledDate,
      scheduledSlot,
      paymentMethod,
      subtotal,
      tax,
      discount,
      couponId,
      couponCode: couponCode || null,
      walletAmountUsed,
      total,
      otp,
      status: "pending"
    });

    // Debit wallet if used
    if (walletAmountUsed > 0) {
      await debitWallet(userId, booking._id, walletAmountUsed);
    }

    // Record coupon redemption
    if (couponId) {
      await redeemCoupon(couponId, userId, booking._id, discount);
    }

    // Update service booking counts
    for (const item of bookingItems) {
      await Service.findByIdAndUpdate(item.serviceId, { $inc: { totalBookings: 1 } });
    }

    // Clear cart
    await Cart.findOneAndUpdate({ userId }, { items: [] });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user bookings
// @route   GET /api/v1/bookings/my-bookings
exports.getUserBookings = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate("serviceProviderId", "name profilePicture averageRating phoneNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
exports.getSingleBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id })
      .populate("serviceProviderId", "name profilePicture averageRating phoneNumber");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel booking
// @route   POST /api/v1/bookings/:id/cancel
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const cancellableStatuses = ["pending", "confirmed", "assigned"];
    if (!cancellableStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status '${booking.status}'`
      });
    }

    booking.status = "cancelled";
    booking.cancelReason = req.body.reason || "Cancelled by user";
    booking.cancelledAt = new Date();
    await booking.save();

    // Reverse wallet debit if any
    if (booking.walletAmountUsed > 0) {
      const { reverseDebitForBooking } = require("../services/walletService");
      await reverseDebitForBooking(req.user._id, booking._id);
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Rebook a past booking
// @route   POST /api/v1/bookings/:id/rebook
exports.rebookService = async (req, res) => {
  try {
    const oldBooking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });
    if (!oldBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Add items back to cart
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    for (const item of oldBooking.items) {
      const serviceExists = await Service.findById(item.serviceId);
      if (serviceExists && serviceExists.isActive) {
        const existingItem = cart.items.find(ci => ci.serviceId.toString() === item.serviceId.toString());
        if (existingItem) {
          existingItem.quantity = item.quantity;
        } else {
          cart.items.push({ serviceId: item.serviceId, quantity: item.quantity });
        }
      }
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Services added to cart for rebooking",
      data: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
