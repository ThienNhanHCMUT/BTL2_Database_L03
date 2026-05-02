const { connectDB, sql } = require("../config/db");

async function getAllMovies() {
  const pool = await connectDB();

  const result = await pool.request().query(`
    SELECT
      m.MovieID,
      m.VnTitle,
      m.OriginTitle,
      m.MovieDuration,
      m.MovieReleaseDate,
      m.MovieEndDate,
      m.AgeRating,
      m.Country,
      m.ProductionYear,
      m.MovieDesc,
      m.PosterTrailer,
      m.ReleaseStatus,

      ISNULL((
        SELECT STRING_AGG(x.GenreName, '|')
        FROM (
          SELECT DISTINCT g.GenreName
          FROM MOVIE_GENRE mg
          JOIN GENRE g ON mg.GenreID = g.GenreID
          WHERE mg.MovieID = m.MovieID
        ) x
      ), '') AS Genres,

      ISNULL((
        SELECT STRING_AGG(x.ShowFormat, '|')
        FROM (
          SELECT DISTINCT s.ShowFormat
          FROM SHOWTIME s
          WHERE s.MovieID = m.MovieID
        ) x
      ), '') AS Formats

    FROM MOVIE m
    ORDER BY m.MovieReleaseDate DESC, m.MovieID
  `);

  return result.recordset.map((row) => ({
    movieId: row.MovieID,
    vnTitle: row.VnTitle,
    originTitle: row.OriginTitle,
    duration: row.MovieDuration,
    releaseDate: row.MovieReleaseDate,
    endDate: row.MovieEndDate,
    ageRating: row.AgeRating,
    country: row.Country,
    productionYear: row.ProductionYear,
    description: row.MovieDesc,
    status: row.ReleaseStatus,
    poster: "/posters/default.jpg",
    banner: "/posters/default.jpg",
    trailer: row.PosterTrailer || null,
    genres: row.Genres ? row.Genres.split("|").filter(Boolean) : [],
    formats: row.Formats ? row.Formats.split("|").filter(Boolean) : [],
  }));
}

async function getMovieByIdService(movieId) {
  const pool = await connectDB();

  const result = await pool
    .request()
    .input("MovieID", sql.VarChar(20), movieId)
    .query(`
      SELECT
        m.MovieID,
        m.VnTitle,
        m.OriginTitle,
        m.MovieDuration,
        m.MovieReleaseDate,
        m.MovieEndDate,
        m.AgeRating,
        m.Country,
        m.ProductionYear,
        m.MovieDesc,
        m.PosterTrailer,
        m.ReleaseStatus,

        ISNULL((
          SELECT STRING_AGG(x.GenreName, '|')
          FROM (
            SELECT DISTINCT g.GenreName
            FROM MOVIE_GENRE mg
            JOIN GENRE g ON mg.GenreID = g.GenreID
            WHERE mg.MovieID = m.MovieID
          ) x
        ), '') AS Genres,

        ISNULL((
          SELECT STRING_AGG(x.ShowFormat, '|')
          FROM (
            SELECT DISTINCT s.ShowFormat
            FROM SHOWTIME s
            WHERE s.MovieID = m.MovieID
          ) x
        ), '') AS Formats,

        ISNULL((
          SELECT STRING_AGG(x.DirectorName, '|')
          FROM (
            SELECT DISTINCT d.DirectorName
            FROM MOVIE_DIRECTOR md
            JOIN DIRECTOR d ON md.DirectorID = d.DirectorID
            WHERE md.MovieID = m.MovieID
          ) x
        ), '') AS Directors,

        ISNULL((
          SELECT STRING_AGG(x.ActorName, '|')
          FROM (
            SELECT DISTINCT a.ActorName
            FROM MOVIE_ACTOR ma
            JOIN ACTOR a ON ma.ActorID = a.ActorID
            WHERE ma.MovieID = m.MovieID
          ) x
        ), '') AS Actors

      FROM MOVIE m
      WHERE m.MovieID = @MovieID
    `);

  const row = result.recordset[0];
  if (!row) return null;

  return {
    movieId: row.MovieID,
    vnTitle: row.VnTitle,
    originTitle: row.OriginTitle,
    duration: row.MovieDuration,
    releaseDate: row.MovieReleaseDate,
    endDate: row.MovieEndDate,
    ageRating: row.AgeRating,
    country: row.Country,
    productionYear: row.ProductionYear,
    description: row.MovieDesc,
    status: row.ReleaseStatus,
    poster: "/posters/default.jpg",
    banner: "/posters/default.jpg",
    trailer: row.PosterTrailer || null,
    genres: row.Genres ? row.Genres.split("|").filter(Boolean) : [],
    formats: row.Formats ? row.Formats.split("|").filter(Boolean) : [],
    directors: row.Directors
      ? row.Directors.split("|").filter(Boolean).map((name) => ({ name }))
      : [],
    actors: row.Actors
      ? row.Actors.split("|").filter(Boolean).map((name) => ({ name }))
      : [],
  };
}

async function getMovieShowtimesService(movieId, date) {
  const pool = await connectDB();

  const request = pool
    .request()
    .input("MovieID", sql.VarChar(20), movieId);

  let query = `
    SELECT
      s.ShowtimeID,
      s.ShowStartTime,
      s.BasePrice,
      s.ShowLanguage,
      s.ShowFormat,
      s.ShowStatus,
      s.RoomNumber,
      s.CinemaID,

      c.CinemaName,
      c.CinemaHouseNo,
      c.CinemaStreet,
      c.CinemaWard,
      c.CinemaCity

    FROM SHOWTIME s
    JOIN CINEMA c ON s.CinemaID = c.CinemaID
    WHERE s.MovieID = @MovieID
  `;

  if (date) {
    request.input("SelectedDate", sql.Date, date);
    query += `
      AND CAST(s.ShowStartTime AS DATE) = @SelectedDate
    `;
  }

  query += `
    ORDER BY c.CinemaName, s.ShowStartTime
  `;

  const result = await request.query(query);
  const rows = result.recordset;

  const cinemaMap = new Map();

  for (const row of rows) {
    const cinemaId = row.CinemaID;

    if (!cinemaMap.has(cinemaId)) {
      const addressParts = [
        row.CinemaHouseNo,
        row.CinemaStreet,
        row.CinemaWard,
        row.CinemaCity,
      ].filter(Boolean);

      cinemaMap.set(cinemaId, {
        cinemaId: row.CinemaID,
        name: row.CinemaName,
        address: addressParts.join(", "),
        city: row.CinemaCity,
        showtimes: [],
      });
    }

    cinemaMap.get(cinemaId).showtimes.push({
      showtimeId: row.ShowtimeID,
      startTime: row.ShowStartTime,
      basePrice: Number(row.BasePrice),
      language: row.ShowLanguage,
      format: row.ShowFormat,
      status: row.ShowStatus,
      roomNumber: row.RoomNumber,
      cinemaId: row.CinemaID,
    });
  }

  return Array.from(cinemaMap.values());
}

module.exports = {
  getAllMovies,
  getMovieByIdService,
  getMovieShowtimesService,
};

