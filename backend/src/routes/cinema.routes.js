const express = require("express");
const router = express.Router();

const {
  getCinemas,
  getCinemaById,
  getRoomSeats,
} = require("../controllers/cinema.controller");

router.get("/cinemas", getCinemas);
router.get("/cinemas/:cinemaId", getCinemaById);
router.get("/rooms/:cinemaId/:roomNumber/seats", getRoomSeats);

module.exports = router;