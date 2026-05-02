const express = require("express");
const router = express.Router();
const {
  validatePromotion,
  getActivePromotions,
} = require("../controllers/promotion.controller");

router.post("/validate", validatePromotion);
router.get("/active", getActivePromotions);

module.exports = router;