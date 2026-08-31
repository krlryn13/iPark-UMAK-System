const mysql = require('mysql2/promise');
require('dotenv').config();

async function initGuestDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
      port: (process.env.DB_PORT || process.env.MYSQLPORT) ? parseInt(process.env.DB_PORT || process.env.MYSQLPORT, 10) : 3306,
      user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
      password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || '',
      database: process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'ipark_umak',
      ssl: (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com'))) ? { rejectUnauthorized: false } : undefined
    });

    console.log('Connected to MySQL. Initializing guest_reservations table...');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS guest_reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        event_name VARCHAR(255) NOT NULL,
        event_kind VARCHAR(100) NOT NULL,
        event_date DATE NOT NULL,
        time_start VARCHAR(50) NOT NULL,
        time_end VARCHAR(50) NOT NULL,
        building_room VARCHAR(255) NOT NULL,
        guest_name VARCHAR(255) NOT NULL,
        point_person_name VARCHAR(255) NOT NULL,
        point_person_contact VARCHAR(100) NOT NULL,
        vehicle_details VARCHAR(255) NOT NULL,
        plate_number VARCHAR(50) NOT NULL,
        requestee_role VARCHAR(100) NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
        pass_code VARCHAR(100) NOT NULL,
        admin_remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await connection.query(createTableQuery);
    console.log('✓ guest_reservations table created successfully!');

    await connection.end();
  } catch (err) {
    console.error('Error initializing guest_reservations DB:', err.message);
  }
}

initGuestDB();
