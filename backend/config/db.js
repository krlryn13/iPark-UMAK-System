const mysql = require('mysql2');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: (process.env.DB_PORT || process.env.MYSQLPORT) ? parseInt(process.env.DB_PORT || process.env.MYSQLPORT, 10) : 3306,
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'ipark_umak',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 15000
};

// Enable SSL ONLY if explicitly requested or for Aiven Cloud
if (process.env.DB_SSL === 'true' || (dbConfig.host && dbConfig.host.includes('aivencloud.com'))) {
    dbConfig.ssl = { rejectUnauthorized: false };
}

// Use connection pool for production concurrency
const db = mysql.createPool(dbConfig);

// Verify pool connectivity on startup
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log(`Connected to MySQL database pool (${dbConfig.database} on ${dbConfig.host}:${dbConfig.port})!`);
    connection.release();

    // Auto-create database tables on cloud startup if needed
    try {
        require('../init_auth_db');
        require('../init_guest_db');
        require('../init_stickers_db');
        require('../seed_hpsb');
    } catch (initErr) {
        console.warn('[DB AUTO-INIT WARNING]', initErr.message);
    }
});

module.exports = db;