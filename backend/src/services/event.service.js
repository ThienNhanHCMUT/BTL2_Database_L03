const { connectDB, sql } = require("../config/db");

const EVENT_STATUSES = ["Chờ duyệt", "Đã duyệt", "Từ chối", "Đã hoàn thành"];

function toDateOnly(value) {
  if (!value) return null;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return d.toISOString().slice(0, 10);
}

function mapEventRow(row) {
  return {
    eventId: row.EventID,
    organizerId: row.OrganizerID,
    eventName: row.EventName,
    eventDesc: row.EventDesc || "",
    eventStartDate: toDateOnly(row.EventStartDate),
    eventEndDate: toDateOnly(row.EventEndDate),
    expectedScale: row.ExpectedScale,
    totalBudget: Number(row.TotalBudget || 0),
    eventStatus: row.EventStatus,
    orgName: row.OrgName || null,
    organizerType: row.OrganizerType || null,
    confirmedSessionCount: Number(row.ConfirmedSessionCount || 0),
  };
}

function buildBadRequest(message, fieldErrors = null) {
  const error = new Error(message);
  error.statusCode = 400;
  error.fieldErrors = fieldErrors;
  return error;
}

function normalizeSqlError(error) {
  const msg = error?.originalError?.info?.message || error?.message || "Lỗi SQL Server.";

  const normalized = new Error(msg);
  normalized.statusCode = 400;
  normalized.fieldErrors = null;

  return normalized;
}

function validatePayload(payload, editing = false) {
  const errors = {};

  const eventId = String(payload.EventID || "").trim();
  const organizerId = String(payload.OrganizerID || "").trim();
  const eventName = String(payload.EventName || "").trim();
  const eventStartDate = payload.EventStartDate;
  const eventEndDate = payload.EventEndDate;
  const expectedScale = Number(payload.ExpectedScale);
  const totalBudget = payload.TotalBudget === "" || payload.TotalBudget == null
    ? 0
    : Number(payload.TotalBudget);
  const eventStatus = String(payload.EventStatus || "").trim();

  if (!eventId) errors.EventID = "Mã sự kiện không được để trống.";
  if (eventId.length > 20) errors.EventID = "Mã sự kiện tối đa 20 ký tự.";

  if (!organizerId) errors.OrganizerID = "Mã nhà tổ chức không được để trống.";
  if (organizerId.length > 20) errors.OrganizerID = "Mã nhà tổ chức tối đa 20 ký tự.";

  if (!eventName) errors.EventName = "Tên sự kiện không được để trống.";
  if (eventName.length > 200) errors.EventName = "Tên sự kiện tối đa 200 ký tự.";

  if (!eventStartDate) errors.EventStartDate = "Ngày bắt đầu là bắt buộc.";
  if (!eventEndDate) errors.EventEndDate = "Ngày kết thúc là bắt buộc.";
  if (eventStartDate && eventEndDate && eventEndDate < eventStartDate) {
    errors.EventEndDate = "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.";
  }

  if (!Number.isInteger(expectedScale) || expectedScale <= 0) {
    errors.ExpectedScale = "Quy mô dự kiến phải là số nguyên lớn hơn 0.";
  }

  if (Number.isNaN(totalBudget) || totalBudget < 0) {
    errors.TotalBudget = "Tổng ngân sách phải là số không âm.";
  }

  if (!EVENT_STATUSES.includes(eventStatus)) {
    errors.EventStatus = "Trạng thái sự kiện không hợp lệ.";
  }

  if (Object.keys(errors).length > 0) {
    throw buildBadRequest("Dữ liệu sự kiện không hợp lệ.", errors);
  }

  return {
    EventID: eventId,
    OrganizerID: organizerId,
    EventName: eventName,
    EventDesc: payload.EventDesc || null,
    EventStartDate: eventStartDate,
    EventEndDate: eventEndDate,
    ExpectedScale: expectedScale,
    TotalBudget: totalBudget,
    EventStatus: eventStatus,
  };
}

async function getEventsService(query) {
  const pool = await connectDB();

  const keyword = String(query.keyword || query.Keyword || "").trim();
  const eventStatus = String(query.eventStatus || query.EventStatus || "").trim();
  const fromDate = query.fromDate || query.FromDate || null;
  const toDate = query.toDate || query.ToDate || null;

  const request = pool.request();

  let sqlQuery = `
    SELECT
      e.EventID,
      e.OrganizerID,
      e.EventName,
      e.EventDesc,
      e.EventStartDate,
      e.EventEndDate,
      e.ExpectedScale,
      e.TotalBudget,
      e.EventStatus,
      o.OrgName,
      o.OrganizerType,
      ISNULL(confirmed.ConfirmedSessionCount, 0) AS ConfirmedSessionCount
    FROM EVENT e
    LEFT JOIN ORGANIZER o
      ON o.OrganizerID = e.OrganizerID
    OUTER APPLY (
      SELECT COUNT(*) AS ConfirmedSessionCount
      FROM SESSION s
      WHERE s.EventID = e.EventID
        AND s.SessionStatus = N'Đã xác nhận'
    ) confirmed
    WHERE 1 = 1
  `;

  if (keyword) {
    request.input("Keyword", sql.NVarChar(200), `%${keyword}%`);
    sqlQuery += `
      AND (
           e.EventID LIKE @Keyword
        OR e.EventName LIKE @Keyword
        OR o.OrgName LIKE @Keyword
      )
    `;
  }

  if (eventStatus) {
    request.input("EventStatus", sql.NVarChar(20), eventStatus);
    sqlQuery += `
      AND e.EventStatus = @EventStatus
    `;
  }

  if (fromDate) {
    request.input("FromDate", sql.Date, fromDate);
    sqlQuery += `
      AND e.EventStartDate >= @FromDate
    `;
  }

  if (toDate) {
    request.input("ToDate", sql.Date, toDate);
    sqlQuery += `
      AND e.EventStartDate <= @ToDate
    `;
  }

  sqlQuery += `
    ORDER BY e.EventStartDate DESC, e.EventID ASC
  `;

  const result = await request.query(sqlQuery);
  return result.recordset.map(mapEventRow);
}

async function createEventService(payload) {
  const pool = await connectDB();
  const data = validatePayload(payload, false);

  try {
    const result = await pool
      .request()
      .input("EventID", sql.VarChar(20), data.EventID)
      .input("OrganizerID", sql.VarChar(20), data.OrganizerID)
      .input("EventName", sql.NVarChar(200), data.EventName)
      .input("EventDesc", sql.NVarChar(sql.MAX), data.EventDesc)
      .input("EventStartDate", sql.Date, data.EventStartDate)
      .input("EventEndDate", sql.Date, data.EventEndDate)
      .input("ExpectedScale", sql.Int, data.ExpectedScale)
      .input("TotalBudget", sql.Decimal(15, 2), data.TotalBudget)
      .input("EventStatus", sql.NVarChar(20), data.EventStatus)
      .execute("usp_Event_Insert");

    return mapEventRow(result.recordset[0]);
  } catch (error) {
    throw normalizeSqlError(error);
  }
}

async function updateEventService(eventId, payload) {
  const pool = await connectDB();

  const mergedPayload = {
    ...payload,
    EventID: eventId || payload.EventID,
  };

  const data = validatePayload(mergedPayload, true);

  try {
    const result = await pool
      .request()
      .input("EventID", sql.VarChar(20), data.EventID)
      .input("OrganizerID", sql.VarChar(20), data.OrganizerID)
      .input("EventName", sql.NVarChar(200), data.EventName)
      .input("EventDesc", sql.NVarChar(sql.MAX), data.EventDesc)
      .input("EventStartDate", sql.Date, data.EventStartDate)
      .input("EventEndDate", sql.Date, data.EventEndDate)
      .input("ExpectedScale", sql.Int, data.ExpectedScale)
      .input("TotalBudget", sql.Decimal(15, 2), data.TotalBudget)
      .input("EventStatus", sql.NVarChar(20), data.EventStatus)
      .execute("usp_Event_Update");

    return mapEventRow(result.recordset[0]);
  } catch (error) {
    throw normalizeSqlError(error);
  }
}

async function deleteEventService(eventId) {
  if (!eventId) {
    throw buildBadRequest("Thiếu mã sự kiện cần xóa.");
  }

  const pool = await connectDB();

  try {
    const result = await pool
      .request()
      .input("EventID", sql.VarChar(20), eventId)
      .execute("usp_Event_Delete");

    return result.recordset[0] || {
      message: "Đã xóa sự kiện thành công.",
      eventId,
    };
  } catch (error) {
    throw normalizeSqlError(error);
  }
}

module.exports = {
  getEventsService,
  createEventService,
  updateEventService,
  deleteEventService,
};