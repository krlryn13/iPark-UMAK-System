const db = require('../config/db');

// Ingest device event idempotently
const ingestEvent = async (req, res) => {
  try {
    const { event_id, gate, event, uid, free, reserved, inside, parked } = req.body;

    if (!event_id || !event) {
      return res.status(400).json({ error: 'event_id and event type are required.' });
    }

    const p = db.promise();

    // Check if event already processed
    const [existing] = await p.query('SELECT id FROM device_events WHERE event_id = ?', [event_id]);
    if (existing && existing.length > 0) {
      return res.json({ status: 'ignored', message: 'Duplicate event already processed.' });
    }

    // Insert event
    await p.query(
      `INSERT INTO device_events (event_id, gate, event, uid, free, reserved, inside, parked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [event_id, gate || 'UNKNOWN', event, uid || null, free || 0, reserved || 0, inside || 0, parked || 0]
    );

    // Update reservation lifecycle if card belongs to a guest reservation
    if (uid) {
      const cleanUid = uid.trim().toUpperCase();
      if (event === 'entered') {
        await p.query(
          `UPDATE guest_reservations 
           SET status = 'inside', entered_at = NOW() 
           WHERE card_uid = ? AND status IN ('claimed', 'approved') 
           ORDER BY id DESC LIMIT 1`,
          [cleanUid]
        );
      } else if (event === 'exited') {
        await p.query(
          `UPDATE guest_reservations 
           SET status = 'exited', exited_at = NOW() 
           WHERE card_uid = ? AND status = 'inside' 
           ORDER BY id DESC LIMIT 1`,
          [cleanUid]
        );
      }
    }

    res.json({ status: 'ok', event_id });
  } catch (err) {
    console.error('Error ingesting device event:', err);
    res.status(500).json({ error: 'Internal server error ingesting event.' });
  }
};

// Heartbeat & status sync from ESP32
const heartbeat = async (req, res) => {
  try {
    const {
      capacity = 2,
      inside = 0,
      parked = 0,
      in_transit = 0,
      reserved = 0,
      free = 2,
      L1 = 'empty',
      L2 = 'empty',
      entry_gate = 'ok',
      exit_gate = 'ok',
      warning = ''
    } = req.body;

    const p = db.promise();
    await p.query(
      `INSERT INTO device_state (
        id, capacity, inside, parked, in_transit, reserved, free,
        l1_status, l2_status, entry_gate_status, exit_gate_status, active_warnings, last_heartbeat
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        capacity = VALUES(capacity),
        inside = VALUES(inside),
        parked = VALUES(parked),
        in_transit = VALUES(in_transit),
        reserved = VALUES(reserved),
        free = VALUES(free),
        l1_status = VALUES(l1_status),
        l2_status = VALUES(l2_status),
        entry_gate_status = VALUES(entry_gate_status),
        exit_gate_status = VALUES(exit_gate_status),
        active_warnings = VALUES(active_warnings),
        last_heartbeat = NOW()`,
      [capacity, inside, parked, in_transit, reserved, free, L1, L2, entry_gate, exit_gate, warning]
    );

    // Also update slot status in parking_slots for real slots
    await p.query("UPDATE parking_slots SET status = ? WHERE slot_number = 'L1-01'", [L1 === 'occupied' ? 'occupied' : 'available']);
    await p.query("UPDATE parking_slots SET status = ? WHERE slot_number = 'L2-01'", [L2 === 'occupied' ? 'occupied' : 'available']);

    // Check for pending commands to return to ESP32
    const [commands] = await p.query(
      "SELECT id, command, uid, param FROM device_commands WHERE status = 'pending' ORDER BY id ASC LIMIT 5"
    );

    if (commands && commands.length > 0) {
      const ids = commands.map(c => c.id);
      await p.query("UPDATE device_commands SET status = 'sent' WHERE id IN (?)", [ids]);
    }

    res.json({
      status: 'ok',
      commands: commands || []
    });
  } catch (err) {
    console.error('Error updating heartbeat:', err);
    res.status(500).json({ error: 'Internal server error updating heartbeat.' });
  }
};

// Sync cards: provides ESP32 with active cards (staff + active guest reservations)
const syncCards = async (req, res) => {
  try {
    const p = db.promise();

    // 1. Staff and Student permanent cards
    const [permanentCards] = await p.query(`
      SELECT c.uid, COALESCE(u.name, c.assigned_name, IF(c.type='student','Student Car','Staff')) AS owner, c.type
      FROM rfid_cards c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.type IN ('staff', 'student') AND c.status = 'active'
    `);

    // 2. Guest claimed/inside reservations
    const [activeGuests] = await p.query(`
      SELECT g.card_uid AS uid, g.guest_name AS owner, 'guest' AS type, g.status,
             TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(g.claimed_at, INTERVAL 3 HOUR)) AS reserve_sec
      FROM guest_reservations g
      WHERE g.card_uid IS NOT NULL 
        AND g.status IN ('claimed', 'inside')
    `);

    const resultCards = [];
    const seenUids = new Set();

    (permanentCards || []).forEach(sc => {
      if (sc.uid) {
        seenUids.add(sc.uid.toUpperCase());
        resultCards.push({
          uid: sc.uid.toUpperCase(),
          owner: sc.owner || (sc.type === 'student' ? 'Student Car' : 'Staff Member'),
          type: sc.type,
          reserved: false,
          reserve_sec: 0
        });
      }
    });

    (activeGuests || []).forEach(gc => {
      if (gc.uid && !seenUids.has(gc.uid.toUpperCase())) {
        seenUids.add(gc.uid.toUpperCase());
        // A card is only 'reserved' (holding a spot before entry) while claimed.
        // Once the vehicle has physically entered ('inside'), the spot is occupied by a car,
        // so reserved is false to avoid double-counting!
        const isHoldingReservation = (gc.status === 'claimed');
        resultCards.push({
          uid: gc.uid.toUpperCase(),
          owner: gc.owner || 'Guest Visitor',
          type: 'guest',
          reserved: isHoldingReservation,
          reserve_sec: gc.reserve_sec > 0 ? gc.reserve_sec : 900
        });
      }
    });

    res.json({
      cards: resultCards
    });
  } catch (err) {
    console.error('Error syncing cards:', err);
    res.status(500).json({ error: 'Internal server error syncing cards.' });
  }
};

// Get current live state for website / frontend
const getLiveState = async (req, res) => {
  try {
    const p = db.promise();
    const [rows] = await p.query('SELECT *, TIMESTAMPDIFF(SECOND, last_heartbeat, NOW()) AS sec_since_heartbeat FROM device_state WHERE id = 1');
    
    if (!rows || rows.length === 0) {
      return res.json({
        online: false,
        capacity: 2,
        free: 2,
        inside: 0,
        parked: 0,
        in_transit: 0,
        reserved: 0,
        l1_status: 'empty',
        l2_status: 'empty',
        active_warnings: '',
        last_heartbeat: null
      });
    }

    const state = rows[0];
    const isOnline = state.sec_since_heartbeat !== null && state.sec_since_heartbeat <= 15;

    res.json({
      ...state,
      online: isOnline,
      sec_since_heartbeat: state.sec_since_heartbeat
    });
  } catch (err) {
    console.error('Error fetching live state:', err);
    res.status(500).json({ error: 'Failed to fetch device live state.' });
  }
};

// Queue admin override command
const sendCommand = async (req, res) => {
  try {
    const { command, uid, param } = req.body;
    const allowed = ['RES', 'CANCEL', 'SETIN', 'SETOUT', 'RESET', 'STATUS'];

    if (!command || !allowed.includes(command.toUpperCase())) {
      return res.status(400).json({ error: `Invalid command. Allowed: ${allowed.join(', ')}` });
    }

    const p = db.promise();
    const [result] = await p.query(
      'INSERT INTO device_commands (command, uid, param, status) VALUES (?, ?, ?, "pending")',
      [command.toUpperCase(), uid ? uid.trim().toUpperCase() : null, param || null]
    );

    res.json({ status: 'ok', command_id: result.insertId });
  } catch (err) {
    console.error('Error queueing command:', err);
    res.status(500).json({ error: 'Failed to queue command.' });
  }
};

// Get recent device events & warnings for admin page
const getEventsAndWarnings = async (req, res) => {
  try {
    const p = db.promise();
    const [events] = await p.query('SELECT * FROM device_events ORDER BY id DESC LIMIT 50');
    const [stateRows] = await p.query('SELECT active_warnings, last_heartbeat, TIMESTAMPDIFF(SECOND, last_heartbeat, NOW()) AS sec_since_heartbeat FROM device_state WHERE id = 1');
    
    res.json({
      events: events || [],
      state: stateRows[0] || {}
    });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events and warnings.' });
  }
};

module.exports = {
  ingestEvent,
  heartbeat,
  syncCards,
  getLiveState,
  sendCommand,
  getEventsAndWarnings
};
