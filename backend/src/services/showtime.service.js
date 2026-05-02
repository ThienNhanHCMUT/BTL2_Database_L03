const { connectDB, sql } = require("../config/db");

function mapSeatType(rawType) {
  const t = (rawType || "").toLowerCase();

  if (t.includes("đôi") || t.includes("doi") || t.includes("couple")) {
    return "Đôi";
  }

  if (t.includes("vip")) {
    return "VIP";
  }

  return "Thường";
}

function mapSeatStatus(rawStatus, isBooked) {
  if (isBooked) return "booked";

  const s = (rawStatus || "").toLowerCase();

  if (
    s.includes("broken") ||
    s.includes("hỏng") ||
    s.includes("hong") ||
    s.includes("maintenance") ||
    s.includes("bảo trì") ||
    s.includes("bao tri")
  ) {
    return "broken";
  }

  return "available";
}

function buildSeatGrid(seats) {
  if (!Array.isArray(seats) || seats.length === 0) return [];

  const rows = [...new Set(seats.map((s) => s.row))].sort((a, b) =>
    a.localeCompare(b)
  );

  const maxCol = Math.max(...seats.map((s) => s.col));

  return rows.map((rowName) => {
    const rowSeats = seats
      .filter((s) => s.row === rowName)
      .sort((a, b) => a.col - b.col);

    const seatMap = new Map(rowSeats.map((s) => [s.col, s]));
    const fullRow = [];

    for (let col = 1; col <= maxCol; col++) {
      if (seatMap.has(col)) {
        fullRow.push(seatMap.get(col));
      } else {
        fullRow.push({
          row: rowName,
          col,
          type: "empty",
          status: "empty",
          label: "",
          surcharge: 1,
          zone: null,
        });
      }
    }

    return {
      row: rowName,
      seats: fullRow,
      isCouple: rowSeats.some((s) => s.type === "Đôi"),
    };
  });
}

async function getSeatsByShowtimeService(showtimeId) {
  const pool = await connectDB();

  const showtimeResult = await pool
    .request()
    .input("ShowtimeID", sql.VarChar(20), showtimeId)
    .query(`
      SELECT
        ShowtimeID,
        MovieID,
        RoomNumber,
        CinemaID,
        BasePrice,
        ShowStartTime,
        ShowLanguage,
        ShowFormat,
        ShowStatus
      FROM SHOWTIME
      WHERE ShowtimeID = @ShowtimeID
    `);

  const showtime = showtimeResult.recordset[0];
  if (!showtime) return null;

  const seatResult = await pool
    .request()
    .input("ShowtimeID", sql.VarChar(20), showtimeId)
    .query(`
      SELECT
        s.RowIndex,
        s.ColumnNumber,
        s.RoomNumber,
        s.CinemaID,
        s.SeatType,
        s.SeatStatus,
        s.SurchargeMultiplier,
        s.Zone
      FROM SHOWTIME st
      JOIN SEAT s
        ON st.RoomNumber = s.RoomNumber
       AND st.CinemaID = s.CinemaID
      WHERE st.ShowtimeID = @ShowtimeID
      ORDER BY s.RowIndex, s.ColumnNumber
    `);

  const bookedResult = await pool
    .request()
    .input("ShowtimeID", sql.VarChar(20), showtimeId)
    .query(`
      SELECT DISTINCT
        et.RowIndex,
        et.ColumnNumber
      FROM TICKET_DETAIL td
      JOIN E_TICKET et
        ON td.OrderDetailID = et.OrderDetailID
      WHERE td.ShowtimeID = @ShowtimeID
    `);

  const bookedSet = new Set(
    bookedResult.recordset.map((r) => `${r.RowIndex}-${r.ColumnNumber}`)
  );

  const seats = seatResult.recordset.map((row) => {
    const rowKey = `${row.RowIndex}-${row.ColumnNumber}`;
    const isBooked = bookedSet.has(rowKey);

    return {
      row: row.RowIndex,
      col: row.ColumnNumber,
      label: `${row.RowIndex}${row.ColumnNumber}`,
      type: mapSeatType(row.SeatType),
      status: mapSeatStatus(row.SeatStatus, isBooked),
      surcharge: Number(row.SurchargeMultiplier || 1),
      zone: row.Zone || null,
      roomNumber: row.RoomNumber,
      cinemaId: row.CinemaID,
    };
  });

  return {
    showtimeId: showtime.ShowtimeID,
    movieId: showtime.MovieID,
    roomNumber: showtime.RoomNumber,
    cinemaId: showtime.CinemaID,
    basePrice: Number(showtime.BasePrice),
    startTime: showtime.ShowStartTime,
    language: showtime.ShowLanguage,
    format: showtime.ShowFormat,
    status: showtime.ShowStatus,
    grid: buildSeatGrid(seats),
    seats,
  };
}

module.exports = {
  getSeatsByShowtimeService,
};