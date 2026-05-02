const express = require("express");
const router = express.Router();
const {
  holdSeats,
  calculatePrice,
  confirmBooking,
  getBookingByOrderId,
} = require("../controllers/booking.controller");

router.post("/hold-seats", holdSeats);
router.post("/calculate-price", calculatePrice);
router.post("/confirm", confirmBooking);
router.get("/:orderId", getBookingByOrderId);

module.exports = router;