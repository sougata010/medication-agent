const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  console.log("Using SQLite Database for Development.");
  const sqlite3 = require('sqlite3').verbose();
  const { open } = require('sqlite');

  let dbPromise;

  async function getDb() {
    if (!dbPromise) {
      dbPromise = open({
        filename: path.join(__dirname, '../medgraph.db'),
        driver: sqlite3.Database
      });
    }
    return dbPromise;
  }

  module.exports = {
    query: async (text, params) => {
      const db = await getDb();
      // Convert Postgres positional params ($1, $2) to SQLite's ?
      const sqliteText = text.replace(/\$\d+/g, '?');
      
      // Execute using db.all so that any RETURNING statements return rows
      const rows = await db.all(sqliteText, params || []);
      return { rows };
    },
    pool: {
      connect: async () => {
        // Return a mock client with query and release methods
        return {
          query: async (text, params) => {
            const upperText = text.trim().toUpperCase();
            if (upperText === 'BEGIN' || upperText === 'COMMIT' || upperText === 'ROLLBACK') {
              return { rows: [] };
            }
            return module.exports.query(text, params);
          },
          release: () => {} // no-op
        };
      }
    }
  };
} else {
  console.log("Using PostgreSQL Database for Production.");
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medgraph_db';

  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err, client) => {
    console.error('Unexpected database client error in pg pool:', err);
  });

  module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
  };
}
