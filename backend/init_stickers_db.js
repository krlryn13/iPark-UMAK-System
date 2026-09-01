const db = require('./config/db');

async function initStickersDB() {
  try {
    const connection = db.promise ? db.promise() : db;

    console.log('Initializing vehicle_stickers table...');

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
        payment_method VARCHAR(100) DEFAULT 'gcash',
        payment_ref_no VARCHAR(100) NOT NULL,
        payment_status ENUM('paid', 'pending', 'unpaid') DEFAULT 'pending',
        student_id_doc TEXT NULL,
        or_cr_doc TEXT NULL,
        license_doc TEXT NULL,
        payment_proof_doc TEXT NULL,
        sticker_number VARCHAR(100) DEFAULT NULL,
        status ENUM('pending', 'approved', 'rejected', 'issued') DEFAULT 'pending',
        admin_remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try {
      await connection.query('ALTER TABLE vehicle_stickers MODIFY COLUMN payment_status ENUM("paid", "pending", "unpaid") DEFAULT "pending"');
    } catch (e) {}
    try {
      await connection.query('ALTER TABLE vehicle_stickers ADD COLUMN student_id_doc TEXT NULL');
    } catch (e) {}
    try {
      await connection.query('ALTER TABLE vehicle_stickers ADD COLUMN or_cr_doc TEXT NULL');
    } catch (e) {}
    try {
      await connection.query('ALTER TABLE vehicle_stickers ADD COLUMN license_doc TEXT NULL');
    } catch (e) {}
    try {
      await connection.query('ALTER TABLE vehicle_stickers ADD COLUMN payment_proof_doc TEXT NULL');
    } catch (e) {}

    console.log('✓ vehicle_stickers table created & verified successfully!');
  } catch (err) {
    console.error('Error initializing Vehicle Stickers DB:', err.message);
  }
}

module.exports = { initStickersDB };

if (require.main === module) {
    initStickersDB();
}
