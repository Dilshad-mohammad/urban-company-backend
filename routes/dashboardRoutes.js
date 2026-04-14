const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleWare/auth");

router.get("/stats", protect, authorize("admin"), getDashboardStats);

module.exports = router;
