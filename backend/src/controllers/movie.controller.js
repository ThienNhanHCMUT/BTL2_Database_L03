const {
  getAllMovies,
  getMovieByIdService,
  getMovieShowtimesService,
} = require("../services/movie.service");

async function getMovies(req, res, next) {
  try {
    const movies = await getAllMovies();
    return res.json(movies);
  } catch (error) {
    next(error);
  }
}

async function getMovieById(req, res, next) {
  try {
    const { movieId } = req.params;
    const movie = await getMovieByIdService(movieId);

    if (!movie) {
      return res.status(404).json({
        message: "Không tìm thấy phim",
      });
    }

    return res.json(movie);
  } catch (error) {
    next(error);
  }
}

async function getMovieShowtimes(req, res, next) {
  try {
    const { movieId } = req.params;
    const { date } = req.query;

    const data = await getMovieShowtimesService(movieId, date);
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMovies,
  getMovieById,
  getMovieShowtimes,
};