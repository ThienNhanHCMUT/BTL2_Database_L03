const { connectDB, sql } = require("../config/db");

function buildAddress(row) {
  return [
    row.CinemaHouseNo,
    row.CinemaStreet,
    row.CinemaWard,
    row.CinemaCity,
  ]
    .filter(Boolean)
    .join(", ");
}

function splitPipe(value) {
  if (!value) return [];
  return String(value).split("|").map((x) => x.trim()).filter(Boolean);
}

function formatTimeValue(value) {
  if (!value) return null;

  if (typeof value === "string") {
    return value.slice(0, 5);
  }

  if (value instanceof Date) {
    return value.toTimeString().slice(0, 5);
  }

  return String(value).slice(0, 5);
}

function normalizeSeatType(type) {
  const value = String(type || "").toLowerCase();

  if (value.includes("vip")) return "VIP";
  if (
    value.includes("đôi") ||
    value.includes("doi") ||
    value.includes("couple")
  ) {
    return "Đôi";
  }

  return "Thường";
}

function normalizeSeatStatus(status) {
  const value = String(status || "").toLowerCase();

  if (value.includes("hỏng") || value.includes("hong")) {
    return "broken";
  }

  return "available";
}

function buildSeatGrid(seats) {
  if (!Array.isArray(seats) || seats.length === 0) return [];

  const rowSet = new Set();
  let maxCol = 0;

  for (const seat of seats) {
    rowSet.add(seat.row);
    if (seat.col > maxCol) maxCol = seat.col;
  }

  const rows = Array.from(rowSet).sort((a, b) => a.localeCompare(b));

  const seatMap = new Map(
    seats.map((seat) => [`${seat.row}-${seat.col}`, seat])
  );

  return rows.map((row) => {
    const rowSeats = [];

    for (let col = 1; col <= maxCol; col++) {
      const key = `${row}-${col}`;
      const actualSeat = seatMap.get(key);

      if (!actualSeat) {
        rowSeats.push({
          row,
          col,
          label: `${row}${col}`,
          type: "empty",
          status: "empty",
          surcharge: 0,
          zone: null,
        });
        continue;
      }

      rowSeats.push(actualSeat);
    }

    return {
      row,
      seats: rowSeats,
    };
  });
}

async function getAllCinemasService() {
  const pool = await connectDB();

  const result = await pool.request().query(`
    SELECT
      c.CinemaID,
      c.CinemaName,
      c.OperatingOpen,
      c.OperatingClose,
      c.CinemaType,
      c.CinemaStatus,
      c.CinemaHouseNo,
      c.CinemaStreet,
      c.CinemaWard,
      c.CinemaCity,
      ISNULL((
        SELECT STRING_AGG(x.CinemaPhoneNum, '|')
        FROM (
          SELECT DISTINCT cp.CinemaPhoneNum
          FROM CINEMA_PHONE cp
          WHERE cp.CinemaID = c.CinemaID
        ) x
      ), '') AS Phones
    FROM CINEMA c
    ORDER BY c.CinemaName
  `);

  return result.recordset.map((row) => ({
    cinemaId: row.CinemaID,
    name: row.CinemaName,
    type: row.CinemaType,
    status: row.CinemaStatus,
    address: buildAddress(row),
    city: row.CinemaCity,
    operatingHours: {
      open: formatTimeValue(row.OperatingOpen),
      close: formatTimeValue(row.OperatingClose),
    },
    phones: splitPipe(row.Phones),
  }));
}

async function getCinemaByIdService(cinemaId) {
  const pool = await connectDB();

  const result = await pool
    .request()
    .input("CinemaID", sql.VarChar(20), cinemaId)
    .query(`
      SELECT
        c.CinemaID,
        c.CinemaName,
        c.OperatingOpen,
        c.OperatingClose,
        c.CinemaType,
        c.CinemaStatus,
        c.CinemaHouseNo,
        c.CinemaStreet,
        c.CinemaWard,
        c.CinemaCity,
        ISNULL((
          SELECT STRING_AGG(x.CinemaPhoneNum, '|')
          FROM (
            SELECT DISTINCT cp.CinemaPhoneNum
            FROM CINEMA_PHONE cp
            WHERE cp.CinemaID = c.CinemaID
          ) x
        ), '') AS Phones
      FROM CINEMA c
      WHERE c.CinemaID = @CinemaID
    `);

  const row = result.recordset[0];
  if (!row) return null;

  return {
    cinemaId: row.CinemaID,
    name: row.CinemaName,
    type: row.CinemaType,
    status: row.CinemaStatus,
    address: buildAddress(row),
    city: row.CinemaCity,
    operatingHours: {
      open: formatTimeValue(row.OperatingOpen),
      close: formatTimeValue(row.OperatingClose),
    },
    phones: splitPipe(row.Phones),
  };
}

async function getRoomSeatsService(cinemaId, roomNumber) {
  const pool = await connectDB();

  const roomResult = await pool
    .request()
    .input("CinemaID", sql.VarChar(20), cinemaId)
    .input("RoomNumber", sql.VarChar(20), roomNumber)
    .query(`
      SELECT
        r.RoomNumber,
        r.CinemaID,
        r.RoomType,
        r.AudioSystem,
        r.MaxCapacity,
        r.RoomTechStatus,
        r.SeatLayout,
        ISNULL((
          SELECT STRING_AGG(x.ScreenType, '|')
          FROM (
            SELECT DISTINCT rss.ScreenType
            FROM ROOM_SUPPORTED_SCREEN rss
            WHERE rss.CinemaID = r.CinemaID
              AND rss.RoomNumber = r.RoomNumber
          ) x
        ), '') AS SupportedScreens
      FROM ROOM r
      WHERE r.CinemaID = @CinemaID
        AND r.RoomNumber = @RoomNumber
    `);

  const room = roomResult.recordset[0];
  if (!room) return null;

  const seatResult = await pool
    .request()
    .input("CinemaID", sql.VarChar(20), cinemaId)
    .input("RoomNumber", sql.VarChar(20), roomNumber)
    .query(`
      SELECT
        RowIndex,
        ColumnNumber,
        SeatType,
        SeatStatus,
        SurchargeMultiplier,
        Zone
      FROM SEAT
      WHERE CinemaID = @CinemaID
        AND RoomNumber = @RoomNumber
      ORDER BY RowIndex, ColumnNumber
    `);

  const seats = seatResult.recordset.map((row) => ({
    row: row.RowIndex,
    col: Number(row.ColumnNumber),
    label: `${row.RowIndex}${row.ColumnNumber}`,
    type: normalizeSeatType(row.SeatType),
    status: normalizeSeatStatus(row.SeatStatus),
    surcharge: Number(row.SurchargeMultiplier || 1),
    zone: row.Zone || null,
  }));

  return {
    room: {
      cinemaId: room.CinemaID,
      roomNumber: room.RoomNumber,
      roomType: room.RoomType,
      audioSystem: room.AudioSystem,
      maxCapacity: Number(room.MaxCapacity || 0),
      techStatus: room.RoomTechStatus,
      supportedScreens: splitPipe(room.SupportedScreens),
      seatLayout: room.SeatLayout,
    },
    seats,
    grid: buildSeatGrid(seats),
  };
}

module.exports = {
  getAllCinemasService,
  getCinemaByIdService,
  getRoomSeatsService,
};