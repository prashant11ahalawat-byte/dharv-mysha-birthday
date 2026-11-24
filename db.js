const path = require('path');
const config = require('./config');

let dbInstance = null;
let adapter = null; // 'better-sqlite3' or 'node:sqlite'

function initDB() {
  const dbFile = path.resolve(__dirname, config.DB_PATH);

  try {
    const Database = require('better-sqlite3');
    const db = new Database(dbFile);
    db.pragma('journal_mode = WAL');
    adapter = 'better-sqlite3';
    dbInstance = db;
  } catch (err) {
    try {
      const { DatabaseSync } = require('node:sqlite');
      const db = new DatabaseSync(dbFile);
      adapter = 'node:sqlite';
      dbInstance = db;
    } catch (innerErr) {
      console.error('Failed to initialize SQLite database with either better-sqlite3 or node:sqlite:', innerErr);
      throw innerErr;
    }
  }

  // Create table if not exists
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      attending INTEGER NOT NULL,
      adults INTEGER NOT NULL DEFAULT 0,
      kids INTEGER NOT NULL DEFAULT 0,
      total_guests INTEGER NOT NULL DEFAULT 0,
      phone TEXT DEFAULT '',
      message TEXT DEFAULT '',
      created_at TEXT NOT NULL
    )
  `;

  if (adapter === 'better-sqlite3') {
    dbInstance.exec(createTableSQL);
  } else {
    dbInstance.exec(createTableSQL);
  }

  console.log(`SQLite database initialized using ${adapter} at: ${dbFile}`);
}

function getDB() {
  if (!dbInstance) {
    initDB();
  }
  return dbInstance;
}

function addRSVP({ name, attending, adults, kids, phone, message }) {
  getDB();
  const isAttending = attending ? 1 : 0;
  const adultsNum = isAttending ? Math.max(0, parseInt(adults, 10) || 0) : 0;
  const kidsNum = isAttending ? Math.max(0, parseInt(kids, 10) || 0) : 0;
  const totalGuests = isAttending ? (adultsNum + kidsNum) : 0;
  const now = new Date().toISOString();

  const cleanName = (name || '').trim();
  const cleanPhone = (phone || '').trim();
  const cleanMessage = (message || '').trim();

  if (adapter === 'better-sqlite3') {
    const stmt = dbInstance.prepare(`
      INSERT INTO rsvps (name, attending, adults, kids, total_guests, phone, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(cleanName, isAttending, adultsNum, kidsNum, totalGuests, cleanPhone, cleanMessage, now);
    return {
      id: info.lastInsertRowid,
      name: cleanName,
      attending: isAttending,
      adults: adultsNum,
      kids: kidsNum,
      total_guests: totalGuests,
      phone: cleanPhone,
      message: cleanMessage,
      created_at: now
    };
  } else {
    // node:sqlite
    const stmt = dbInstance.prepare(`
      INSERT INTO rsvps (name, attending, adults, kids, total_guests, phone, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(cleanName, isAttending, adultsNum, kidsNum, totalGuests, cleanPhone, cleanMessage, now);
    return {
      id: info.lastInsertRowid,
      name: cleanName,
      attending: isAttending,
      adults: adultsNum,
      kids: kidsNum,
      total_guests: totalGuests,
      phone: cleanPhone,
      message: cleanMessage,
      created_at: now
    };
  }
}

function getAllRSVPs() {
  getDB();
  if (adapter === 'better-sqlite3') {
    const stmt = dbInstance.prepare(`
      SELECT id, name, attending, adults, kids, total_guests, phone, message, created_at
      FROM rsvps
      ORDER BY id DESC
    `);
    return stmt.all();
  } else {
    const stmt = dbInstance.prepare(`
      SELECT id, name, attending, adults, kids, total_guests, phone, message, created_at
      FROM rsvps
      ORDER BY id DESC
    `);
    return stmt.all();
  }
}

function getPublicWishes() {
  getDB();
  const sql = `
    SELECT name, message, created_at
    FROM rsvps
    WHERE message IS NOT NULL AND TRIM(message) != ''
    ORDER BY id DESC
    LIMIT 50
  `;
  if (adapter === 'better-sqlite3') {
    return dbInstance.prepare(sql).all();
  } else {
    return dbInstance.prepare(sql).all();
  }
}

function getSummaryMetrics() {
  getDB();
  let rows;
  if (adapter === 'better-sqlite3') {
    rows = dbInstance.prepare(`
      SELECT 
        COUNT(*) as total_responses,
        COALESCE(SUM(CASE WHEN attending = 1 THEN 1 ELSE 0 END), 0) as families_attending,
        COALESCE(SUM(CASE WHEN attending = 0 THEN 1 ELSE 0 END), 0) as cant_make_it,
        COALESCE(SUM(CASE WHEN attending = 1 THEN adults ELSE 0 END), 0) as total_adults,
        COALESCE(SUM(CASE WHEN attending = 1 THEN kids ELSE 0 END), 0) as total_kids,
        COALESCE(SUM(CASE WHEN attending = 1 THEN total_guests ELSE 0 END), 0) as total_guests
      FROM rsvps
    `).get();
  } else {
    rows = dbInstance.prepare(`
      SELECT 
        COUNT(*) as total_responses,
        COALESCE(SUM(CASE WHEN attending = 1 THEN 1 ELSE 0 END), 0) as families_attending,
        COALESCE(SUM(CASE WHEN attending = 0 THEN 1 ELSE 0 END), 0) as cant_make_it,
        COALESCE(SUM(CASE WHEN attending = 1 THEN adults ELSE 0 END), 0) as total_adults,
        COALESCE(SUM(CASE WHEN attending = 1 THEN kids ELSE 0 END), 0) as total_kids,
        COALESCE(SUM(CASE WHEN attending = 1 THEN total_guests ELSE 0 END), 0) as total_guests
      FROM rsvps
    `).get();
  }

  return {
    total_responses: Number(rows.total_responses) || 0,
    families_attending: Number(rows.families_attending) || 0,
    cant_make_it: Number(rows.cant_make_it) || 0,
    total_adults: Number(rows.total_adults) || 0,
    total_kids: Number(rows.total_kids) || 0,
    total_guests: Number(rows.total_guests) || 0
  };
}

function deleteRSVP(id) {
  getDB();
  const numId = parseInt(id, 10);
  if (!numId) return false;
  if (adapter === 'better-sqlite3') {
    const stmt = dbInstance.prepare(`DELETE FROM rsvps WHERE id = ?`);
    const info = stmt.run(numId);
    return info.changes > 0;
  } else {
    const stmt = dbInstance.prepare(`DELETE FROM rsvps WHERE id = ?`);
    const info = stmt.run(numId);
    return info.changes > 0;
  }
}

module.exports = {
  initDB,
  getDB,
  addRSVP,
  getAllRSVPs,
  getPublicWishes,
  getSummaryMetrics,
  deleteRSVP
};
