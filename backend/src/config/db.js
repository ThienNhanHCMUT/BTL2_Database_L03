const sql = require("mssql");
require("dotenv").config({ quiet: true });

const [serverHost, instanceName] = String(
  process.env.DB_SERVER || "localhost"
).split("\\");

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: serverHost,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    ...(instanceName ? { instanceName } : {})
  }
};

if (!instanceName) {
  dbConfig.port = Number(process.env.DB_PORT || 1433);
}

let pool;

async function connectDB() {
  try {
    if (!pool) {
      pool = await sql.connect(dbConfig);
      console.log("Connected to SQL Server");
    }
    return pool;
  } catch (error) {
    console.error("DB connection error:", error);
    throw error;
  }
}

module.exports = { sql, connectDB };
