const { getAllGenresService } = require("../services/genre.service");

async function getGenres(req, res, next) {
  try {
    const genres = await getAllGenresService();
    return res.json(genres);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getGenres,
};