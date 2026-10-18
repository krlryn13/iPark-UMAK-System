const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedHPSB() {
  try {
    const dbUser = process.env.MYSQLUSER || process.env.DB_USER || 'root';
    let dbPass = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';
    if (dbUser === 'root' && process.env.MYSQL_ROOT_PASSWORD && !process.env.MYSQLPASSWORD) {
      dbPass = process.env.MYSQL_ROOT_PASSWORD;
    }

    const connection = await mysql.createConnection({
      host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
      port: (process.env.MYSQLPORT || process.env.DB_PORT) ? parseInt(process.env.MYSQLPORT || process.env.DB_PORT, 10) : 3306,
      user: dbUser,
      password: dbPass,
      database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || 'ipark_umak',
      ssl: (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com'))) ? { rejectUnauthorized: false } : undefined
    });

    console.log('Connected to MySQL. Updating database for HPSB Building Levels (Lvl 1 to 4)...');

    // Ensure parking_lots and parking_slots tables exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS parking_lots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        total_slots INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS parking_slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lot_id INT NOT NULL,
        slot_number VARCHAR(50) NOT NULL,
        status ENUM('available', 'occupied', 'reserved', 'maintenance') DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lot_id) REFERENCES parking_lots(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 1. Check if lots and slots are already seeded
    const [existingLots] = await connection.query('SELECT COUNT(*) AS cnt FROM parking_lots');
    if (existingLots && existingLots[0] && existingLots[0].cnt > 0) {
      console.log('✓ Parking lots and slots are already seeded. Skipping truncation to preserve live state.');
      await connection.end();
      return;
    }

    // 2. Insert 4 HPSB Levels into parking_lots
    const lots = [
      [1, 'HPSB Level 1', 'HPSB Building - Ground Floor', 15],
      [2, 'HPSB Level 2', 'HPSB Building - 2nd Floor', 15],
      [3, 'HPSB Level 3', 'HPSB Building - 3rd Floor', 15],
      [4, 'HPSB Level 4', 'HPSB Building - 4th Floor', 15]
    ];

    for (const lot of lots) {
      await connection.query(
        'INSERT INTO parking_lots (id, name, location, total_slots) VALUES (?, ?, ?, ?)',
        lot
      );
    }
    console.log('✓ Successfully inserted 4 HPSB Parking Levels into parking_lots');

    // 3. Generate slots for each level (L1-01 to L1-15, L2-01 to L2-15, etc.)
    const levels = [
      { lot_id: 1, prefix: 'L1' },
      { lot_id: 2, prefix: 'L2' },
      { lot_id: 3, prefix: 'L3' },
      { lot_id: 4, prefix: 'L4' }
    ];

    let totalSlotsInserted = 0;

    for (const level of levels) {
      for (let i = 1; i <= 15; i++) {
        const slotNumber = `${level.prefix}-${i < 10 ? '0' + i : i}`;
        
        let isOccupied = false;
        if (level.lot_id === 1) {
          // Level 1: Full (All 15 slots occupied)
          isOccupied = true;
        } else if (level.lot_id === 2) {
          // Level 2: 10 occupied, 5 available
          isOccupied = [1, 2, 4, 5, 7, 9, 10, 12, 14, 15].includes(i);
        } else if (level.lot_id === 3) {
          // Level 3: 5 occupied, 10 available
          isOccupied = [2, 5, 8, 11, 14].includes(i);
        } else if (level.lot_id === 4) {
          // Level 4: 2 occupied, 13 available
          isOccupied = [3, 10].includes(i);
        }

        const status = isOccupied ? 'occupied' : 'available';

        await connection.query(
          'INSERT INTO parking_slots (lot_id, slot_number, status) VALUES (?, ?, ?)',
          [level.lot_id, slotNumber, status]
        );
        totalSlotsInserted++;
      }
    }

    console.log(`✓ Successfully inserted ${totalSlotsInserted} parking slots (Lvl 1 to 4)`);
    await connection.end();
    console.log('HPSB Database Seed Complete!');
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
}

module.exports = { seedHPSB };

if (require.main === module) {
    seedHPSB();
}
