const { connectDB, sql } = require("../config/db");

function buildAddress(parts) {
  return [
    parts.houseNo,
    parts.street,
    parts.ward,
    parts.city,
  ]
    .filter(Boolean)
    .join(", ");
}

function createHttpError(message, statusCode = 400, code = "BUSINESS_ERROR") {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

async function getMyBookingsService(personId) {
  if (!personId) {
    throw createHttpError("Không xác định được người dùng hiện tại.", 401, "UNAUTHORIZED");
  }

  const pool = await connectDB();

  const orderResult = await pool
    .request()
    .input("PersonID", sql.VarChar(20), personId)
    .query(`
      SELECT
        o.OrderID,
        o.OrderStatus,
        o.OrderDate,
        o.OrderNote,
        o.TotalAmount,
        o.PersonID,

        oo.TicketIssuedAt,
        oo.BookingPlatform,
        oo.DeliveryMethod,

        ap.VoucherID,
        ap.DiscountAmount,

        pt.TransactionID,
        pt.PaymentTransactionAmount,
        pt.PaymentTransactionPaymentTime,
        pt.PaymentTransactionPaymentStatus,
        pt.PaymentTransactionMethod,
        pt.PaymentTransactionReferenceID,

        ft.ShowtimeID,
        ft.ShowStartTime,
        ft.ShowLanguage,
        ft.ShowFormat,
        ft.RoomNumber,

        ft.MovieID,
        ft.VnTitle,
        ft.OriginTitle,

        ft.CinemaID,
        ft.CinemaName,
        ft.CinemaHouseNo,
        ft.CinemaStreet,
        ft.CinemaWard,
        ft.CinemaCity
      FROM [ORDER] o
      LEFT JOIN ONLINE_ORDER oo
        ON oo.OrderID = o.OrderID
      LEFT JOIN APPLY ap
        ON ap.OrderID = o.OrderID
      OUTER APPLY (
        SELECT TOP 1
          ptt.TransactionID,
          ptt.PaymentTransactionAmount,
          ptt.PaymentTransactionPaymentTime,
          ptt.PaymentTransactionPaymentStatus,
          ptt.PaymentTransactionMethod,
          ptt.PaymentTransactionReferenceID
        FROM PAYMENT_TRANSACTION ptt
        WHERE ptt.OrderID = o.OrderID
        ORDER BY ptt.PaymentTransactionPaymentTime DESC
      ) pt
      OUTER APPLY (
        SELECT TOP 1
          td.ShowtimeID,
          s.ShowStartTime,
          s.ShowLanguage,
          s.ShowFormat,
          et.RoomNumber,

          m.MovieID,
          m.VnTitle,
          m.OriginTitle,

          et.CinemaID,
          c.CinemaName,
          c.CinemaHouseNo,
          c.CinemaStreet,
          c.CinemaWard,
          c.CinemaCity
        FROM ORDER_DETAIL od
        JOIN TICKET_DETAIL td
          ON td.OrderDetailID = od.OrderDetailID
        JOIN E_TICKET et
          ON et.OrderDetailID = od.OrderDetailID
        JOIN SHOWTIME s
          ON s.ShowtimeID = td.ShowtimeID
        JOIN MOVIE m
          ON m.MovieID = s.MovieID
        JOIN CINEMA c
          ON c.CinemaID = et.CinemaID
        WHERE od.OrderID = o.OrderID
        ORDER BY s.ShowStartTime DESC
      ) ft
      WHERE o.PersonID = @PersonID
      ORDER BY o.OrderDate DESC, o.OrderID DESC
    `);

  const seatResult = await pool
    .request()
    .input("PersonID", sql.VarChar(20), personId)
    .query(`
      SELECT
        od.OrderID,
        et.RowIndex,
        et.ColumnNumber
      FROM [ORDER] o
      JOIN ORDER_DETAIL od
        ON od.OrderID = o.OrderID
      JOIN TICKET_DETAIL td
        ON td.OrderDetailID = od.OrderDetailID
      JOIN E_TICKET et
        ON et.OrderDetailID = od.OrderDetailID
      WHERE o.PersonID = @PersonID
      ORDER BY od.OrderID, et.RowIndex, et.ColumnNumber
    `);

  const comboResult = await pool
    .request()
    .input("PersonID", sql.VarChar(20), personId)
    .query(`
      SELECT
        od.OrderID,
        SUM(od.OrderDetailQuantity) AS ComboCount
      FROM [ORDER] o
      JOIN ORDER_DETAIL od
        ON od.OrderID = o.OrderID
      JOIN PRODUCT_DETAIL pd
        ON pd.OrderDetailID = od.OrderDetailID
      WHERE o.PersonID = @PersonID
      GROUP BY od.OrderID
    `);

  const seatsMap = new Map();

  for (const row of seatResult.recordset) {
    const orderId = row.OrderID;
    const current = seatsMap.get(orderId) || [];
    current.push(`${row.RowIndex}${row.ColumnNumber}`);
    seatsMap.set(orderId, current);
  }

  const comboMap = new Map();
  for (const row of comboResult.recordset) {
    comboMap.set(row.OrderID, Number(row.ComboCount || 0));
  }

  const bookings = orderResult.recordset.map((row) => {
    const seats = seatsMap.get(row.OrderID) || [];
    const comboCount = comboMap.get(row.OrderID) || 0;
    const grandTotal = Number(row.TotalAmount || 0);

    return {
      orderId: row.OrderID,
      orderStatus: Boolean(row.OrderStatus),
      orderDate: row.OrderDate,
      orderNote: row.OrderNote || "",
      personId: row.PersonID,

      booking: row.MovieID
        ? {
            movie: {
              movieId: row.MovieID,
              vnTitle: row.VnTitle,
              originTitle: row.OriginTitle,
            },
            cinema: {
              cinemaId: row.CinemaID,
              name: row.CinemaName,
              address: buildAddress({
                houseNo: row.CinemaHouseNo,
                street: row.CinemaStreet,
                ward: row.CinemaWard,
                city: row.CinemaCity,
              }),
              city: row.CinemaCity,
            },
            showtime: {
              showtimeId: row.ShowtimeID,
              startTime: row.ShowStartTime,
              language: row.ShowLanguage,
              format: row.ShowFormat,
              roomNumber: row.RoomNumber,
            },
          }
        : null,

      onlineOrder: {
        ticketIssuedAt: row.TicketIssuedAt || null,
        bookingPlatform: row.BookingPlatform || null,
        deliveryMethod: row.DeliveryMethod || null,
      },

      payment: {
        transactionId: row.TransactionID || null,
        amount: Number(row.PaymentTransactionAmount || 0),
        paymentTime: row.PaymentTransactionPaymentTime || null,
        paymentStatus: row.PaymentTransactionPaymentStatus || null,
        paymentMethod: row.PaymentTransactionMethod || null,
        referenceId: row.PaymentTransactionReferenceID || null,
      },

      voucher: row.VoucherID
        ? {
            voucherId: row.VoucherID,
            discountAmount: Number(row.DiscountAmount || 0),
          }
        : null,

      seats,
      seatLabels: seats.join(", "),
      ticketCount: seats.length,
      comboCount,

      summary: {
        ticketCount: seats.length,
        comboCount,
        grandTotal,
      },
    };
  });

  return {
    bookings,
  };
}

module.exports = {
  getMyBookingsService,
};