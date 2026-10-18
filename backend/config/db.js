const mysql = require('mysql2');
require('dotenv').config();

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
    connectTimeout: 15000,
    dateStrings: ['DATE']
};

if (process.env.DB_SSL === 'true' || (dbConfig.host && dbConfig.host.includes('aivencloud.com'))) {
    dbConfig.ssl = { rejectUnauthorized: false };
}


const db = mysql.createPool(dbConfig);

db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log(`Connected to MySQL database pool (${dbConfig.database} on ${dbConfig.host}:${dbConfig.port})!`);
    connection.release();
});

module.exports = db;