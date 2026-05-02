const express = require("express");
const router = express.Router();

const {
  getOrganizerEventSummary,
} = require("../controllers/organizerSummary.controller");

router.get("/", getOrganizerEventSummary);

module.exports = router;