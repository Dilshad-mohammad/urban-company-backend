const express = require("express");
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require("../controllers/cartController");
const { protect } = require("../middleWare/auth");

router.use(protect);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:serviceId", updateCartItem);
router.delete("/clear", clearCart);
router.delete("/:serviceId", removeFromCart);

module.exports = router;
