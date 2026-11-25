const guestModel = require('../models/guestModel');
const emailService = require('../services/emailService');
const db = require('../config/db');
const { handleServerError } = require('../utils/errorHandler');
const { logAudit } = require('../services/auditService');

const generatePassCode = (role) => {
  const prefix = role === 'VIP' ? 'VIP' : role === 'Faculty/Staff' ? 'FAC' : 'GUEST';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
};

const createReservation = async (req, res) => {
  const {
    email,
    event_name,
    event_kind,
    event_date,
    time_start,
    time_end,
    building_room,
    guest_name,
    point_person_name,
    point_person_contact,
    vehicle_details,
    plate_number,
    requestee_role,
    preferred_level
  } = req.body;

  if (
    !email ||
    !event_name ||
    !event_date ||
    !guest_name ||
    !plate_number
  ) {
    return res.status(400).json({ error: 'Please provide all required fields (Email, Event Name, Event Date, Guest Name, Plate Number).' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (event_date < todayStr) {
    return res.status(400).json({ error: 'Reservation event date cannot be in the past.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPlate = plate_number.trim().toUpperCase();

  // Atomically check availability with row locking to prevent race condition
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    // Lock device_state or calculate availability atomically
    const [stateRows] = await connection.query('SELECT * FROM device_state WHERE id = 1 FOR UPDATE');
    const capacity = stateRows[0] ? stateRows[0].capacity : 2;
    const inside = stateRows[0] ? stateRows[0].inside : 0;

    // Count active held reservations
    const [activeResRows] = await connection.query(
      `SELECT COUNT(*) AS active_holds FROM guest_reservations 
       WHERE status IN ('approved', 'claimed') 
       AND (event_date = ? OR status = 'claimed')`,
      [event_date]
    );
    const activeHolds = activeResRows[0] ? activeResRows[0].active_holds : 0;

    const availableSpace = capacity - inside - activeHolds;

    if (availableSpace <= 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        error: 'No parking spaces available for reservation on this date. Parking capacity limit reached.'
      });
    }

    // Check duplicate reservation under same email for same date
    const [existing] = await connection.query(
      `SELECT * FROM guest_reservations 
       WHERE email = ? AND event_date = ? AND status IN ('pending', 'approved', 'claimed', 'inside')`,
      [cleanEmail, event_date]
    );

    if (existing && existing.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        error: `A parking reservation under "${cleanEmail}" already exists for ${event_date} (Pass: ${existing[0].pass_code}). Double booking for the same date is not allowed.`
      });
    }

    const pass_code = generatePassCode(requestee_role);
    const assignedFloor = preferred_level || 'HPSB Level 2';
    const vehicleWithFloor = vehicle_details
      ? (vehicle_details.includes('[Floor:') ? vehicle_details.trim() : `${vehicle_details.trim()} [Floor: ${assignedFloor}]`)
      : `Standard Vehicle [Floor: ${assignedFloor}]`;

    const reservationData = {
      email: cleanEmail,
      event_name: event_name.trim(),
      event_kind: event_kind || 'Meeting',
      event_date,
      time_start: time_start || '08:00',
      time_end: time_end || '17:00',
      building_room: building_room ? building_room.trim() : 'UMak HPSB Building',
      guest_name: guest_name.trim(),
      point_person_name: point_person_name ? point_person_name.trim() : 'N/A',
      point_person_contact: point_person_contact ? point_person_contact.trim() : 'N/A',
      vehicle_details: vehicleWithFloor,
      plate_number: cleanPlate,
      requestee_role: requestee_role || 'Visitor',
      pass_code
    };

    const query = `
      INSERT INTO guest_reservations (
        email, event_name, event_kind, event_date, time_start, time_end,
        building_room, guest_name, point_person_name, point_person_contact,
        vehicle_details, plate_number, requestee_role, pass_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      reservationData.email,
      reservationData.event_name,
      reservationData.event_kind,
      reservationData.event_date,
      reservationData.time_start,
      reservationData.time_end,
      reservationData.building_room,
      reservationData.guest_name,
      reservationData.point_person_name,
      reservationData.point_person_contact,
      reservationData.vehicle_details,
      reservationData.plate_number,
      reservationData.requestee_role,
      reservationData.pass_code
    ];

    const [result] = await connection.query(query, values);
    await connection.commit();
    connection.release();

    logAudit({
      req,
      category: 'guest',
      action: 'GUEST_RESERVATION_REQUESTED',
      targetType: 'guest_reservation',
      targetId: result.insertId,
      actor: { email: cleanEmail, role: requestee_role },
      description: `Requested guest pass for ${guest_name}`
    });

    emailService.sendGuestPassEmail(
      reservationData.email,
      reservationData.guest_name,
      pass_code,
      reservationData.event_name,
      reservationData.event_date,
      reservationData.time_start,
      reservationData.time_end,
      reservationData.building_room,
      reservationData.plate_number,
      assignedFloor
    ).catch(console.error);

    res.status(201).json({
      message: 'Guest parking reservation submitted successfully! Pending OHSO approval.',
      reservationId: result.insertId,
      passCode: pass_code,
      details: reservationData
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    return handleServerError(res, err, 'Failed to submit guest reservation.');
  }
};

const getReservationsByEmail = (req, res) => {
  const email = (req.params.email || '').trim().toLowerCase();

  if (req.user && req.user.role !== 'admin' && (req.user.email || '').toLowerCase() !== email) {
    return res.status(403).json({ error: 'Access denied: You can only view your own guest parking reservations.' });
  }

  guestModel.getByEmail(email, (err, results) => {
    if (err) return handleServerError(res, err, 'Failed to fetch guest reservations.');
    res.json(results);
  });
};

const getAllReservationsAdmin = (req, res) => {
  guestModel.getAllReservations((err, results) => {
    if (err) return handleServerError(res, err, 'Failed to fetch all reservations.');
    res.json(results);
  });
};

const updateReservationStatusAdmin = (req, res) => {
  const { id, status, admin_remarks } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'Reservation ID and status are required.' });
  }

  guestModel.updateStatus(id, status, admin_remarks || '', (err, result) => {
    if (err) return handleServerError(res, err, 'Failed to update reservation status.');

    db.query('SELECT * FROM guest_reservations WHERE id = ?', [id], (findErr, rows) => {
      if (!findErr && rows && rows[0]) {
        const gst = rows[0];

        logAudit({
          req,
          category: 'admin',
          action: status === 'approved' ? 'GUEST_APPROVED' : status === 'rejected' ? 'GUEST_REJECTED' : 'GUEST_UPDATED',
          targetType: 'guest_reservation',
          targetId: gst.id,
          description: status === 'approved' ? 'Approved guest reservation' : status === 'rejected' ? 'Rejected guest reservation' : `Updated guest reservation to ${status}`
        });

        emailService.sendGuestPassStatusEmail(
          gst.email,
          gst.guest_name,
          status,
          gst.pass_code,
          gst.event_name,
          gst.event_date,
          gst.time_start,
          gst.time_end,
          gst.building_room,
          gst.plate_number,
          gst.vehicle_details
        ).catch(console.error);
      }
    });

    res.json({
      message: `Guest parking reservation status updated to ${status}.`
    });
  });
};

// Claim a physical guest card from the pool
const claimCard = async (req, res) => {
  const { reservation_id, card_uid } = req.body;
  if (!reservation_id || !card_uid) {
    return res.status(400).json({ error: 'reservation_id and card_uid are required.' });
  }

  try {
    const p = db.promise();
    const cleanUid = card_uid.trim().toUpperCase();

    // Verify card is a valid active guest card
    const [cardRows] = await p.query('SELECT * FROM rfid_cards WHERE uid = ? AND type = "guest" AND status = "active"', [cleanUid]);
    if (!cardRows || cardRows.length === 0) {
      return res.status(400).json({ error: 'Card UID is not a registered, active guest card in the pool.' });
    }

    // Verify card is not already assigned to another active reservation
    const [assigned] = await p.query(
      "SELECT id FROM guest_reservations WHERE card_uid = ? AND status IN ('claimed', 'inside')",
      [cleanUid]
    );
    if (assigned && assigned.length > 0) {
      return res.status(400).json({ error: 'This card is currently claimed by another reservation and has not been returned.' });
    }

    // Update reservation
    await p.query(
      "UPDATE guest_reservations SET card_uid = ?, status = 'claimed', claimed_at = NOW() WHERE id = ?",
      [cleanUid, reservation_id]
    );

    // Queue RES command for ESP32 with 3-hour window (10800 seconds)
    await p.query(
      "INSERT INTO device_commands (command, uid, param, status) VALUES ('RES', ?, 10800, 'pending')",
      [cleanUid]
    );

    res.json({ status: 'ok', message: `Card ${cleanUid} successfully claimed and space held.` });
  } catch (err) {
    console.error('Error claiming card:', err);
    res.status(500).json({ error: 'Failed to claim card.' });
  }
};

// Surrender / return card back to the pool
const surrenderCard = async (req, res) => {
  const { reservation_id, card_uid } = req.body;
  if (!reservation_id && !card_uid) {
    return res.status(400).json({ error: 'reservation_id or card_uid required.' });
  }

  try {
    const p = db.promise();
    let query = 'SELECT * FROM guest_reservations WHERE ';
    let param = [];
    if (reservation_id) {
      query += 'id = ?';
      param.push(reservation_id);
    } else {
      query += 'card_uid = ? AND status IN ("claimed", "inside", "exited") ORDER BY id DESC LIMIT 1';
      param.push(card_uid.trim().toUpperCase());
    }

    const [rows] = await p.query(query, param);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    const r = rows[0];
    const uid = r.card_uid;

    await p.query(
      "UPDATE guest_reservations SET status = 'completed', returned_at = NOW() WHERE id = ?",
      [r.id]
    );

    if (uid) {
      await p.query(
        "INSERT INTO device_commands (command, uid, status) VALUES ('CANCEL', ?, 'pending')",
        [uid]
      );
    }

    res.json({ status: 'ok', message: `Card ${uid} returned to physical pool. Reservation completed.` });
  } catch (err) {
    console.error('Error surrendering card:', err);
    res.status(500).json({ error: 'Failed to surrender card.' });
  }
};

// Available cards in guest pool
const getAvailableCards = async (req, res) => {
  try {
    const p = db.promise();
    const [rows] = await p.query(`
      SELECT c.* 
      FROM rfid_cards c
      WHERE c.type = 'guest' AND c.status = 'active'
        AND c.uid NOT IN (
          SELECT card_uid FROM guest_reservations 
          WHERE card_uid IS NOT NULL AND status IN ('claimed', 'inside')
        )
    `);
    res.json(rows || []);
  } catch (err) {
    console.error('Error fetching available cards:', err);
    res.status(500).json({ error: 'Failed to fetch available cards.' });
  }
};

module.exports = {
  createReservation,
  getReservationsByEmail,
  getAllReservationsAdmin,
  updateReservationStatusAdmin,
  claimCard,
  surrenderCard,
  getAvailableCards
};
