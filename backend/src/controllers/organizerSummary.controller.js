const {
  getOrganizerEventSummaryService,
} = require("../services/organizerSummary.service");

function sendError(res, error) {
  return res.status(error.statusCode || 500).json({
    message: error.message || "Có lỗi xảy ra phía server.",
  });
}

async function getOrganizerEventSummary(req, res) {
  try {
    const rows = await getOrganizerEventSummaryService(req.query);
    return res.json(rows);
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  getOrganizerEventSummary,
};