const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initAuthDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
      port: (process.env.DB_PORT || process.env.MYSQLPORT) ? parseInt(process.env.DB_PORT || process.env.MYSQLPORT, 10) : 3306,
      user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
      password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || '',
      database: process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'ipark_umak',
      ssl: (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com'))) ? { rejectUnauthorized: false } : undefined
    });

    console.log('Connected to MySQL. Setting up users table for authentication and verification...');

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'student',
        is_verified TINYINT(1) DEFAULT 0,
        verification_code VARCHAR(10) NULL,
        failed_login_attempts INT DEFAULT 0,
        locked_until DATETIME NULL,
        unlock_requested TINYINT(1) DEFAULT 0,
        unlock_requested_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure columns exist if table was already created
    try {
      await connection.query('ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0');
    } catch (e) {}
    try {
      await connection.query('ALTER TABLE users ADD COLUMN verification_code VARCHAR(10) NULL');
    } catch (e) {}
    try {
      await connection.query('ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0');
    } catch (e) {}
    try {
      await connection.query('ALTER TABLE users ADD COLUMN locked_until DATETIME NULL');
    } catch (e) {}
    try {
      await connection.query('ALTER TABLE users ADD COLUMN unlock_requested TINYINT(1) DEFAULT 0');
    } catch (e) {}
    try {
      await connection.query('ALTER TABLE users ADD COLUMN unlock_requested_at DATETIME NULL');
    } catch (e) {}
    try {
      await connection.query('ALTER TABLE users ADD COLUMN reset_otp VARCHAR(10) NULL');
    } catch (e) {}
    try {
      await connection.query('ALTER TABLE users ADD COLUMN reset_otp_expires DATETIME NULL');
    } catch (e) {}

    console.log('✓ Users table created/updated with verification fields successfully.');

    // Check if admin user exists
    const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@umak.edu.ph']);
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, 1)',
        ['UMak Admin', 'admin@umak.edu.ph', hashedPassword, 'admin']
      );
      console.log('✓ Default Admin account created & verified: admin@umak.edu.ph / admin123');
      await connection.query('UPDATE users SET is_verified = 1 WHERE email = ?', ['admin@umak.edu.ph']);
    }

    // Ensure vehicle_stickers table has payment_proof_doc column
    try {
      await connection.query('ALTER TABLE vehicle_stickers ADD COLUMN payment_proof_doc VARCHAR(255) NULL');
      console.log('✓ Added payment_proof_doc column to vehicle_stickers table.');
    } catch (e) {}

    await connection.end();
    console.log('Auth Verification Database Setup Complete!');
  } catch (err) {
    console.error('Error initializing Auth DB:', err.message);
  }
}

module.exports = { initAuthDB };

if (require.main === module) {
    initAuthDB();
}
