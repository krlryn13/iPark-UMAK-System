const db = require('../config/db');

const createApplication = (stickerData, callback) => {
  const {
    user_id,
    applicant_name,
    email,
    student_id_num,
    vehicle_type,
    vehicle_make,
    plate_number,
    or_number,
    cr_number,
    license_number,
    amount = 200.00,
    payment_method,
    payment_ref_no,
    payment_status = 'paid',
    student_id_doc = null,
    or_cr_doc = null,
    license_doc = null
  } = stickerData;

  db.query(
    `INSERT INTO vehicle_stickers (
      user_id, applicant_name, email, student_id_num, vehicle_type, vehicle_make,
      plate_number, or_number, cr_number, license_number, amount, payment_method,
      payment_ref_no, payment_status, student_id_doc, or_cr_doc, license_doc, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      user_id, applicant_name, email, student_id_num, vehicle_type, vehicle_make,
      plate_number, or_number, cr_number, license_number, amount, payment_method,
      payment_ref_no, payment_status, student_id_doc, or_cr_doc, license_doc
    ],
    callback
  );
};

const getByUserId = (userId, callback) => {
  db.query('SELECT * FROM vehicle_stickers WHERE user_id = ? ORDER BY created_at DESC', [userId], callback);
};

const getAllApplications = (callback) => {
  db.query('SELECT * FROM vehicle_stickers ORDER BY created_at DESC', callback);
};

const updateStatus = (id, status, sticker_number, admin_remarks, callback) => {
  db.query(
    'UPDATE vehicle_stickers SET status = ?, sticker_number = ?, admin_remarks = ? WHERE id = ?',
    [status, sticker_number, admin_remarks, id],
    callback
  );
};

module.exports = { createApplication, getByUserId, getAllApplications, updateStatus };
