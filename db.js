const mysql = require("mysql2/promise");

function getEnv(name, fallback) {
  return process.env[name] || process.env[`FILESS_MYSQL_${name.replace("MYSQL_", "")}`] || fallback;
}

function getDbConfig() {
  return {
    host: getEnv("MYSQL_HOST", "127.0.0.1"),
    port: Number(getEnv("MYSQL_PORT", "3306")),
    user: getEnv("MYSQL_USER", "root"),
    password: getEnv("MYSQL_PASSWORD", ""),
    database: getEnv("MYSQL_DATABASE", "taskflow"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

const pool = mysql.createPool(getDbConfig());

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(120) NOT NULL,
      done TINYINT(1) NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL
    )
  `);
}

module.exports = { pool, ensureSchema };
