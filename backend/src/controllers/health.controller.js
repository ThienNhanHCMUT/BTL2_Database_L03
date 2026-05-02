function healthCheck(req, res) {
  return res.json({
    status: "ok",
    message: "Backend is running"
  });
}

module.exports = { healthCheck };