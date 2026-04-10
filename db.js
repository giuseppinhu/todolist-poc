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
      priority ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
      createdAt DATETIME NOT NULL
    )
  `);

  const [priorityColumn] = await pool.query(
    "SHOW COLUMNS FROM todos LIKE 'priority'"
  );

  if (priorityColumn.length === 0) {
    await pool.query(
      "ALTER TABLE todos ADD COLUMN priority ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium' AFTER done"
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS backlog_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(80) NOT NULL,
      details TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function writeBacklog(action, details) {
  await pool.query("INSERT INTO backlog_logs (action, details) VALUES (?, ?)", [
    action,
    details || null,
  ]);
}

async function listBacklog(limit = 50) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const [rows] = await pool.query(
    "SELECT id, action, details, createdAt FROM backlog_logs ORDER BY createdAt DESC LIMIT ?",
    [safeLimit]
  );

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    details: row.details,
    createdAt: new Date(row.createdAt).toISOString(),
  }));
}

module.exports = { pool, ensureSchema, writeBacklog, listBacklog };
