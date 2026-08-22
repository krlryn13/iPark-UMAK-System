const guestModel = require('../models/guestModel');
const emailService = require('../services/emailService');
const db = require('../config/db');

const generatePassCode = (role) => {
  const codePrefix = role ? role.substring(0, 3).toUpperCase() : 'GST';
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `UMAK-GUEST-${codePrefix}-${randomNum}`;
};

const createReservation = (req, res) => {
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
    !time_start ||
    !time_end ||
    !guest_name ||
    !point_person_name ||
    !point_person_contact ||
    !plate_number
  ) {
    return res.status(400).json({ error: 'Please fill out all required event and guest reservation fields.' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (event_date < todayStr) {
    return res.status(400).json({ error: 'Reservation event date cannot be in the past.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPlate = plate_number.trim().toUpperCase();

  // Prevent double booking under the same email for the same event date
  guestModel.getByEmail(cleanEmail, (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });

    const duplicateSameDate = (existing || []).find(r => {
      const isSameDate = r.event_date && new Date(r.event_date).toISOString().split('T')[0] === event_date;
      const isActiveOrPending = r.status === 'pending' || r.status === 'approved';
      return isSameDate && isActiveOrPending;
    });

    if (duplicateSameDate) {
      return res.status(400).json({
        error: `A parking reservation under "${cleanEmail}" already exists for ${event_date} (Pass: ${duplicateSameDate.pass_code}). Double booking for the same date is not allowed.`
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
      time_start,
      time_end,
      building_room: building_room ? building_room.trim() : 'UMak HPSB Building',
      guest_name: guest_name.trim(),
      point_person_name: point_person_name.trim(),
      point_person_contact: point_person_contact.trim(),
      vehicle_details: vehicleWithFloor,
      plate_number: cleanPlate,
      requestee_role: requestee_role || 'Visitor',
      pass_code,
      preferred_level: assignedFloor
    };

    guestModel.createReservation(reservationData, (createErr, result) => {
      if (createErr) return res.status(500).json({ error: createErr.message });

      // Asynchronously send email confirmation pass to guest
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
    });
  });
};

const getReservationsByEmail = (req, res) => {
  const email = req.params.email;
  guestModel.getByEmail(email, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

const getAllReservationsAdmin = (req, res) => {
  guestModel.getAllReservations((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

const updateReservationStatusAdmin = (req, res) => {
  const { id, status, admin_remarks } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'Reservation ID and status are required.' });
  }

  guestModel.updateStatus(id, status, admin_remarks || '', (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Query reservation details to send status update email
    db.query('SELECT * FROM guest_reservations WHERE id = ?', [id], (findErr, rows) => {
      if (!findErr && rows && rows[0]) {
        const gst = rows[0];
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

module.exports = {
  createReservation,
  getReservationsByEmail,
  getAllReservationsAdmin,
  updateReservationStatusAdmin
};
