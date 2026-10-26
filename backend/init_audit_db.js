const db = require('./config/db');

/**
 * Creates the audit_logs table used by the Admin "Audit Logs" tab,
 * the analytics security metrics, and the Audit Log PDF report.
 *
 * category/status are VARCHAR (not ENUM) so new categories (e.g. 'iot')
 * can be added later without an ALTER TABLE.
 */
async function initAuditDB() {
  try {
    const connection = db.promise ? db.promise() : db;

    console.log('Initializing audit_logs table...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(20) NOT NULL,
        action VARCHAR(64) NOT NULL,
        actor_id INT NULL,
        actor_email VARCHAR(255) NULL,
        actor_role VARCHAR(50) NULL,
        target_type VARCHAR(50) NULL,
        target_id INT NULL,
        description VARCHAR(500) NOT NULL,
        status VARCHAR(10) NOT NULL DEFAULT 'success',
        ip_address VARCHAR(64) NULL,
        user_agent VARCHAR(255) NULL,
        metadata TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_category_date (category, created_at),
        INDEX idx_audit_actor (actor_id),
        INDEX idx_audit_action (action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✓ audit_logs table created & verified successfully!');
  } catch (err) {
    console.error('Error initializing Audit Log DB:', err.message);
  }
}

module.exports = { initAuditDB };

if (require.main === module) {
  initAuditDB().then(() => process.exit(0));
}
