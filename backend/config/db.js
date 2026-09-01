const mysql = require('mysql2');
require('dotenv').config();

// Resolve Railway / standard environment variables (Prefer Railway's MYSQLUSER and MYSQLPASSWORD)
const user = process.env.MYSQLUSER || process.env.DB_USER || 'root';
let password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';

if (user === 'root' && process.env.MYSQL_ROOT_PASSWORD && !process.env.MYSQLPASSWORD) {
    password = process.env.MYSQL_ROOT_PASSWORD;
}

const dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: (process.env.MYSQLPORT || process.env.DB_PORT) ? parseInt(process.env.MYSQLPORT || process.env.DB_PORT, 10) : 3306,
    user: user,
    password: password,
    database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || 'ipark_umak',
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
    (async () => {
        try {
            const { initAuthDB } = require('../init_auth_db');
            const { initGuestDB } = require('../init_guest_db');
            const { initStickersDB } = require('../init_stickers_db');
            const { seedHPSB } = require('../seed_hpsb');
            
            if (typeof initAuthDB === 'function') await initAuthDB();
            if (typeof initGuestDB === 'function') await initGuestDB();
            if (typeof initStickersDB === 'function') await initStickersDB();
            if (typeof seedHPSB === 'function') await seedHPSB();
            console.log('✓ Database tables auto-initialized & verified!');
        } catch (initErr) {
            console.warn('[DB AUTO-INIT WARNING]', initErr.message);
        }
    })();
});

module.exports = db;