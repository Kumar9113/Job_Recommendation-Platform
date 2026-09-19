// Central place where we create ONE connection pool and reuse it
// everywhere. A "pool" keeps several open DB connections ready so
// each request doesn't pay the cost of opening a new connection.
const { Pool } = require('pg');
require('dotenv').config();

// Managed Postgres providers (RDS, Supabase, Render, Neon, etc.) require
// SSL. Enable it in production, or when DB_SSL=true is explicitly set.
const useSSL = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

module.exports = pool;
