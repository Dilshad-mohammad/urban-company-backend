const express = require("express");
const router = express.Router();
const { getWalletBalance, getWalletTransactions } = require("../controllers/walletController");
const { protect } = require("../middleWare/auth");

router.use(protect);
router.get("/balance", getWalletBalance);
router.get("/transactions", getWalletTransactions);

module.exports = router;
