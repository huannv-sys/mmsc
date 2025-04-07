const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testDatabaseConnection() {
  try {
    console.log('Kiểm tra kết nối đến cơ sở dữ liệu PostgreSQL...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Đã được cấu hình' : 'Không có');
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Kết nối thành công!');
    console.log('Thời gian từ máy chủ:', result.rows[0].now);
    client.release();
    
    await pool.end();
    console.log('Đã đóng kết nối đến cơ sở dữ liệu.');
    return true;
  } catch (error) {
    console.error('Lỗi khi kết nối đến cơ sở dữ liệu:', error.message);
    return false;
  }
}

testDatabaseConnection().catch(console.error);