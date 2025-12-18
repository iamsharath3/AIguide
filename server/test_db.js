const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
    console.log("Testing DB connection...");
    console.log("URL:", process.env.DATABASE_URL);
    try {
        const client = await pool.connect();
        console.log("Successfully connected to PostgreSQL!");
        const res = await client.query('SELECT NOW()');
        console.log("Result:", res.rows[0]);
        client.release();
        process.exit(0);
    } catch (err) {
        console.error("Connection failed:", err.message);
        console.error("Full error:", err);
        process.exit(1);
    }
}

testConnection();
