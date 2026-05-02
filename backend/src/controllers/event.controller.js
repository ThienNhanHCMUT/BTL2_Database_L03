const {
  getEventsService,
  createEventService,
  updateEventService,
  deleteEventService,
} = require("../services/event.service");

const {
  getEventMetricsService,
} = require("../services/eventMetric.service");

function sendError(res, error) {
  return res.status(error.statusCode || 500).json({
    message: error.message || "Có lỗi xảy ra phía server.",
    fieldErrors: error.fieldErrors || null,
  });
}

async function getEvents(req, res) {
  try {
    const events = await getEventsService(req.query);
    return res.json(events);
  } catch (error) {
    return sendError(res, error);
  }
}

async function createEvent(req, res) {
  try {
    const event = await createEventService(req.body);
    return res.status(201).json(event);
  } catch (error) {
    return sendError(res, error);
  }
}

async function updateEvent(req, res) {
  try {
    const { eventId } = req.params;
    const event = await updateEventService(eventId, req.body);
    return res.json(event);
  } catch (error) {
    return sendError(res, error);
  }
}

async function deleteEvent(req, res) {
  try {
    const { eventId } = req.params;
    const result = await deleteEventService(eventId);
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
}

async function getEventMetrics(req, res) {
  try {
    const { eventId } = req.params;
    const metrics = await getEventMetricsService(eventId);
    return res.json(metrics);
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventMetrics,
};