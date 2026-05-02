const express = require("express");
const router = express.Router();
const {
  getMovies,
  getMovieById,
  getMovieShowtimes,
} = require("../controllers/movie.controller");

router.get("/", getMovies);
router.get("/:movieId", getMovieById);
router.get("/:movieId/showtimes", getMovieShowtimes);

module.exports = router;