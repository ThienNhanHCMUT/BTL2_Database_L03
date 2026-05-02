const express = require("express");
const router = express.Router();

const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventMetrics,
} = require("../controllers/event.controller");

router.get("/", getEvents);
router.get("/:eventId/metrics", getEventMetrics);
router.post("/", createEvent);
router.put("/:eventId", updateEvent);
router.delete("/:eventId", deleteEvent);

module.exports = router;