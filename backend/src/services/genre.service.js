const { connectDB } = require("../config/db");

async function getAllGenresService() {
  const pool = await connectDB();

  const result = await pool.request().query(`
    SELECT
      g.GenreID,
      g.GenreName,
      g.GenreDesc,
      COUNT(DISTINCT mg.MovieID) AS MovieCount
    FROM GENRE g
    LEFT JOIN MOVIE_GENRE mg
      ON g.GenreID = mg.GenreID
    GROUP BY
      g.GenreID,
      g.GenreName,
      g.GenreDesc
    ORDER BY g.GenreName
  `);

  return result.recordset.map((row) => ({
    genreId: row.GenreID,
    genreName: row.GenreName,
    description: row.GenreDesc,
    movieCount: Number(row.MovieCount || 0),
  }));
}

module.exports = {
  getAllGenresService,
};