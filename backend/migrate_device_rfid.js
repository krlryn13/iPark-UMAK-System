const db = require('./config/db');

async function migrate() {
  const p = db.promise();
  console.log('Running device and RFID database migrations...');

  // 1. Create rfid_cards
  await p.query(`
    CREATE TABLE IF NOT EXISTS rfid_cards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uid VARCHAR(32) UNIQUE NOT NULL,
      type ENUM('staff', 'guest') NOT NULL,
      status ENUM('active', 'inactive', 'lost') DEFAULT 'active',
      user_id INT NULL,
      assigned_name VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 2. Add columns to guest_reservations
  try { await p.query("ALTER TABLE guest_reservations ADD COLUMN card_uid VARCHAR(32) NULL"); } catch(e){}
  try { await p.query("ALTER TABLE guest_reservations ADD COLUMN claimed_at DATETIME NULL"); } catch(e){}
  try { await p.query("ALTER TABLE guest_reservations ADD COLUMN entered_at DATETIME NULL"); } catch(e){}
  try { await p.query("ALTER TABLE guest_reservations ADD COLUMN exited_at DATETIME NULL"); } catch(e){}
  try { await p.query("ALTER TABLE guest_reservations ADD COLUMN returned_at DATETIME NULL"); } catch(e){}
  try { await p.query("ALTER TABLE guest_reservations MODIFY COLUMN status ENUM('pending', 'approved', 'claimed', 'inside', 'exited', 'completed', 'rejected', 'cancelled', 'expired') DEFAULT 'pending'"); } catch(e){}

  // 3. Create device_events
  await p.query(`
    CREATE TABLE IF NOT EXISTS device_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id VARCHAR(64) UNIQUE NOT NULL,
      gate VARCHAR(16) NOT NULL,
      event VARCHAR(64) NOT NULL,
      uid VARCHAR(32) NULL,
      free INT DEFAULT 0,
      reserved INT DEFAULT 0,
      inside INT DEFAULT 0,
      parked INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 4. Create device_state
  await p.query(`
    CREATE TABLE IF NOT EXISTS device_state (
      id INT PRIMARY KEY,
      capacity INT DEFAULT 2,
      inside INT DEFAULT 0,
      parked INT DEFAULT 0,
      in_transit INT DEFAULT 0,
      reserved INT DEFAULT 0,
      free INT DEFAULT 2,
      l1_status VARCHAR(16) DEFAULT 'empty',
      l2_status VARCHAR(16) DEFAULT 'empty',
      entry_gate_status VARCHAR(16) DEFAULT 'ok',
      exit_gate_status VARCHAR(16) DEFAULT 'ok',
      active_warnings VARCHAR(255) DEFAULT '',
      last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await p.query(`
    INSERT INTO device_state (id, capacity, free) VALUES (1, 2, 2)
    ON DUPLICATE KEY UPDATE capacity=VALUES(capacity);
  `);

  // 5. Create device_commands
  await p.query(`
    CREATE TABLE IF NOT EXISTS device_commands (
      id INT AUTO_INCREMENT PRIMARY KEY,
      command VARCHAR(32) NOT NULL,
      uid VARCHAR(32) NULL,
      param INT NULL,
      status ENUM('pending', 'sent', 'executed', 'failed') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 6. Seed sample cards
  await p.query(`
    INSERT INTO rfid_cards (uid, type, status, assigned_name) VALUES
    ('0054709E', 'staff', 'active', 'Admin / Staff Keycard'),
    ('6A75A2A5', 'guest', 'active', 'Guest Pool Card #1')
    ON DUPLICATE KEY UPDATE assigned_name=VALUES(assigned_name);
  `);

  console.log('✓ Migration executed successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
