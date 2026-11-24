const path = require('path');
const fs = require('fs');
const config = require('./config');

let dbInstance = null;
let adapter = null; // 'better-sqlite3', 'node:sqlite', or 'json-store'
let jsonStorePath = null;
let jsonMemoryCache = [];

function initDB() {
  const dbFile = path.resolve(__dirname, config.DB_PATH);
  jsonStorePath = path.resolve(__dirname, 'rsvps.json');

  // Try 1: better-sqlite3
  try {
    const Database = require('better-sqlite3');
    const db = new Database(dbFile);
    db.pragma('journal_mode = WAL');
    adapter = 'better-sqlite3';
    dbInstance = db;
  } catch (err1) {
    // Try 2: node:sqlite (Node 22.5+)
    try {
      const { DatabaseSync } = require('node:sqlite');
      const db = new DatabaseSync(dbFile);
      adapter = 'node:sqlite';
      dbInstance = db;
    } catch (err2) {
      // Try 3: Pure JSON Persistent Store (Guaranteed 100% portable on any host)
      adapter = 'json-store';
      if (fs.existsSync(jsonStorePath)) {
        try {
          const raw = fs.readFileSync(jsonStorePath, 'utf8');
          jsonMemoryCache = JSON.parse(raw) || [];
        } catch (e) {
          jsonMemoryCache = [];
        }
      } else {
        jsonMemoryCache = [];
        saveJSONStore();
      }
    }
  }

  // Setup SQL tables if using SQLite
  if (adapter === 'better-sqlite3' || adapter === 'node:sqlite') {
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
    dbInstance.exec(createTableSQL);
  }

  console.log(`✅ Database initialized using [${adapter}] storage engine.`);
}

function saveJSONStore() {
  try {
    fs.writeFileSync(jsonStorePath, JSON.stringify(jsonMemoryCache, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to JSON store:', err);
  }
}

function getDB() {
  if (!adapter) {
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

  if (adapter === 'better-sqlite3' || adapter === 'node:sqlite') {
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
    // json-store
    const nextId = jsonMemoryCache.length > 0
      ? Math.max(...jsonMemoryCache.map(r => r.id || 0)) + 1
      : 1;

    const newRecord = {
      id: nextId,
      name: cleanName,
      attending: isAttending,
      adults: adultsNum,
      kids: kidsNum,
      total_guests: totalGuests,
      phone: cleanPhone,
      message: cleanMessage,
      created_at: now
    };

    jsonMemoryCache.unshift(newRecord);
    saveJSONStore();
    return newRecord;
  }
}

function getAllRSVPs() {
  getDB();
  if (adapter === 'better-sqlite3' || adapter === 'node:sqlite') {
    const stmt = dbInstance.prepare(`
      SELECT id, name, attending, adults, kids, total_guests, phone, message, created_at
      FROM rsvps
      ORDER BY id DESC
    `);
    return stmt.all();
  } else {
    return [...jsonMemoryCache];
  }
}

function getPublicWishes() {
  getDB();
  if (adapter === 'better-sqlite3' || adapter === 'node:sqlite') {
    const sql = `
      SELECT name, message, created_at
      FROM rsvps
      WHERE message IS NOT NULL AND TRIM(message) != ''
      ORDER BY id DESC
      LIMIT 50
    `;
    return dbInstance.prepare(sql).all();
  } else {
    return jsonMemoryCache
      .filter(r => r.message && r.message.trim().length > 0)
      .map(r => ({ name: r.name, message: r.message, created_at: r.created_at }))
      .slice(0, 50);
  }
}

function getSummaryMetrics() {
  getDB();
  if (adapter === 'better-sqlite3' || adapter === 'node:sqlite') {
    const rows = dbInstance.prepare(`
      SELECT 
        COUNT(*) as total_responses,
        COALESCE(SUM(CASE WHEN attending = 1 THEN 1 ELSE 0 END), 0) as families_attending,
        COALESCE(SUM(CASE WHEN attending = 0 THEN 1 ELSE 0 END), 0) as cant_make_it,
        COALESCE(SUM(CASE WHEN attending = 1 THEN adults ELSE 0 END), 0) as total_adults,
        COALESCE(SUM(CASE WHEN attending = 1 THEN kids ELSE 0 END), 0) as total_kids,
        COALESCE(SUM(CASE WHEN attending = 1 THEN total_guests ELSE 0 END), 0) as total_guests
      FROM rsvps
    `).get();

    return {
      total_responses: Number(rows.total_responses) || 0,
      families_attending: Number(rows.families_attending) || 0,
      cant_make_it: Number(rows.cant_make_it) || 0,
      total_adults: Number(rows.total_adults) || 0,
      total_kids: Number(rows.total_kids) || 0,
      total_guests: Number(rows.total_guests) || 0
    };
  } else {
    const total_responses = jsonMemoryCache.length;
    let families_attending = 0;
    let cant_make_it = 0;
    let total_adults = 0;
    let total_kids = 0;
    let total_guests = 0;

    jsonMemoryCache.forEach(r => {
      if (r.attending === 1 || r.attending === true) {
        families_attending++;
        total_adults += (r.adults || 0);
        total_kids += (r.kids || 0);
        total_guests += (r.total_guests || 0);
      } else {
        cant_make_it++;
      }
    });

    return {
      total_responses,
      families_attending,
      cant_make_it,
      total_adults,
      total_kids,
      total_guests
    };
  }
}

function deleteRSVP(id) {
  getDB();
  const numId = parseInt(id, 10);
  if (!numId) return false;

  if (adapter === 'better-sqlite3' || adapter === 'node:sqlite') {
    const stmt = dbInstance.prepare(`DELETE FROM rsvps WHERE id = ?`);
    const info = stmt.run(numId);
    return info.changes > 0;
  } else {
    const initialLen = jsonMemoryCache.length;
    jsonMemoryCache = jsonMemoryCache.filter(r => r.id !== numId);
    if (jsonMemoryCache.length !== initialLen) {
      saveJSONStore();
      return true;
    }
    return false;
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
