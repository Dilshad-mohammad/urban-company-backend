const mongoose = require("mongoose");
const WalletLot = require("../models/WalletLot");
const WalletTransaction = require("../models/WalletTransaction");

async function sumAvailableBalance(userId) {
  const now = new Date();
  const result = await WalletLot.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        remainingAmount: { $gt: 0 },
        expiresAt: { $gt: now }
      }
    },
    { $group: { _id: null, total: { $sum: "$remainingAmount" } } }
  ]);
  return result.length ? Math.round(result[0].total * 100) / 100 : 0;
}

function computeMaxWalletUse(subtotal, availableBalance, settings) {
  const pct = settings.walletMaxUsagePercentOfSubtotal / 100;
  const cap = Math.round(subtotal * pct * 100) / 100;
  return Math.min(availableBalance, cap);
}

/**
 * FIFO debit wallet lots (nearest expiry first).
 */
async function debitWallet(userId, bookingId, amount, session = null) {
  if (amount <= 0) return { debited: 0 };

  const now = new Date();
  const lots = await WalletLot.find({
    userId,
    remainingAmount: { $gt: 0 },
    expiresAt: { $gt: now }
  })
    .sort({ expiresAt: 1 })
    .session(session || null);

  let remaining = Math.round(amount * 100) / 100;
  let totalDebited = 0;

  for (const lot of lots) {
    if (remaining <= 0) break;
    const take = Math.min(lot.remainingAmount, remaining);
    lot.remainingAmount = Math.round((lot.remainingAmount - take) * 100) / 100;
    await lot.save({ session: session || undefined });
    remaining = Math.round((remaining - take) * 100) / 100;
    totalDebited += take;

    await WalletTransaction.create(
      [
        {
          userId,
          type: "debit",
          amount: take,
          bookingId,
          lotId: lot._id,
          description: "Booking payment"
        }
      ],
      { session: session || undefined }
    );
  }

  if (remaining > 0.009) {
    throw new Error("Insufficient wallet balance");
  }

  const balanceAfter = await sumAvailableBalance(userId);
  return { debited: totalDebited, balanceAfter };
}

async function creditWallet(userId, { amount, expiresAt, sourceBookingId, reason, session }) {
  const rounded = Math.round(amount * 100) / 100;
  if (rounded <= 0) return null;

  const lot = await WalletLot.create(
    [
      {
        userId,
        originalAmount: rounded,
        remainingAmount: rounded,
        expiresAt,
        sourceBookingId: sourceBookingId || null,
        reason: reason || "other"
      }
    ],
    { session: session || undefined }
  );

  const created = lot[0];
  const balanceAfter = await sumAvailableBalance(userId);

  await WalletTransaction.create(
    [
      {
        userId,
        type: "credit",
        amount: rounded,
        balanceAfter,
        bookingId: sourceBookingId || null,
        lotId: created._id,
        description: reason === "first_order_cashback" ? "First booking cashback" : "Wallet credit"
      }
    ],
    { session: session || undefined }
  );

  return created;
}

/**
 * Reverse debits for a booking (e.g. cancel).
 */
async function reverseDebitForBooking(userId, bookingId, session = null) {
  const debits = await WalletTransaction.find({
    userId,
    bookingId,
    type: "debit"
  }).session(session || null);

  if (!debits.length) return;

  for (const tx of debits) {
    if (tx.lotId) {
      const lot = await WalletLot.findById(tx.lotId).session(session || null);
      if (lot) {
        lot.remainingAmount = Math.round((lot.remainingAmount + tx.amount) * 100) / 100;
        await lot.save({ session: session || undefined });
      }
    }
    await WalletTransaction.create(
      [
        {
          userId,
          type: "refund_reversal",
          amount: tx.amount,
          bookingId,
          description: "Booking cancelled — wallet restored"
        }
      ],
      { session: session || undefined }
    );
  }
}

async function expireDueLots(userId, session = null) {
  const now = new Date();
  const lots = await WalletLot.find({
    userId,
    remainingAmount: { $gt: 0 },
    expiresAt: { $lte: now }
  });

  for (const lot of lots) {
    const lost = lot.remainingAmount;
    if (lost <= 0) continue;
    lot.remainingAmount = 0;
    await lot.save({ session: session || undefined });
    await WalletTransaction.create(
      [
        {
          userId,
          type: "expire",
          amount: lost,
          lotId: lot._id,
          description: "Wallet coins expired"
        }
      ],
      { session: session || undefined }
    );
  }
}

async function getExpiringSoon(userId, days = 7) {
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const lots = await WalletLot.find({
    userId,
    remainingAmount: { $gt: 0 },
    expiresAt: { $gt: now, $lte: until }
  }).sort({ expiresAt: 1 });
  const sum = lots.reduce((a, l) => a + l.remainingAmount, 0);
  return { lots, totalExpiring: Math.round(sum * 100) / 100 };
}

module.exports = {
  sumAvailableBalance,
  computeMaxWalletUse,
  debitWallet,
  creditWallet,
  reverseDebitForBooking,
  expireDueLots,
  getExpiringSoon
};
