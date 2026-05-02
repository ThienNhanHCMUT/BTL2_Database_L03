const {
  getAllCinemasService,
  getCinemaByIdService,
  getRoomSeatsService,
} = require("../services/cinema.service");

async function getCinemas(req, res, next) {
  try {
    const cinemas = await getAllCinemasService();
    return res.json(cinemas);
  } catch (error) {
    next(error);
  }
}

async function getCinemaById(req, res, next) {
  try {
    const { cinemaId } = req.params;
    const cinema = await getCinemaByIdService(cinemaId);

    if (!cinema) {
      return res.status(404).json({
        message: "Không tìm thấy rạp",
      });
    }

    return res.json(cinema);
  } catch (error) {
    next(error);
  }
}

async function getRoomSeats(req, res, next) {
  try {
    const { cinemaId, roomNumber } = req.params;
    const data = await getRoomSeatsService(cinemaId, roomNumber);

    if (!data) {
      return res.status(404).json({
        message: "Không tìm thấy phòng chiếu",
      });
    }

    return res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCinemas,
  getCinemaById,
  getRoomSeats,
};