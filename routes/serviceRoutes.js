const express = require("express");
const router = express.Router();
const { getAllServices, getSingleService, getFeaturedServices, getServicesByCategory } = require("../controllers/serviceController");

// Public routes
router.get("/featured", getFeaturedServices);
router.get("/category/:categoryId", getServicesByCategory);
router.get("/", getAllServices);
router.get("/:id", getSingleService);

module.exports = router;
