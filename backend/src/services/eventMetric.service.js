const { connectDB, sql } = require("../config/db");

function buildError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeSqlError(error) {
  const message =
    error?.originalError?.info?.message ||
    error?.message ||
    "Lỗi SQL Server khi tính toán chỉ số sự kiện.";

  const normalized = new Error(message);
  normalized.statusCode = 400;
  return normalized;
}

async function getEventMetricsService(eventId) {
  const cleanEventId = String(eventId || "").trim();

  if (!cleanEventId) {
    throw buildError("EventID không được để trống.", 400);
  }

  if (cleanEventId.length > 20) {
    throw buildError("EventID tối đa 20 ký tự.", 400);
  }

  const pool = await connectDB();

  try {
    const result = await pool
      .request()
      .input("EventID", sql.VarChar(20), cleanEventId)
      .query(`
        SELECT
          e.EventID,
          dbo.fn_Event_TotalConfirmedRentalFee(e.EventID) AS TotalConfirmedRentalFee,
          dbo.fn_Event_CapacityCoverageLabel(e.EventID) AS CapacityCoverageLabel
        FROM EVENT e
        WHERE e.EventID = @EventID
      `);

    const row = result.recordset[0];

    if (!row) {
      throw buildError("Không tìm thấy sự kiện.", 404);
    }

    return {
      eventId: row.EventID,
      totalConfirmedRentalFee: Number(row.TotalConfirmedRentalFee || 0),
      capacityCoverageLabel: row.CapacityCoverageLabel || "",
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw normalizeSqlError(error);
  }
}

module.exports = {
  getEventMetricsService,
};