const db = require('../config/db');

const createReservation = (data, callback) => {
  const query = `
    INSERT INTO guest_reservations (
      email, event_name, event_kind, event_date, time_start, time_end,
      building_room, guest_name, point_person_name, point_person_contact,
      vehicle_details, plate_number, requestee_role, pass_code
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.email,
    data.event_name,
    data.event_kind,
    data.event_date,
    data.time_start,
    data.time_end,
    data.building_room,
    data.guest_name,
    data.point_person_name,
    data.point_person_contact,
    data.vehicle_details,
    data.plate_number,
    data.requestee_role,
    data.pass_code
  ];

  db.query(query, values, callback);
};

const getByEmail = (email, callback) => {
  db.query('SELECT * FROM guest_reservations WHERE email = ? ORDER BY created_at DESC', [email], callback);
};

const getAllReservations = (callback) => {
  db.query('SELECT * FROM guest_reservations ORDER BY created_at DESC', callback);
};

const updateStatus = (id, status, adminRemarks, callback) => {
  db.query(
    'UPDATE guest_reservations SET status = ?, admin_remarks = ? WHERE id = ?',
    [status, adminRemarks, id],
    callback
  );
};

module.exports = {
  createReservation,
  getByEmail,
  getAllReservations,
  updateStatus
};
