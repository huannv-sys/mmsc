const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  }
}

// API Routes
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    
    res.json({
      status: 'ok',
      version: '1.0.0',
      message: 'System is running normally',
      time: new Date(),
      database: dbConnected ? 'connected' : 'error'
    });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error checking system status',
      error: error.message || String(error)
    });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Simple API server running at http://0.0.0.0:${port}`);
  testConnection();
});