const { connectDB, sql } = require("../config/db");

function makeId(prefix, index = "") {
  const stamp = Date.now().toString().slice(-8);
  const suffix = index === "" ? "" : String(index).padStart(2, "0");
  return `${prefix}${stamp}${suffix}`.slice(0, 20);
}

function extractMinOrderAmount(text) {
  if (!text) return 0;
  const match = String(text).match(/(\d[\d.,]*)/);
  if (!match) return 0;
  return Number(match[1].replace(/[^\d]/g, "")) || 0;
}

function normalizePaymentMethod(method) {
  if (!method) return "momo";
  return String(method).trim();
}

function createHttpError(message, statusCode = 400, code = "BUSINESS_ERROR") {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}


const ACTIVE_HOLDS = new Map();
const DEFAULT_HOLD_MINUTES = 10;

function makeSeatKey(showtimeId, row, col) {
  return `${showtimeId}:${row}:${col}`;
}

function cleanupExpiredHolds() {
  const now = Date.now();

  for (const [key, value] of ACTIVE_HOLDS.entries()) {
    if (!value?.expiresAt || value.expiresAt <= now) {
      ACTIVE_HOLDS.delete(key);
    }
  }
}

function getActiveHold(showtimeId, row, col) {
  cleanupExpiredHolds();
  const key = makeSeatKey(showtimeId, row, col);
  return ACTIVE_HOLDS.get(key) || null;
}

function createHoldToken() {
  return `HOLD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function upsertSeatHold(showtimeId, row, col, holdToken, expiresAt) {
  const key = makeSeatKey(showtimeId, row, col);
  ACTIVE_HOLDS.set(key, {
    holdToken,
    showtimeId,
    row,
    col,
    expiresAt: expiresAt.getTime(),
  });
}

function releaseHoldByToken(holdToken) {
  if (!holdToken) return;

  for (const [key, value] of ACTIVE_HOLDS.entries()) {
    if (value?.holdToken === holdToken) {
      ACTIVE_HOLDS.delete(key);
    }
  }
}

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





async function getShowtime(pool, showtimeId) {
  const result = await pool
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

  return result.recordset[0] || null;
}

async function getSeatsForShowtime(pool, showtime) {
  const seatResult = await pool
    .request()
    .input("RoomNumber", sql.VarChar(20), showtime.RoomNumber)
    .input("CinemaID", sql.VarChar(20), showtime.CinemaID)
    .query(`
      SELECT
        RowIndex,
        ColumnNumber,
        SeatType,
        SeatStatus,
        SurchargeMultiplier,
        Zone
      FROM SEAT
      WHERE RoomNumber = @RoomNumber
        AND CinemaID = @CinemaID
      ORDER BY RowIndex, ColumnNumber
    `);

  const bookedResult = await pool
    .request()
    .input("ShowtimeID", sql.VarChar(20), showtime.ShowtimeID)
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

  return {
    allSeats: seatResult.recordset,
    bookedSet,
  };
}

async function getProducts(pool) {
  const result = await pool.request().query(`
    SELECT ProductID, ProductName, BasePrice, ProductStatus
    FROM PRODUCT
  `);

  const map = new Map();
  result.recordset.forEach((p) => {
    map.set(p.ProductID, p);
  });
  return map;
}

async function getVoucher(pool, promoCode) {
  if (!promoCode) return null;

  const result = await pool
    .request()
    .input("VoucherID", sql.VarChar(20), promoCode)
    .query(`
      SELECT
        VoucherID,
        VoucherDiscountType,
        VoucherValue,
        VoucherApplyCondition,
        VoucherExpiresAt,
        VoucherStatus
      FROM VOUCHER
      WHERE VoucherID = @VoucherID
    `);

  return result.recordset[0] || null;
}

async function getFallbackPersonId(pool) {
  let result = await pool.request().query(`
    SELECT TOP 1 PersonID
    FROM GUEST_CUSTOMER
    ORDER BY PersonID
  `);

  if (result.recordset[0]?.PersonID) {
    return result.recordset[0].PersonID;
  }

  result = await pool.request().query(`
    SELECT TOP 1 PersonID
    FROM CUSTOMER
    ORDER BY PersonID
  `);

  if (result.recordset[0]?.PersonID) {
    return result.recordset[0].PersonID;
  }

  throw new Error("Không tìm thấy khách hàng mặc định để tạo đơn hàng.");
}

async function buildCheckoutDraft(pool, payload) {
  const {
    showtimeId,
    selectedSeats = [],
    selectedCombos = [],
    promoCode = null,
    holdToken = null,
  } = payload || {};



  if (!showtimeId) {
    throw createHttpError("Thiếu showtimeId.", 400, "MISSING_SHOWTIME_ID");
  }

  if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
    throw createHttpError("Vui lòng chọn ít nhất 1 ghế.", 400, "EMPTY_SELECTED_SEATS");
  }

  const showtime = await getShowtime(pool, showtimeId);
  if (!showtime) {
    throw createHttpError("Không tìm thấy suất chiếu.", 404, "SHOWTIME_NOT_FOUND");
  }

  const { allSeats, bookedSet } = await getSeatsForShowtime(pool, showtime);
  const seatMap = new Map(
    allSeats.map((s) => [`${s.RowIndex}-${s.ColumnNumber}`, s])
  );

  const uniqueSelected = [];
  const seen = new Set();

  for (const seat of selectedSeats) {
    const row = seat.row;
    const col = Number(seat.col);
    const key = `${row}-${col}`;

    if (seen.has(key)) continue;
    seen.add(key);

    const actualSeat = seatMap.get(key);
    if (!actualSeat) {
      throw createHttpError(
        `Ghế ${row}${col} không tồn tại trong phòng chiếu.`,
        400,
        "SEAT_NOT_FOUND"
      );
    }

    if (bookedSet.has(key)) {
      throw createHttpError(
        `Ghế ${row}${col} đã được đặt.`,
        409,
        "SEAT_ALREADY_BOOKED"
      );
    }

  const activeHold = getActiveHold(showtime.ShowtimeID, row, col);
  if (activeHold && activeHold.holdToken !== holdToken) {
    throw createHttpError(
      `Ghế ${row}${col} đang được giữ tạm bởi người dùng khác.`,
      409,
      "SEAT_ALREADY_HELD"
    );
  }

    const seatType = String(actualSeat.SeatType || "").toLowerCase();
    const normalizedType = seatType.includes("vip")
      ? "VIP"
      : seatType.includes("đôi") || seatType.includes("doi") || seatType.includes("couple")
      ? "Đôi"
      : "Thường";

    uniqueSelected.push({
      row,
      col,
      label: `${row}${col}`,
      type: normalizedType,
      surcharge: Number(actualSeat.SurchargeMultiplier || 1),
      price:
        Number(showtime.BasePrice || 0) *
        Number(actualSeat.SurchargeMultiplier || 1),
    });
  }

  const ticketTotal = uniqueSelected.reduce((sum, s) => sum + s.price, 0);

  const productMap = await getProducts(pool);
  const comboItems = [];

  for (const combo of selectedCombos || []) {
    const quantity = Number(combo.quantity || 0);
    if (quantity <= 0) continue;

    const product = productMap.get(combo.productId);
    if (!product) {
      throw new Error(`Sản phẩm ${combo.productId} không tồn tại.`);
    }

    comboItems.push({
      productId: product.ProductID,
      name: product.ProductName,
      quantity,
      unitPrice: Number(product.BasePrice || 0),
      subtotal: Number(product.BasePrice || 0) * quantity,
    });
  }

  const comboTotal = comboItems.reduce((sum, c) => sum + c.subtotal, 0);
  const subtotal = ticketTotal + comboTotal;

  let promoValid = true;
  let promoMessage = "";
  let voucher = null;
  let discountAmount = 0;
  let voucherId = null;

  if (promoCode) {
    voucher = await getVoucher(pool, promoCode);

    if (!voucher) {
      promoValid = false;
      promoMessage = "Mã giảm giá không tồn tại.";
    } else if (voucher.VoucherStatus !== "Active") {
      promoValid = false;
      promoMessage = "Voucher không còn hiệu lực.";
    } else if (
      voucher.VoucherExpiresAt &&
      new Date(voucher.VoucherExpiresAt) < new Date()
    ) {
      promoValid = false;
      promoMessage = "Voucher đã hết hạn.";
    } else {
      const minAmount = extractMinOrderAmount(voucher.VoucherApplyCondition);
      if (subtotal < minAmount) {
        promoValid = false;
        promoMessage = `Đơn hàng chưa đạt điều kiện áp dụng voucher.`;
      } else {
        voucherId = voucher.VoucherID;

        if (voucher.VoucherDiscountType === "Percent") {
          discountAmount = subtotal * (Number(voucher.VoucherValue || 0) / 100);
        } else {
          discountAmount = Number(voucher.VoucherValue || 0);
        }

        discountAmount = Math.min(discountAmount, subtotal);
        promoMessage = "Áp dụng voucher thành công.";
      }
    }
  }

  const grandTotal = Math.max(0, subtotal - discountAmount);

  return {
    showtime: {
      showtimeId: showtime.ShowtimeID,
      movieId: showtime.MovieID,
      roomNumber: showtime.RoomNumber,
      cinemaId: showtime.CinemaID,
      basePrice: Number(showtime.BasePrice || 0),
      startTime: showtime.ShowStartTime,
      language: showtime.ShowLanguage,
      format: showtime.ShowFormat,
      status: showtime.ShowStatus,
    },
    ticketItems: uniqueSelected,
    comboItems,
    ticketTotal,
    comboTotal,
    subtotal,
    discountAmount,
    grandTotal,
    promoValid,
    promoMessage,
    voucherId,
  };
}

async function validatePromotionService(payload) {
  const pool = await connectDB();
  const draft = await buildCheckoutDraft(pool, payload);

  return {
    valid: draft.promoValid,
    message: draft.promoMessage,
    voucherId: draft.voucherId,
    discountAmount: draft.discountAmount,
    ticketTotal: draft.ticketTotal,
    comboTotal: draft.comboTotal,
    subtotal: draft.subtotal,
    grandTotal: draft.grandTotal,
  };
}

async function getActivePromotionsService() {
  const pool = await connectDB();

  const result = await pool.request().query(`
    SELECT
      VoucherID,
      VoucherDiscountType,
      VoucherValue,
      VoucherApplyCondition,
      VoucherExpiresAt,
      VoucherStatus
    FROM VOUCHER
    WHERE VoucherStatus = 'Active'
      AND (VoucherExpiresAt IS NULL OR VoucherExpiresAt >= GETDATE())
    ORDER BY VoucherExpiresAt ASC, VoucherID ASC
  `);

  return result.recordset.map((voucher) => ({
    voucherId: voucher.VoucherID,
    discountType: voucher.VoucherDiscountType,
    value: Number(voucher.VoucherValue || 0),
    applyCondition: voucher.VoucherApplyCondition || "",
    expiresAt: voucher.VoucherExpiresAt,
    status: voucher.VoucherStatus,
  }));
}

async function calculatePriceService(payload) {
  const pool = await connectDB();
  const draft = await buildCheckoutDraft(pool, payload);

  return {
    validPromo: draft.promoValid,
    message: draft.promoMessage,
    voucherId: draft.voucherId,
    ticketTotal: draft.ticketTotal,
    comboTotal: draft.comboTotal,
    subtotal: draft.subtotal,
    discountAmount: draft.discountAmount,
    grandTotal: draft.grandTotal,
    ticketItems: draft.ticketItems,
    comboItems: draft.comboItems,
  };
}





async function holdSeatsService(payload) {
  const pool = await connectDB();

  const {
    showtimeId,
    selectedSeats = [],
    holdToken = null,
    holdMinutes = DEFAULT_HOLD_MINUTES,
  } = payload || {};

  if (!showtimeId) {
    throw createHttpError("Thiếu showtimeId.", 400, "MISSING_SHOWTIME_ID");
  }

  if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
    throw createHttpError("Vui lòng chọn ít nhất 1 ghế.", 400, "EMPTY_SELECTED_SEATS");
  }

  const draft = await buildCheckoutDraft(pool, {
    showtimeId,
    selectedSeats,
    holdToken,
  });

  const finalHoldToken = holdToken || createHoldToken();
  const expiresAt = new Date(
    Date.now() + Math.max(1, Number(holdMinutes || DEFAULT_HOLD_MINUTES)) * 60 * 1000
  );

  for (const seat of draft.ticketItems) {
    upsertSeatHold(
      draft.showtime.showtimeId,
      seat.row,
      seat.col,
      finalHoldToken,
      expiresAt
    );
  }

  return {
    message: "Giữ ghế tạm thời thành công.",
    holdToken: finalHoldToken,
    holdExpiresAt: expiresAt.toISOString(),
    heldSeats: draft.ticketItems.map((seat) => ({
      row: seat.row,
      col: seat.col,
      label: seat.label,
      type: seat.type,
    })),
  };
}

async function getBookingByOrderIdService(orderId) {
  const pool = await connectDB();

  const orderResult = await pool
    .request()
    .input("OrderID", sql.VarChar(20), orderId)
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
        pt.PaymentTransactionReferenceID
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
      WHERE o.OrderID = @OrderID
    `);

  const order = orderResult.recordset[0];
  if (!order) return null;

  const ticketResult = await pool
    .request()
    .input("OrderID", sql.VarChar(20), orderId)
    .query(`
      SELECT
        od.OrderDetailID,
        od.OrderDetailQuantity,
        od.OrderDetailUnitPrice,
        od.OrderDetailSubtotal,
        td.TicketDetailTicketType,
        td.TicketDetailTicketPrice,
        td.ShowtimeID,
        et.TicketID,
        et.ETicketQRCode,
        et.ETicketStatus,
        et.ETicketCheckInTime,
        et.RowIndex,
        et.ColumnNumber,
        et.RoomNumber,
        et.CinemaID,
        s.ShowStartTime,
        s.ShowLanguage,
        s.ShowFormat,
        m.MovieID,
        m.VnTitle,
        m.OriginTitle,
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
      WHERE od.OrderID = @OrderID
      ORDER BY et.RowIndex, et.ColumnNumber
    `);

  const comboResult = await pool
    .request()
    .input("OrderID", sql.VarChar(20), orderId)
    .query(`
      SELECT
        od.OrderDetailID,
        od.OrderDetailQuantity,
        od.OrderDetailUnitPrice,
        od.OrderDetailSubtotal,
        pd.ProductDetailProductNote,
        pd.ProductDetailSizeOption,
        pd.ProductID,
        p.ProductName
      FROM ORDER_DETAIL od
      JOIN PRODUCT_DETAIL pd
        ON pd.OrderDetailID = od.OrderDetailID
      JOIN PRODUCT p
        ON p.ProductID = pd.ProductID
      WHERE od.OrderID = @OrderID
      ORDER BY od.OrderDetailID
    `);

  const tickets = ticketResult.recordset.map((row) => ({
    orderDetailId: row.OrderDetailID,
    ticketId: row.TicketID,
    qrCode: row.ETicketQRCode,
    ticketStatus: row.ETicketStatus,
    checkInTime: row.ETicketCheckInTime,
    seat: {
      row: row.RowIndex,
      col: Number(row.ColumnNumber),
      label: `${row.RowIndex}${row.ColumnNumber}`,
    },
    type: row.TicketDetailTicketType,
    unitPrice: Number(row.TicketDetailTicketPrice || row.OrderDetailUnitPrice || 0),
    subtotal: Number(row.OrderDetailSubtotal || 0),
    showtime: {
      showtimeId: row.ShowtimeID,
      startTime: row.ShowStartTime,
      language: row.ShowLanguage,
      format: row.ShowFormat,
      roomNumber: row.RoomNumber,
    },
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
  }));

  const combos = comboResult.recordset.map((row) => ({
    orderDetailId: row.OrderDetailID,
    productId: row.ProductID,
    name: row.ProductName,
    quantity: Number(row.OrderDetailQuantity || 0),
    unitPrice: Number(row.OrderDetailUnitPrice || 0),
    subtotal: Number(row.OrderDetailSubtotal || 0),
    note: row.ProductDetailProductNote,
    sizeOption: row.ProductDetailSizeOption,
  }));

  const ticketTotal = tickets.reduce((sum, item) => sum + item.subtotal, 0);
  const comboTotal = combos.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = Number(order.DiscountAmount || 0);

  const firstTicket = tickets[0] || null;

  return {
    orderId: order.OrderID,
    orderStatus: Boolean(order.OrderStatus),
    orderDate: order.OrderDate,
    orderNote: order.OrderNote,
    totalAmount: Number(order.TotalAmount || 0),
    personId: order.PersonID,
    onlineOrder: {
      ticketIssuedAt: order.TicketIssuedAt,
      bookingPlatform: order.BookingPlatform,
      deliveryMethod: order.DeliveryMethod,
    },
    payment: {
      transactionId: order.TransactionID || null,
      amount: Number(order.PaymentTransactionAmount || 0),
      paymentTime: order.PaymentTransactionPaymentTime || null,
      paymentStatus: order.PaymentTransactionPaymentStatus || null,
      paymentMethod: order.PaymentTransactionMethod || null,
      referenceId: order.PaymentTransactionReferenceID || null,
    },
    voucher: order.VoucherID
      ? {
          voucherId: order.VoucherID,
          discountAmount,
        }
      : null,
    booking:
      firstTicket
        ? {
            movie: firstTicket.movie,
            cinema: firstTicket.cinema,
            showtime: firstTicket.showtime,
          }
        : null,
    tickets,
    combos,
    summary: {
      ticketTotal,
      comboTotal,
      discountAmount,
      grandTotal: Number(order.TotalAmount || 0),
    },
  };
}







async function confirmBookingService(payload) {
  const pool = await connectDB();
  const draft = await buildCheckoutDraft(pool, payload);

  if (payload?.promoCode && !draft.promoValid) {
  throw createHttpError(
    draft.promoMessage || "Voucher không hợp lệ.",
    400,
    "INVALID_VOUCHER"
  );
}

  const personId = payload?.personId || (await getFallbackPersonId(pool));
  const paymentMethod = normalizePaymentMethod(payload?.paymentMethod);

  const orderId = makeId("O");
  const transactionId = makeId("PT");

  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await new sql.Request(transaction)
      .input("OrderID", sql.VarChar(20), orderId)
      .input("OrderStatus", sql.Bit, 1)
      .input("OrderDate", sql.Date, new Date())
      .input("OrderNote", sql.NVarChar(255), payload?.orderNote || "Đặt vé online")
      .input("TotalAmount", sql.Int, Math.round(draft.grandTotal))
      .input("PersonID", sql.VarChar(20), personId)
      .query(`
        INSERT INTO [ORDER] (
          OrderID,
          OrderStatus,
          OrderDate,
          OrderNote,
          TotalAmount,
          PersonID
        )
        VALUES (
          @OrderID,
          @OrderStatus,
          @OrderDate,
          @OrderNote,
          @TotalAmount,
          @PersonID
        )
      `);

    await new sql.Request(transaction)
      .input("OrderID", sql.VarChar(20), orderId)
      .input("TicketIssuedAt", sql.Date, new Date())
      .input("BookingPlatform", sql.NVarChar(50), payload?.bookingPlatform || "Website")
      .input("DeliveryMethod", sql.NVarChar(50), payload?.deliveryMethod || "QR Code")
      .query(`
        INSERT INTO ONLINE_ORDER (
          OrderID,
          TicketIssuedAt,
          BookingPlatform,
          DeliveryMethod
        )
        VALUES (
          @OrderID,
          @TicketIssuedAt,
          @BookingPlatform,
          @DeliveryMethod
        )
      `);

    let detailIndex = 1;
    let ticketIndex = 1;

    for (const seat of draft.ticketItems) {
      const orderDetailId = makeId("OD", detailIndex++);

      await new sql.Request(transaction)
        .input("OrderDetailID", sql.VarChar(20), orderDetailId)
        .input("Quantity", sql.Int, 1)
        .input("UnitPrice", sql.Decimal(12, 2), seat.price)
        .input("Subtotal", sql.Decimal(12, 2), seat.price)
        .input("OrderID", sql.VarChar(20), orderId)
        .input("RequestID", sql.VarChar(20), null)
        .query(`
          INSERT INTO ORDER_DETAIL (
            OrderDetailID,
            OrderDetailQuantity,
            OrderDetailUnitPrice,
            OrderDetailSubtotal,
            OrderID,
            RequestID
          )
          VALUES (
            @OrderDetailID,
            @Quantity,
            @UnitPrice,
            @Subtotal,
            @OrderID,
            @RequestID
          )
        `);

      await new sql.Request(transaction)
        .input("OrderDetailID", sql.VarChar(20), orderDetailId)
        .input("TicketType", sql.NVarChar(50), seat.type)
        .input("TicketPrice", sql.Decimal(12, 2), seat.price)
        .input("ShowtimeID", sql.VarChar(20), draft.showtime.showtimeId)
        .query(`
          INSERT INTO TICKET_DETAIL (
            OrderDetailID,
            TicketDetailTicketType,
            TicketDetailTicketPrice,
            ShowtimeID
          )
          VALUES (
            @OrderDetailID,
            @TicketType,
            @TicketPrice,
            @ShowtimeID
          )
        `);

      const ticketId = makeId("TK", ticketIndex++);

      await new sql.Request(transaction)
        .input("TicketID", sql.VarChar(20), ticketId)
        .input("QRCode", sql.NVarChar(255), `QR-${ticketId}`)
        .input("TicketStatus", sql.NVarChar(30), "Issued")
        .input("CheckinTime", sql.DateTime, null)
        .input("OrderDetailID", sql.VarChar(20), orderDetailId)
        .input("RowIndex", sql.VarChar(5), seat.row)
        .input("ColumnNumber", sql.Int, seat.col)
        .input("RoomNumber", sql.VarChar(20), draft.showtime.roomNumber)
        .input("CinemaID", sql.VarChar(20), draft.showtime.cinemaId)
        .query(`
          INSERT INTO E_TICKET (
            TicketID,
            ETicketQRCode,
            ETicketStatus,
            ETicketCheckInTime,
            OrderDetailID,
            RowIndex,
            ColumnNumber,
            RoomNumber,
            CinemaID
          )
          VALUES (
            @TicketID,
            @QRCode,
            @TicketStatus,
            @CheckinTime,
            @OrderDetailID,
            @RowIndex,
            @ColumnNumber,
            @RoomNumber,
            @CinemaID
          )
        `);
    }

    for (const combo of draft.comboItems) {
      const orderDetailId = makeId("OD", detailIndex++);

      await new sql.Request(transaction)
        .input("OrderDetailID", sql.VarChar(20), orderDetailId)
        .input("Quantity", sql.Int, combo.quantity)
        .input("UnitPrice", sql.Decimal(12, 2), combo.unitPrice)
        .input("Subtotal", sql.Decimal(12, 2), combo.subtotal)
        .input("OrderID", sql.VarChar(20), orderId)
        .input("RequestID", sql.VarChar(20), null)
        .query(`
          INSERT INTO ORDER_DETAIL (
            OrderDetailID,
            OrderDetailQuantity,
            OrderDetailUnitPrice,
            OrderDetailSubtotal,
            OrderID,
            RequestID
          )
          VALUES (
            @OrderDetailID,
            @Quantity,
            @UnitPrice,
            @Subtotal,
            @OrderID,
            @RequestID
          )
        `);

      await new sql.Request(transaction)
        .input("OrderDetailID", sql.VarChar(20), orderDetailId)
        .input("ProductNote", sql.NVarChar(255), null)
        .input("SizeOption", sql.NVarChar(30), null)
        .input("ProductID", sql.VarChar(20), combo.productId)
        .query(`
          INSERT INTO PRODUCT_DETAIL (
            OrderDetailID,
            ProductDetailProductNote,
            ProductDetailSizeOption,
            ProductID
          )
          VALUES (
            @OrderDetailID,
            @ProductNote,
            @SizeOption,
            @ProductID
          )
        `);
    }

    if (draft.voucherId && draft.discountAmount > 0) {
      await new sql.Request(transaction)
        .input("VoucherID", sql.VarChar(20), draft.voucherId)
        .input("OrderID", sql.VarChar(20), orderId)
        .input("DiscountAmount", sql.Decimal(10, 2), draft.discountAmount)
        .query(`
          INSERT INTO APPLY (
            VoucherID,
            OrderID,
            DiscountAmount
          )
          VALUES (
            @VoucherID,
            @OrderID,
            @DiscountAmount
          )
        `);
    }

    const paymentSchemaResult = await new sql.Request(transaction).query(`
      SELECT CASE
        WHEN COL_LENGTH('PAYMENT_TRANSACTION', 'PaymentTransactionStatus') IS NULL
          THEN 0
        ELSE 1
      END AS HasPaymentTransactionStatus
    `);
    const hasPaymentTransactionStatus =
      Number(paymentSchemaResult.recordset[0]?.HasPaymentTransactionStatus || 0) === 1;

    const paymentRequest = new sql.Request(transaction)
      .input("TransactionID", sql.VarChar(20), transactionId)
      .input("Amount", sql.Decimal(12, 2), draft.grandTotal)
      .input("PaymentTime", sql.DateTime, new Date())
      .input("PaymentStatus", sql.NVarChar(30), "Paid")
      .input("PaymentMethod", sql.NVarChar(50), paymentMethod)
      .input("ReferenceID", sql.VarChar(100), `REF-${orderId}`)
      .input("OrderID", sql.VarChar(20), orderId);

    if (hasPaymentTransactionStatus) {
      await paymentRequest.query(`
        INSERT INTO PAYMENT_TRANSACTION (
          TransactionID,
          PaymentTransactionAmount,
          PaymentTransactionPaymentTime,
          PaymentTransactionPaymentStatus,
          PaymentTransactionStatus,
          PaymentTransactionMethod,
          PaymentTransactionReferenceID,
          OrderID
        )
        VALUES (
          @TransactionID,
          @Amount,
          @PaymentTime,
          @PaymentStatus,
          NULL,
          @PaymentMethod,
          @ReferenceID,
          @OrderID
        )
      `);
    } else {
      await paymentRequest.query(`
        INSERT INTO PAYMENT_TRANSACTION (
          TransactionID,
          PaymentTransactionAmount,
          PaymentTransactionPaymentTime,
          PaymentTransactionPaymentStatus,
          PaymentTransactionMethod,
          PaymentTransactionReferenceID,
          OrderID
        )
        VALUES (
          @TransactionID,
          @Amount,
          @PaymentTime,
          @PaymentStatus,
          @PaymentMethod,
          @ReferenceID,
          @OrderID
        )
      `);
    }

    await transaction.commit();

      if (payload?.holdToken) {
        releaseHoldByToken(payload.holdToken);
      }

      return {
        message: "Đặt vé thành công",
        orderId,
        transactionId,
        voucherId: draft.voucherId,
        ticketTotal: draft.ticketTotal,
        comboTotal: draft.comboTotal,
        discountAmount: draft.discountAmount,
        grandTotal: draft.grandTotal,
        paymentStatus: "Paid",
      };


  } catch (error) {
  if (transaction._aborted !== true) {
    await transaction.rollback();
  }

  // SQL Server duplicate key / unique constraint
  if (error?.number === 2627 || error?.number === 2601) {
    throw createHttpError(
      "Ghế vừa được người khác đặt hoặc giữ trước. Vui lòng chọn lại ghế.",
      409,
      "SEAT_CONFLICT"
    );
  }

  throw error;
}
}

module.exports = {
  validatePromotionService,
  getActivePromotionsService,
  holdSeatsService,
  calculatePriceService,
  confirmBookingService,
  getBookingByOrderIdService,
};
