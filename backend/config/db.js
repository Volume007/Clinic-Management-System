const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbInstance = null;

async function getDb() {
  if (!dbInstance) {
    const dbPath = process.env.USER_DATA_PATH 
      ? path.join(process.env.USER_DATA_PATH, 'clinic.db')
      : path.join(__dirname, '../clinic.db');

    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Initialize Schema exactly matching the current MySQL tables used by the app
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS doctors (
        doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        doctor_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS patients (
        patient_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        mobile_number TEXT,
        location TEXT,
        disease TEXT,
        total_bill REAL DEFAULT 0,
        paid_amount REAL DEFAULT 0,
        pending_amount REAL DEFAULT 0,
        visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS medicines (
        medicine_id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicine_name TEXT UNIQUE NOT NULL,
        medicine_type TEXT NOT NULL,
        pack_size INTEGER NOT NULL,
        pack_unit TEXT NOT NULL,
        stock_quantity INTEGER NOT NULL,
        stock_added_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS patient_medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_record_id INTEGER NOT NULL,
        medicine_name TEXT NOT NULL,
        quantity_given REAL NOT NULL,
        medicine_type TEXT NOT NULL,
        allotted_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patient_record_id) REFERENCES patients(patient_record_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS prescription_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_record_id INTEGER NOT NULL,
        item_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patient_record_id) REFERENCES patients(patient_record_id) ON DELETE CASCADE
      );

      PRAGMA foreign_keys = ON;
    `);
    console.log('Connected to SQLite database and schema initialized');
  }
  return dbInstance;
}

// Polyfill for MySQL Pool API
const pool = {
  query: async (sql, params = []) => {
    const db = await getDb();
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    
    try {
      // In sqlite, placeholders are ?, but MySQL allows ? for arrays. 
      // The controllers are passing flat arrays, which works perfectly in sqlite.
      if (isSelect) {
        const rows = await db.all(sql, params);
        return [rows, []];
      } else {
        const result = await db.run(sql, params);
        // Map SQLite properties to MySQL properties expected by controllers
        result.insertId = result.lastID;
        result.affectedRows = result.changes;
        return [result, []];
      }
    } catch (err) {
      throw err;
    }
  },
  getConnection: async () => {
    const db = await getDb();
    return {
      query: async (sql, params = []) => {
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
        try {
          if (isSelect) {
            const rows = await db.all(sql, params);
            return [rows, []];
          } else {
            const result = await db.run(sql, params);
            result.insertId = result.lastID;
            result.affectedRows = result.changes;
            return [result, []];
          }
        } catch (err) {
          throw err;
        }
      },
      beginTransaction: async () => await db.run('BEGIN TRANSACTION'),
      commit: async () => await db.run('COMMIT'),
      rollback: async () => await db.run('ROLLBACK'),
      release: () => {} // No-op in SQLite
    };
  }
};

async function closeDb() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}

// Initialize the database immediately
getDb().catch(err => console.error("Database initialization failed:", err));

pool.closeDb = closeDb;
module.exports = pool;
