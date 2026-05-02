const { connectDB, sql } = require("../config/db");

function normalizeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

function normalizeInt(value, fallback = 1) {
  const n = Number(value);
  return Number.isInteger(n) ? n : fallback;
}

function mapOrganizerSummaryRow(row) {
  return {
    organizerId: row.OrganizerID,
    orgName: row.OrgName,
    organizerType: row.OrganizerType,
    eventCount: Number(row.EventCount || 0),
    totalPlannedBudget: Number(row.TotalPlannedBudget || 0),
    totalConfirmedRentalFee: Number(row.TotalConfirmedRentalFee || 0),
    totalConfirmedSessionCount: Number(row.TotalConfirmedSessionCount || 0),
  };
}

function normalizeSqlError(error) {
  const message =
    error?.originalError?.info?.message ||
    error?.message ||
    "Lỗi SQL Server khi tải tổng hợp nhà tổ chức.";

  const normalized = new Error(message);
  normalized.statusCode = 400;
  return normalized;
}

async function getOrganizerEventSummaryService(query = {}) {
  const pool = await connectDB();

  const eventStatus = String(
    query.EventStatus || query.eventStatus || ""
  ).trim();

  const budgetFloor = normalizeNumber(
    query.BudgetFloor ?? query.budgetFloor,
    0
  );

  const minEventCount = normalizeInt(
    query.MinEventCount ?? query.minEventCount,
    1
  );

  const minConfirmedRentalFee = normalizeNumber(
    query.MinConfirmedRentalFee ?? query.minConfirmedRentalFee,
    0
  );

  try {
    const result = await pool
      .request()
      .input(
        "EventStatus",
        sql.NVarChar(20),
        eventStatus === "" ? null : eventStatus
      )
      .input("BudgetFloor", sql.Decimal(15, 2), budgetFloor)
      .input("MinEventCount", sql.Int, minEventCount)
      .input("MinConfirmedRentalFee", sql.Decimal(15, 2), minConfirmedRentalFee)
      .execute("dbo.usp_Organizer_Event_Summary");

    return result.recordset.map(mapOrganizerSummaryRow);
  } catch (error) {
    throw normalizeSqlError(error);
  }
}

module.exports = {
  getOrganizerEventSummaryService,
};