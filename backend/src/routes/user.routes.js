const express = require("express");
const router = express.Router();

const { getMyBookings } = require("../controllers/booking.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.get("/me/bookings", requireAuth, getMyBookings);

module.exports = router;