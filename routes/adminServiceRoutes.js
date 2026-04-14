const express = require("express");
const router = express.Router();
const { getAllServicesAdmin, createService, updateService, deleteService, toggleServiceStatus } = require("../controllers/adminServiceController");
const { protect, authorize } = require("../middleWare/auth");

router.use(protect, authorize("admin"));

router.get("/", getAllServicesAdmin);
router.post("/", createService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);
router.patch("/:id/toggle", toggleServiceStatus);

module.exports = router;
