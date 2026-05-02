const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { connectDB, sql } = require("../config/db");

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "movieticket_access_secret_dev";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "movieticket_refresh_secret_dev";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function makeId(prefix) {
  const stamp = Date.now().toString().slice(-8);
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}${stamp}${random}`.slice(0, 20);
}

function splitFullName(fullName) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { fName: "", minit: null, lName: "" };
  }

  if (parts.length === 1) {
    return { fName: parts[0], minit: null, lName: parts[0] };
  }

  if (parts.length === 2) {
    return { fName: parts[0], minit: null, lName: parts[1] };
  }

  return {
    fName: parts[0],
    minit: parts.slice(1, -1).join(" "),
    lName: parts[parts.length - 1],
  };
}

function buildFullName(row) {
  return [row.FName, row.Minit, row.LName].filter(Boolean).join(" ").trim();
}

function buildAddressObject(row) {
  return {
    houseNo: row.PersonHouseNo || "",
    street: row.PersonStreet || "",
    ward: row.PersonWard || "",
    city: row.PersonCity || "",
    fullAddress: [
      row.PersonHouseNo,
      row.PersonStreet,
      row.PersonWard,
      row.PersonCity,
    ]
      .filter(Boolean)
      .join(", "),
  };
}

function getRank(points) {
  const currentPoints = Number(points || 0);

  if (currentPoints >= 2000) return "Diamond";
  if (currentPoints >= 1000) return "Gold";
  if (currentPoints >= 500) return "Silver";
  return "Bronze";
}

function isBcryptHash(value) {
  return typeof value === "string" && value.startsWith("$2");
}

function normalizeAccountStatus(value) {
  if (typeof value === "string") return value;
  return Number(value) === 1 ? "Active" : "Inactive";
}

function isAccountActive(value) {
  if (typeof value === "string") {
    return value.toLowerCase() === "active";
  }
  return Number(value) === 1;
}

function issueAccessToken(user) {
  return jwt.sign(
    {
      sub: user.personId,
      personId: user.personId,
      customerId: user.customerId,
      username: user.username,
      role: user.role,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

function issueRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.personId,
      personId: user.personId,
      customerId: user.customerId,
      username: user.username,
      role: user.role,
      type: "refresh",
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

function mapUser(row) {
  const address = buildAddressObject(row);
  const currentPoints = Number(row.CurrentPoints || 0);

  return {
    personId: row.PersonID,
    customerId: row.CustomerID,
    username: row.Username,
    fullName: buildFullName(row),
    email: row.Email || row.PersonEmail || "",
    phone: row.PersonPhone || "",
    dateOfBirth: row.PersonDOB || null,
    gender: row.PersonGender || "",
    address,
    currentPoints,
    rank: getRank(currentPoints),
    accountStatus: normalizeAccountStatus(row.AccountStatus),
    registrationDate: row.RegistrationDate || null,
    role: "registered_customer",
  };
}

async function getRawUserByIdentifier(pool, identifier) {
  const normalized = String(identifier || "").trim();

  const result = await pool
    .request()
    .input("Identifier", sql.NVarChar(100), normalized)
    .query(`
      SELECT
        rc.PersonID,
        c.CustomerID,
        rc.Username,
        rc.Email,
        rc.Password,
        rc.RegistrationDate,
        rc.CurrentPoints,
        rc.AccountStatus,
        p.FName,
        p.Minit,
        p.LName,
        p.PersonDOB,
        p.PersonGender,
        p.PersonEmail,
        p.PersonPhone,
        p.PersonHouseNo,
        p.PersonStreet,
        p.PersonWard,
        p.PersonCity
      FROM REGISTERED_CUSTOMER rc
      JOIN CUSTOMER c
        ON c.PersonID = rc.PersonID
      JOIN PERSON p
        ON p.PersonID = rc.PersonID
      WHERE rc.Username = @Identifier
         OR rc.Email = @Identifier
    `);

  return result.recordset[0] || null;
}

async function getRawUserByPersonId(pool, personId) {
  const result = await pool
    .request()
    .input("PersonID", sql.VarChar(20), personId)
    .query(`
      SELECT
        rc.PersonID,
        c.CustomerID,
        rc.Username,
        rc.Email,
        rc.Password,
        rc.RegistrationDate,
        rc.CurrentPoints,
        rc.AccountStatus,
        p.FName,
        p.Minit,
        p.LName,
        p.PersonDOB,
        p.PersonGender,
        p.PersonEmail,
        p.PersonPhone,
        p.PersonHouseNo,
        p.PersonStreet,
        p.PersonWard,
        p.PersonCity
      FROM REGISTERED_CUSTOMER rc
      JOIN CUSTOMER c
        ON c.PersonID = rc.PersonID
      JOIN PERSON p
        ON p.PersonID = rc.PersonID
      WHERE rc.PersonID = @PersonID
    `);

  return result.recordset[0] || null;
}

async function ensureUniqueRegisterFields(pool, username, email) {
  const result = await pool
    .request()
    .input("Username", sql.VarChar(20), username)
    .input("Email", sql.NVarChar(100), email)
    .query(`
      SELECT TOP 1 Username, Email
      FROM REGISTERED_CUSTOMER
      WHERE Username = @Username
         OR Email = @Email
    `);

  const existed = result.recordset[0];
  if (!existed) return;

  if (existed.Username === username) {
    throw createError("Tên đăng nhập đã tồn tại.", 409);
  }

  if (existed.Email === email) {
    throw createError("Email đã được sử dụng.", 409);
  }
}

async function maybeUpgradeLegacyPassword(pool, personId, plainPassword) {
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  await pool
    .request()
    .input("PersonID", sql.VarChar(20), personId)
    .input("Password", sql.VarChar(255), passwordHash)
    .query(`
      UPDATE REGISTERED_CUSTOMER
      SET Password = @Password
      WHERE PersonID = @PersonID
    `);
}

async function verifyPassword(pool, rawUser, inputPassword) {
  const storedPassword = rawUser.Password;

  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(inputPassword, storedPassword);
  }

  const matched = String(storedPassword) === String(inputPassword);

  if (matched) {
    await maybeUpgradeLegacyPassword(pool, rawUser.PersonID, inputPassword);
  }

  return matched;
}

function buildAuthResponse(rawUser) {
  const user = mapUser(rawUser);
  const accessToken = issueAccessToken(user);
  const refreshToken = issueRefreshToken(user);

  return {
    message: "Thành công",
    accessToken,
    refreshToken,
    user,
  };
}

async function registerService(payload) {
  const pool = await connectDB();

  const {
    username,
    password,
    fullName,
    email,
    phone,
    dateOfBirth,
    gender,
    houseNo = "",
    street,
    ward,
    city,
  } = payload || {};

  if (
    !username ||
    !password ||
    !fullName ||
    !email ||
    !phone ||
    !dateOfBirth ||
    !gender ||
    !street ||
    !ward ||
    !city
  ) {
    throw createError("Vui lòng điền đầy đủ thông tin đăng ký.", 400);
  }

  if (String(phone).trim().length !== 10) {
    throw createError("Số điện thoại phải có đúng 10 chữ số.", 400);
  }

  const normalizedUsername = String(username).trim();
  const normalizedEmail = String(email).trim().toLowerCase();

  await ensureUniqueRegisterFields(pool, normalizedUsername, normalizedEmail);

  const { fName, minit, lName } = splitFullName(fullName);
  const passwordHash = await bcrypt.hash(String(password), 10);

  const personId = makeId("P");
  const customerId = makeId("C");

  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await new sql.Request(transaction)
      .input("PersonID", sql.VarChar(20), personId)
      .input("FName", sql.NVarChar(50), fName)
      .input("Minit", sql.NVarChar(50), minit || null)
      .input("LName", sql.NVarChar(50), lName)
      .input("PersonDOB", sql.Date, dateOfBirth)
      .input("PersonGender", sql.NVarChar(10), gender)
      .input("PersonEmail", sql.NVarChar(100), normalizedEmail)
      .input("PersonPhone", sql.VarChar(10), String(phone).trim())
      .input("PersonHouseNo", sql.NVarChar(20), houseNo || null)
      .input("PersonStreet", sql.NVarChar(100), street)
      .input("PersonWard", sql.NVarChar(100), ward)
      .input("PersonCity", sql.NVarChar(100), city)
      .query(`
        INSERT INTO PERSON (
          PersonID,
          FName,
          Minit,
          LName,
          PersonDOB,
          PersonGender,
          PersonEmail,
          PersonPhone,
          PersonHouseNo,
          PersonStreet,
          PersonWard,
          PersonCity
        )
        VALUES (
          @PersonID,
          @FName,
          @Minit,
          @LName,
          @PersonDOB,
          @PersonGender,
          @PersonEmail,
          @PersonPhone,
          @PersonHouseNo,
          @PersonStreet,
          @PersonWard,
          @PersonCity
        )
      `);

    await new sql.Request(transaction)
      .input("PersonID", sql.VarChar(20), personId)
      .input("CustomerID", sql.VarChar(20), customerId)
      .query(`
        INSERT INTO CUSTOMER (
          PersonID,
          CustomerID
        )
        VALUES (
          @PersonID,
          @CustomerID
        )
      `);

    await new sql.Request(transaction)
      .input("PersonID", sql.VarChar(20), personId)
      .input("Username", sql.VarChar(20), normalizedUsername)
      .input("Email", sql.NVarChar(100), normalizedEmail)
      .input("Password", sql.VarChar(255), passwordHash)
      .input("RegistrationDate", sql.Date, new Date())
      .input("CurrentPoints", sql.Int, 0)
      .input("AccountStatus", sql.Bit, 1)
      .query(`
        INSERT INTO REGISTERED_CUSTOMER (
          PersonID,
          Username,
          Email,
          Password,
          RegistrationDate,
          CurrentPoints,
          AccountStatus
        )
        VALUES (
          @PersonID,
          @Username,
          @Email,
          @Password,
          @RegistrationDate,
          @CurrentPoints,
          @AccountStatus
        )
      `);

    await transaction.commit();
  } catch (error) {
    if (transaction._aborted !== true) {
      await transaction.rollback();
    }
    throw error;
  }

  const rawUser = await getRawUserByPersonId(pool, personId);
  const response = buildAuthResponse(rawUser);
  response.message = "Đăng ký thành công";

  return response;
}

async function loginService(payload) {
  const pool = await connectDB();

  const identifier = String(
    payload?.identifier || payload?.username || payload?.email || ""
  ).trim();
  const password = String(payload?.password || "");

  if (!identifier || !password) {
    throw createError("Vui lòng nhập tên đăng nhập/email và mật khẩu.", 400);
  }

  const rawUser = await getRawUserByIdentifier(pool, identifier);

  if (!rawUser) {
    throw createError("Tài khoản không tồn tại.", 401);
  }

  if (!isAccountActive(rawUser.AccountStatus)) {
    throw createError("Tài khoản đã bị khóa.", 403);
  }

  const matched = await verifyPassword(pool, rawUser, password);

  if (!matched) {
    throw createError("Sai mật khẩu.", 401);
  }

  const refreshedUser = await getRawUserByPersonId(pool, rawUser.PersonID);
  const response = buildAuthResponse(refreshedUser);
  response.message = "Đăng nhập thành công";

  return response;
}

async function refreshService(payload) {
  const refreshToken = payload?.refreshToken;

  if (!refreshToken) {
    throw createError("Thiếu refresh token.", 400);
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, REFRESH_SECRET);
  } catch (error) {
    throw createError("Refresh token không hợp lệ hoặc đã hết hạn.", 401);
  }

  if (decoded?.type !== "refresh") {
    throw createError("Refresh token không hợp lệ.", 401);
  }

  const pool = await connectDB();
  const rawUser = await getRawUserByPersonId(pool, decoded.personId || decoded.sub);

  if (!rawUser) {
    throw createError("Không tìm thấy người dùng.", 404);
  }

  if (!isAccountActive(rawUser.AccountStatus)) {
    throw createError("Tài khoản đã bị khóa.", 403);
  }

  const response = buildAuthResponse(rawUser);
  response.message = "Làm mới phiên đăng nhập thành công";

  return response;
}

async function logoutService() {
  return {
    message: "Đăng xuất thành công",
  };
}

async function getMeService(personId) {
  const pool = await connectDB();
  const rawUser = await getRawUserByPersonId(pool, personId);

  if (!rawUser) {
    throw createError("Không tìm thấy người dùng.", 404);
  }

  return {
    user: mapUser(rawUser),
  };
}

module.exports = {
  registerService,
  loginService,
  refreshService,
  logoutService,
  getMeService,
};