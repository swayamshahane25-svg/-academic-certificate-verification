const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const dbDirectory = path.join(__dirname, "data");
fs.mkdirSync(dbDirectory, { recursive: true });

const dbPath = path.join(dbDirectory, "certichain.db");
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        id: this.lastID,
        changes: this.changes,
      });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row || null);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows || []);
    });
  });
}

const normalizeRole = (role) => String(role || "").trim().toUpperCase();
// Use lowercase status values to remain compatible with the legacy schema and CHECK constraints.
const normalizeStatus = (status) => String(status || "active").trim().toLowerCase();

const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@certichain.local").trim();
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";

async function ensureSeedAdmin() {
  const existingAdmin = await getUserByEmail(DEFAULT_ADMIN_EMAIL);
  if (existingAdmin) {
    return existingAdmin;
  }

  const passwordHash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);
  return createUser({
    name: "System Administrator",
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash,
    role: "ADMIN",
    university: "CertiChain Foundation",
    status: "ACTIVE",
  });
}

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'ISSUER', 'STUDENT')),
      university TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'PENDING', 'DISABLED')),
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // If the database was created before adding passwordUpdatedAt, add the column safely.
  try {
    const hasPasswordUpdated = await all("PRAGMA table_info('users')");
    const found = Array.isArray(hasPasswordUpdated) && hasPasswordUpdated.find((c) => c.name === 'passwordUpdatedAt');
    if (!found) {
      await run(`ALTER TABLE users ADD COLUMN passwordUpdatedAt TEXT`);
      // Backfill existing rows with the current timestamp
      await run(`UPDATE users SET passwordUpdatedAt = CURRENT_TIMESTAMP WHERE passwordUpdatedAt IS NULL`);
    }
  } catch (migrationError) {
    // Non-fatal migration errors should be logged but not block startup.
    console.warn('User table migration warning:', migrationError && migrationError.message);
  }

  await run(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      tokenHash TEXT NOT NULL UNIQUE,
      expiresAt TEXT NOT NULL,
      usedAt TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS certificate_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      certificateId TEXT NOT NULL UNIQUE,
      userId INTEGER,
      issuerId INTEGER,
      university TEXT,
      certificateHash TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'revoked', 'inactive')),
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (issuerId) REFERENCES users(id)
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS fraud_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      certificateId TEXT,
      riskLevel TEXT,
      riskScore INTEGER,
      summary TEXT,
      findings TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  await ensureSeedAdmin();

  return db;
}

async function createUser({ name, email, passwordHash, role, university, status = "ACTIVE" }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedRole = normalizeRole(role);
  const normalizedStatus = normalizeStatus(status);

  const result = await run(
    `
      INSERT INTO users (name, email, passwordHash, role, university, status, createdAt, updatedAt, passwordUpdatedAt)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    [
      String(name || "").trim(),
      normalizedEmail,
      passwordHash,
      normalizedRole,
      university || null,
      normalizedStatus,
    ]
  );

  return getUserById(result.id);
}

async function getUserByEmail(email) {
  if (!email) return null;

  return get(
    `SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
    [String(email).trim()]
  );
}

async function getUserById(id) {
  return get(`SELECT * FROM users WHERE id = ? LIMIT 1`, [id]);
}

async function listUsers() {
  return all(`
    SELECT id, name, email, role, university, status, createdAt, updatedAt, passwordUpdatedAt
    FROM users
    ORDER BY createdAt DESC
  `);
}

async function countUsersByRole(role) {
  const row = await get(
    `SELECT COUNT(*) AS total FROM users WHERE role = ? AND status != 'DISABLED'`,
    [normalizeRole(role)]
  );

  return Number(row?.total || 0);
}

async function countUsers() {
  const row = await get(`SELECT COUNT(*) AS total FROM users`);
  return Number(row?.total || 0);
}

async function updateUserRole(id, role) {
  await run(
    `UPDATE users SET role = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [normalizeRole(role), id]
  );

  return getUserById(id);
}

async function updateUserStatus(id, status) {
  const normalizedStatus = normalizeStatus(status);
  await run(
    `UPDATE users SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [normalizedStatus, id]
  );

  return getUserById(id);
}

async function updateUserPassword(id, passwordHash) {
  await run(
    `UPDATE users SET passwordHash = ?, passwordUpdatedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [passwordHash, id]
  );

  return getUserById(id);
}

async function createPasswordResetToken({ userId, tokenHash, expiresAt }) {
  return run(
    `INSERT INTO password_reset_tokens (userId, tokenHash, expiresAt, usedAt, createdAt) VALUES (?, ?, ?, NULL, CURRENT_TIMESTAMP)`,
    [userId, tokenHash, expiresAt]
  );
}

async function getPasswordResetTokenByHash(tokenHash) {
  return get(
    `SELECT * FROM password_reset_tokens WHERE tokenHash = ? LIMIT 1`,
    [tokenHash]
  );
}

async function markPasswordResetTokenUsed(id) {
  return run(
    `UPDATE password_reset_tokens SET usedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [id]
  );
}

async function invalidateUserPasswordTokens(userId) {
  return run(
    `UPDATE password_reset_tokens SET usedAt = CURRENT_TIMESTAMP WHERE userId = ? AND usedAt IS NULL`,
    [userId]
  );
}

async function createCertificateRecord({ certificateId, userId, issuerId, university, certificateHash, status = "active" }) {
  const record = await get(
    `SELECT * FROM certificate_records WHERE certificateId = ? LIMIT 1`,
    [certificateId]
  );

  if (record) {
    await run(
      `UPDATE certificate_records SET userId = ?, issuerId = ?, university = ?, certificateHash = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE certificateId = ?`,
      [userId || null, issuerId || null, university || null, certificateHash || null, status, certificateId]
    );

    return get(
      `SELECT * FROM certificate_records WHERE certificateId = ? LIMIT 1`,
      [certificateId]
    );
  }

  const result = await run(
    `
      INSERT INTO certificate_records (certificateId, userId, issuerId, university, certificateHash, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    [certificateId, userId || null, issuerId || null, university || null, certificateHash || null, status]
  );

  return get(`SELECT * FROM certificate_records WHERE id = ? LIMIT 1`, [result.id]);
}

async function getCertificateRecordsByUserId(userId) {
  return all(
    `SELECT * FROM certificate_records WHERE userId = ? ORDER BY createdAt DESC`,
    [userId]
  );
}

async function getCertificateRecordsByUniversity(university) {
  return all(
    `SELECT * FROM certificate_records WHERE university = ? ORDER BY createdAt DESC`,
    [university]
  );
}

async function listCertificateRecords() {
  return all(
    `SELECT * FROM certificate_records ORDER BY createdAt DESC`
  );
}

async function createFraudReport({ userId, certificateId, riskLevel, riskScore, summary, findings }) {
  return run(
    `
      INSERT INTO fraud_reports (userId, certificateId, riskLevel, riskScore, summary, findings, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)
    `,
    [userId || null, certificateId || null, riskLevel || null, riskScore || null, summary || null, findings ? JSON.stringify(findings) : null]
  );
}

async function listFraudReports() {
  return all(
    `SELECT * FROM fraud_reports ORDER BY createdAt DESC LIMIT 50`
  );
}

module.exports = {
  db,
  initializeDatabase,
  createUser,
  getUserByEmail,
  getUserById,
  listUsers,
  countUsersByRole,
  countUsers,
  updateUserRole,
  updateUserStatus,
  updateUserPassword,
  createPasswordResetToken,
  getPasswordResetTokenByHash,
  markPasswordResetTokenUsed,
  invalidateUserPasswordTokens,
  createCertificateRecord,
  getCertificateRecordsByUserId,
  getCertificateRecordsByUniversity,
  listCertificateRecords,
  createFraudReport,
  listFraudReports,
  normalizeStatus,
  normalizeRole,
};
