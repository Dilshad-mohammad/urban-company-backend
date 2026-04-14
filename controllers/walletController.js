const { sumAvailableBalance, getExpiringSoon } = require("../services/walletService");
const WalletTransaction = require("../models/WalletTransaction");

// @desc    Get wallet balance
// @route   GET /api/v1/wallet/balance
exports.getWalletBalance = async (req, res) => {
  try {
    const balance = await sumAvailableBalance(req.user._id);
    const expiring = await getExpiringSoon(req.user._id, 7);
    res.status(200).json({
      success: true,
      data: { balance, expiringSoon: expiring.totalExpiring }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get wallet transactions
// @route   GET /api/v1/wallet/transactions
exports.getWalletTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      WalletTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      WalletTransaction.countDocuments({ userId: req.user._id })
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
