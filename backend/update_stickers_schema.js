const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateStickersSchema() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ipark_umak'
    });

    console.log('Connected to MySQL. Updating vehicle_stickers schema for document upload paths...');

    // Add document columns if they don't exist yet
    const [columns] = await connection.query(`SHOW COLUMNS FROM vehicle_stickers LIKE 'student_id_doc'`);
    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE vehicle_stickers
        ADD COLUMN student_id_doc VARCHAR(255) DEFAULT NULL,
        ADD COLUMN or_cr_doc VARCHAR(255) DEFAULT NULL,
        ADD COLUMN license_doc VARCHAR(255) DEFAULT NULL
      `);
      console.log('✓ Added document columns (student_id_doc, or_cr_doc, license_doc) successfully!');
    } else {
      console.log('✓ Document columns already exist!');
    }

    await connection.end();
  } catch (err) {
    console.error('Error updating schema:', err.message);
  }
}

updateStickersSchema();
