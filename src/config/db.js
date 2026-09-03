require('dotenv').config();
const { Pool } = require('pg');
const { connect } = require('../routes/authRoute');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,                   // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error if connection takes > 2 seconds
});

// Helper function to export a query method
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    connect: () => pool.connect(),
};