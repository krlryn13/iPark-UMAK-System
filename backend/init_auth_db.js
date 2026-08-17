const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initAuthDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ipark_umak'
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
    } else {
      await connection.query('UPDATE users SET is_verified = 1 WHERE email = ?', ['admin@umak.edu.ph']);
    }

    await connection.end();
    console.log('Auth Verification Database Setup Complete!');
  } catch (err) {
    console.error('Error initializing Auth DB:', err.message);
  }
}

initAuthDB();
