const express = require("express");
const router = express.Router();
const { getSeatsByShowtime } = require("../controllers/showtime.controller");

router.get("/:showtimeId/seats", getSeatsByShowtime);

module.exports = router;