const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedHPSB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ipark_umak'
    });

    console.log('Connected to MySQL. Updating database for HPSB Building Levels (Lvl 1 to 4)...');

    // 1. Clear existing slots and lots
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE parking_slots');
    await connection.query('TRUNCATE TABLE parking_lots');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

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
        // Randomize initial status for realistic demo (mostly available, few occupied)
        const isOccupied = (i === 2 || i === 5 || i === 11);
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

seedHPSB();
