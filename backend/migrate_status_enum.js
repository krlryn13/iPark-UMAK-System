const db = require('./config/db');

const sql = `ALTER TABLE vehicle_stickers MODIFY COLUMN status ENUM(
  'pending',
  'pending_review',
  'approved',
  'rejected',
  'payment_submitted',
  'payment_held',
  'ready_for_release',
  'paid',
  'claimed',
  'issued',
  'expired'
) DEFAULT 'pending_review'`;

db.query(sql, (err, result) => {
  if (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
  console.log('✓ vehicle_stickers status enum updated successfully!');
  process.exit(0);
});
