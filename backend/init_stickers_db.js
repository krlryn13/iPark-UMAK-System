const mysql = require('mysql2/promise');
require('dotenv').config();

async function initStickersDB() {
  try {
    const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
    let dbPass = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';
    if (dbUser === 'root' && process.env.MYSQL_ROOT_PASSWORD) {
      dbPass = process.env.MYSQL_ROOT_PASSWORD;
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
      port: (process.env.DB_PORT || process.env.MYSQLPORT) ? parseInt(process.env.DB_PORT || process.env.MYSQLPORT, 10) : 3306,
      user: dbUser,
      password: dbPass,
      database: process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'ipark_umak',
      ssl: (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com'))) ? { rejectUnauthorized: false } : undefined
    });

    console.log('Connected to MySQL. Initializing vehicle_stickers table...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS vehicle_stickers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        student_id_num VARCHAR(100) NOT NULL,
        vehicle_type ENUM('car', 'motorcycle', 'ebike') NOT NULL,
        vehicle_make VARCHAR(100) NOT NULL,
        plate_number VARCHAR(50) NOT NULL,
        or_number VARCHAR(100) NOT NULL,
        cr_number VARCHAR(100) NOT NULL,
        license_number VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) DEFAULT 200.00,
        payment_method ENUM('gcash', 'maya', 'card') NOT NULL,
        payment_ref_no VARCHAR(100) NOT NULL,
        payment_status ENUM('paid', 'pending') DEFAULT 'paid',
        sticker_number VARCHAR(100) DEFAULT NULL,
        status ENUM('pending', 'approved', 'rejected', 'issued') DEFAULT 'pending',
        admin_remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✓ vehicle_stickers table created successfully!');
    await connection.end();
  } catch (err) {
    console.error('Error initializing Vehicle Stickers DB:', err.message);
  }
}

module.exports = { initStickersDB };

if (require.main === module) {
    initStickersDB();
}
