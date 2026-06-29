const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medgraph_db';

const pool = new Pool({
  connectionString,
  max: 20, // Max clients in the pool
  idleTimeoutMillis: 30000, // 30 seconds idle timeout
  connectionTimeoutMillis: 2000, // 2 seconds connection timeout
});

pool.on('error', (err, client) => {
  console.error('Unexpected database client error in pg pool:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
