const express = require("express");
const router = express.Router();
const { getGenres } = require("../controllers/genre.controller");

router.get("/", getGenres);

module.exports = router;