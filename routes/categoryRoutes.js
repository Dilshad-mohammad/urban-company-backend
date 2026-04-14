const express = require("express");
const router = express.Router();
const { getAllCategories, getSingleCategory, getSubcategories, createCategory, updateCategory, deleteCategory, getAllCategoriesAdmin } = require("../controllers/categoryController");
const { protect, authorize } = require("../middleWare/auth");

// Public routes
router.get("/", getAllCategories);
router.get("/:id/subcategories", getSubcategories);
router.get("/:id", getSingleCategory);

// Admin routes
router.get("/admin/all", protect, authorize("admin"), getAllCategoriesAdmin);
router.post("/", protect, authorize("admin"), createCategory);
router.put("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

module.exports = router;
