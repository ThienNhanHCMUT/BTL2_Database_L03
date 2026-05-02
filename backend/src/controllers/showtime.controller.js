const { getSeatsByShowtimeService } = require("../services/showtime.service");

async function getSeatsByShowtime(req, res, next) {
  try {
    const { showtimeId } = req.params;
    const data = await getSeatsByShowtimeService(showtimeId);

    if (!data) {
      return res.status(404).json({
        message: "Không tìm thấy suất chiếu",
      });
    }

    return res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = { getSeatsByShowtime };