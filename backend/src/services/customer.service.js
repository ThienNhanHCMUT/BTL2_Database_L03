const { connectDB, sql } = require("../config/db");

const CUSTOMER_NET_VALUE_FUNCTION =
  process.env.CUSTOMER_NET_VALUE_FUNCTION || "dbo.fn_CalculateCustomerNetValue";

function createHttpError(
  message,
  statusCode = 400,
  code = "BUSINESS_ERROR",
  fieldErrors = null
) {
  const error = new Error(message);
  error.status = statusCode;
  error.statusCode = statusCode;
  error.code = code;
  if (fieldErrors) error.fieldErrors = fieldErrors;
  return error;
}

function normalizeRoutineName(value, fallback) {
  const raw = String(value || fallback).trim();
  const name = raw || fallback;
  const valid = /^[A-Za-z_][\w$#]*(\.[A-Za-z_][\w$#]*)?$/.test(name);
  const safeName = valid ? name : fallback;

  return safeName.includes(".") ? safeName : `dbo.${safeName}`;
}

async function getPool() {
  try {
    return await connectDB();
  } catch (error) {
    throw createHttpError(
      "Không thể kết nối cơ sở dữ liệu.",
      503,
      "DB_CONNECTION_ERROR"
    );
  }
}

function normalizeDate(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function validateCustomerNetValueQuery(query = {}) {
  const fieldErrors = {};

  const personId = String(query.personId || query.PersonID || "").trim();
  const fromDate = normalizeDate(query.fromDate || query.FromDate);
  const toDate = normalizeDate(query.toDate || query.ToDate);

  if (!personId) {
    fieldErrors.personId = "Vui lòng nhập PersonID.";
  } else if (personId.length > 20) {
    fieldErrors.personId = "PersonID tối đa 20 ký tự.";
  }

  if (!fromDate) {
    fieldErrors.fromDate = "Vui lòng chọn FromDate.";
  }

  if (!toDate) {
    fieldErrors.toDate = "Vui lòng chọn ToDate.";
  }

  if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
    fieldErrors.toDate = "ToDate phải lớn hơn hoặc bằng FromDate.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw createHttpError(
      "Tham số tính giá trị khách hàng chưa hợp lệ.",
      400,
      "VALIDATION_ERROR",
      fieldErrors
    );
  }

  return {
    personId,
    fromDate,
    toDate,
  };
}

async function getCustomerNetValueService(query = {}) {
  const filters = validateCustomerNetValueQuery(query);
  const pool = await getPool();
  const routine = normalizeRoutineName(
    CUSTOMER_NET_VALUE_FUNCTION,
    "dbo.fn_CalculateCustomerNetValue"
  );

  try {
    const result = await pool
      .request()
      .input("PersonID", sql.VarChar(20), filters.personId)
      .input("FromDate", sql.Date, filters.fromDate)
      .input("ToDate", sql.Date, filters.toDate)
      .query(`
        SELECT ${routine}(@PersonID, @FromDate, @ToDate) AS NetValue;
      `);

    const row = result.recordset?.[0] || {};
    const rawNetValue = row.NetValue;

    return {
      routine,
      source: "sql_function",
      personId: filters.personId,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      netValue:
        rawNetValue === null || rawNetValue === undefined
          ? null
          : Number(rawNetValue),
    };
  } catch (error) {
    console.error("[customer.service] getCustomerNetValueService error", {
      message: error?.message,
      number: error?.number,
      code: error?.code,
    });

    throw createHttpError(
      error?.message || "Không thể tính giá trị khách hàng.",
      500,
      "CUSTOMER_NET_VALUE_FAILED"
    );
  }
}

module.exports = {
  getCustomerNetValueService,
};