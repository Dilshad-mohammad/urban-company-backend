const express = require("express");
const router = express.Router();
const { getFaqs, getAllFaqsAdmin, createFaq, updateFaq, deleteFaq } = require("../controllers/faqController");
const { protect, authorize } = require("../middleWare/auth");

router.get("/", getFaqs);
router.get("/admin/all", protect, authorize("admin"), getAllFaqsAdmin);
router.post("/", protect, authorize("admin"), createFaq);
router.put("/:id", protect, authorize("admin"), updateFaq);
router.delete("/:id", protect, authorize("admin"), deleteFaq);

module.exports = router;
