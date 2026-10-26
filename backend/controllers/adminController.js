const db = require('../config/db');
const { logAudit, CATEGORIES } = require('../services/auditService');
const { handleServerError } = require('../utils/errorHandler');

/*
 * Admin reporting endpoints: analytics, audit logs, and report datasets.
 *
 * TIMEZONE NOTE
 * All date filtering is done with epoch seconds (UNIX_TIMESTAMP / FROM_UNIXTIME)
 * so results are correct no matter what time zone the MySQL server/session uses
 * (local XAMPP vs. a cloud DB in UTC). Day/month bucketing happens in JS using
 * Philippine time (UTC+8, no DST).
 */

const PH_OFFSET_SEC = 8 * 3600;
const DAY_SEC = 86400;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const q = (sql, params = []) => db.promise().query(sql, params).then(([rows]) => rows);

// 'YYYY-MM-DD' (PH local) -> epoch seconds
const phDateToEpoch = (dateStr, endOfDay = false) =>
  Math.floor(Date.parse(`${dateStr}T${endOfDay ? '23:59:59' : '00:00:00'}+08:00`) / 1000);

// epoch seconds -> 'YYYY-MM-DD' (PH local)
const epochToPhDate = (ts) => new Date((ts + PH_OFFSET_SEC) * 1000).toISOString().slice(0, 10);

const todayPh = () => epochToPhDate(Math.floor(Date.now() / 1000));

/**
 * Parses ?from=YYYY-MM-DD&to=YYYY-MM-DD. Defaults to the last 30 days.
 * Returns epoch bounds for the range and for the previous period of equal length.
 */
const parseRange = (query = {}) => {
  let to = DATE_RE.test(query.to || '') ? query.to : todayPh();
  let from = DATE_RE.test(query.from || '') ? query.from : epochToPhDate(phDateToEpoch(to) - 29 * DAY_SEC);
  if (from > to) [from, to] = [to, from];

  const start = phDateToEpoch(from);
  const end = phDateToEpoch(to, true);
  const days = Math.round((end + 1 - start) / DAY_SEC);

  return {
    from,
    to,
    start,
    end,
    days,
    prevStart: start - days * DAY_SEC,
    prevEnd: start - 1
  };
};

const STICKER_RELEASED = ['ready_for_release', 'claimed', 'issued', 'paid'];
const STICKER_DOC_STAGE = ['pending_review', 'pending', 'rejected'];
const STICKER_PAYMENT_STAGE = ['payment_submitted', 'payment_held', ...STICKER_RELEASED];

const countBy = (rows, key, fallback = 'unspecified') =>
  rows.reduce((acc, row) => {
    const k = (row[key] === null || row[key] === undefined || row[key] === '') ? fallback : String(row[key]).toLowerCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

const toPairs = (obj) =>
  Object.entries(obj)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);

const sum = (rows, key) => rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

/**
 * Builds a zero-filled time series between start/end.
 * Uses daily buckets for ranges up to 92 days, monthly buckets beyond that.
 */
const buildSeries = (range, datasets) => {
  const monthly = range.days > 92;
  const keyOf = (ts) => (monthly ? epochToPhDate(ts).slice(0, 7) : epochToPhDate(ts));

  const buckets = new Map();
  if (monthly) {
    let [y, m] = range.from.slice(0, 7).split('-').map(Number);
    const [endY, endM] = range.to.slice(0, 7).split('-').map(Number);
    while (y < endY || (y === endY && m <= endM)) {
      buckets.set(`${y}-${String(m).padStart(2, '0')}`, {});
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
  } else {
    for (let ts = range.start; ts <= range.end; ts += DAY_SEC) {
      buckets.set(epochToPhDate(ts), {});
    }
  }

  for (const [name, { rows, value }] of Object.entries(datasets)) {
    for (const bucket of buckets.values()) bucket[name] = 0;
    for (const row of rows) {
      const bucket = buckets.get(keyOf(Number(row.ts)));
      if (bucket) bucket[name] += value ? (Number(row[value]) || 0) : 1;
    }
  }

  return {
    granularity: monthly ? 'month' : 'day',
    points: Array.from(buckets.entries()).map(([period, values]) => ({ period, ...values }))
  };
};

// =====================================================================
// GET /api/admin/analytics?from=&to=
// =====================================================================
const getAnalytics = async (req, res) => {
  try {
    const range = parseRange(req.query);
    const window = [range.prevStart, range.end];

    const [stickers, guests, users, audits, userTotals] = await Promise.all([
      q(`SELECT UNIX_TIMESTAMP(created_at) AS ts, status, payment_status, amount, vehicle_type, payment_method
           FROM vehicle_stickers
          WHERE created_at BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?)`, window),
      q(`SELECT UNIX_TIMESTAMP(created_at) AS ts, status, requestee_role, event_kind
           FROM guest_reservations
          WHERE created_at BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?)`, window),
      q(`SELECT UNIX_TIMESTAMP(created_at) AS ts, role, is_verified
           FROM users
          WHERE role <> 'admin' AND created_at BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?)`, window),
      q(`SELECT UNIX_TIMESTAMP(created_at) AS ts, category, action, status
           FROM audit_logs
          WHERE created_at BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?)`, window),
      q(`SELECT COUNT(*) AS total,
                SUM(is_verified = 1) AS verified,
                SUM(locked_until IS NOT NULL AND locked_until > NOW()) AS locked
           FROM users WHERE role <> 'admin'`)
    ]);

    const inCurrent = (r) => Number(r.ts) >= range.start;
    const split = (rows) => [rows.filter(inCurrent), rows.filter((r) => !inCurrent(r))];

    const [curStickers, prevStickers] = split(stickers);
    const [curGuests, prevGuests] = split(guests);
    const [curUsers, prevUsers] = split(users);
    const [curAudits, prevAudits] = split(audits);

    const paid = (rows) => rows.filter((r) => r.payment_status === 'paid');
    const released = (rows) => rows.filter((r) => STICKER_RELEASED.includes(r.status));
    const failedLogins = (rows) => rows.filter((r) => r.action === 'LOGIN_FAILED');

    const summary = {
      stickerApplications: { current: curStickers.length, previous: prevStickers.length },
      stickersReleased: { current: released(curStickers).length, previous: released(prevStickers).length },
      revenue: { current: sum(paid(curStickers), 'amount'), previous: sum(paid(prevStickers), 'amount') },
      guestReservations: { current: curGuests.length, previous: prevGuests.length },
      newUsers: { current: curUsers.length, previous: prevUsers.length },
      failedLogins: { current: failedLogins(curAudits).length, previous: failedLogins(prevAudits).length },
      pendingReview: curStickers.filter((r) => r.status === 'pending_review' || r.status === 'pending').length,
      pendingPayment: curStickers.filter((r) => r.status === 'payment_submitted').length,
      pendingGuests: curGuests.filter((r) => r.status === 'pending').length
    };

    // Sticker pipeline: how far applications filed in this range have progressed
    const pipeline = [
      { stage: 'Submitted', value: curStickers.length },
      { stage: 'Documents approved', value: curStickers.filter((r) => !STICKER_DOC_STAGE.includes(r.status) && r.status !== 'expired').length },
      { stage: 'Payment submitted', value: curStickers.filter((r) => STICKER_PAYMENT_STAGE.includes(r.status)).length },
      { stage: 'Released', value: released(curStickers).length }
    ];

    // Activity heatmap (weekday x hour, PH time) from audit events
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const row of curAudits) {
      const d = new Date((Number(row.ts) + PH_OFFSET_SEC) * 1000);
      heatmap[d.getUTCDay()][d.getUTCHours()] += 1;
    }

    const series = buildSeries(range, {
      stickers: { rows: curStickers },
      guests: { rows: curGuests },
      registrations: { rows: curUsers },
      revenue: { rows: paid(curStickers), value: 'amount' }
    });

    res.json({
      range: { from: range.from, to: range.to, days: range.days },
      summary,
      userTotals: {
        total: Number(userTotals[0]?.total) || 0,
        verified: Number(userTotals[0]?.verified) || 0,
        locked: Number(userTotals[0]?.locked) || 0
      },
      series,
      pipeline,
      breakdowns: {
        stickerStatus: toPairs(countBy(curStickers, 'status')),
        vehicleType: toPairs(countBy(curStickers, 'vehicle_type')),
        paymentMethod: toPairs(countBy(paid(curStickers), 'payment_method')),
        guestStatus: toPairs(countBy(curGuests, 'status')),
        guestRole: toPairs(countBy(curGuests, 'requestee_role')),
        userRole: toPairs(countBy(curUsers, 'role')),
        auditCategory: toPairs(countBy(curAudits, 'category'))
      },
      heatmap
    });
  } catch (err) {
    handleServerError(res, err, 'Failed to compute analytics.');
  }
};

// =====================================================================
// GET /api/admin/audit-logs
//   ?category=auth|sticker|guest|admin  &status=success|failed
//   &action=LOGIN_FAILED  &search=text  &from=&to=  &page=1&pageSize=50
// =====================================================================
const buildAuditWhere = (query, range) => {
  const where = ['created_at BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?)'];
  const params = [range.start, range.end];

  if (CATEGORIES.includes(query.category)) {
    where.push('category = ?');
    params.push(query.category);
  }
  if (query.status === 'success' || query.status === 'failed') {
    where.push('status = ?');
    params.push(query.status);
  }
  if (query.action && /^[A-Z_]{2,64}$/.test(query.action)) {
    where.push('action = ?');
    params.push(query.action);
  }
  if (query.search && String(query.search).trim()) {
    const like = `%${String(query.search).trim().slice(0, 100)}%`;
    where.push('(actor_email LIKE ? OR description LIKE ? OR ip_address LIKE ?)');
    params.push(like, like, like);
  }
  return { clause: where.join(' AND '), params };
};

const mapAuditRow = (row) => {
  let metadata = null;
  if (row.metadata) {
    try { metadata = JSON.parse(row.metadata); } catch (e) { metadata = null; }
  }
  return {
    id: row.id,
    ts: Number(row.ts),
    category: row.category,
    action: row.action,
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    targetType: row.target_type,
    targetId: row.target_id,
    description: row.description,
    status: row.status,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata
  };
};

const AUDIT_COLUMNS = `id, UNIX_TIMESTAMP(created_at) AS ts, category, action, actor_id, actor_email, actor_role,
  target_type, target_id, description, status, ip_address, user_agent, metadata`;

const getAuditLogs = async (req, res) => {
  try {
    const range = parseRange(req.query);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(200, Math.max(10, parseInt(req.query.pageSize, 10) || 50));

    const { clause, params } = buildAuditWhere(req.query, range);

    // Category counts ignore the category filter so every tab can show its own total
    const countFilter = buildAuditWhere({ ...req.query, category: undefined }, range);

    const [rows, totalRows, categoryRows, actionRows] = await Promise.all([
      q(`SELECT ${AUDIT_COLUMNS} FROM audit_logs WHERE ${clause} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, (page - 1) * pageSize]),
      q(`SELECT COUNT(*) AS total, SUM(status = 'failed') AS failed FROM audit_logs WHERE ${clause}`, params),
      q(`SELECT category, COUNT(*) AS total FROM audit_logs WHERE ${countFilter.clause} GROUP BY category`, countFilter.params),
      q(`SELECT DISTINCT action FROM audit_logs WHERE ${buildAuditWhere({ category: req.query.category }, range).clause} ORDER BY action`,
        buildAuditWhere({ category: req.query.category }, range).params)
    ]);

    const categoryCounts = { all: 0 };
    for (const c of CATEGORIES) categoryCounts[c] = 0;
    for (const r of categoryRows) {
      categoryCounts[r.category] = Number(r.total) || 0;
      categoryCounts.all += Number(r.total) || 0;
    }

    res.json({
      range: { from: range.from, to: range.to },
      page,
      pageSize,
      total: Number(totalRows[0]?.total) || 0,
      failed: Number(totalRows[0]?.failed) || 0,
      categoryCounts,
      actions: actionRows.map((r) => r.action),
      rows: rows.map(mapAuditRow)
    });
  } catch (err) {
    handleServerError(res, err, 'Failed to load audit logs.');
  }
};

// =====================================================================
// GET /api/admin/reports/:type?from=&to=&format=pdf|csv  (+ audit filters)
// Returns the dataset used to render a report, and records REPORT_GENERATED.
// =====================================================================
const REPORT_TITLES = {
  stickers: 'Sticker Applications Report',
  revenue: 'Revenue & Payments Report',
  guests: 'Guest Reservations Report',
  users: 'User Accounts Report',
  audit: 'Audit Log Report'
};

const getReport = async (req, res) => {
  const { type } = req.params;
  if (!REPORT_TITLES[type]) {
    return res.status(400).json({ error: 'Unknown report type.' });
  }

  try {
    const range = parseRange(req.query);
    const bounds = [range.start, range.end];
    let rows = [];

    if (type === 'stickers') {
      rows = await q(
        `SELECT id, UNIX_TIMESTAMP(created_at) AS ts, applicant_name, student_id_num, email, vehicle_type, vehicle_make,
                plate_number, status, payment_status, sticker_number
           FROM vehicle_stickers
          WHERE created_at BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?)
          ORDER BY created_at ASC`, bounds);
    } else if (type === 'revenue') {
      rows = await q(
        `SELECT id, UNIX_TIMESTAMP(created_at) AS ts, applicant_name, student_id_num, plate_number, vehicle_type,
                payment_method, payment_ref_no, payment_status, amount, sticker_number, status
           FROM vehicle_stickers
          WHERE payment_status IN ('paid', 'pending') AND payment_ref_no IS NOT NULL
            AND created_at BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?)
          ORDER BY created_at ASC`, bounds);
    } else if (type === 'guests') {
      rows = await q(
        `SELECT id, UNIX_TIMESTAMP(created_at) AS ts, guest_name, email, event_name, event_kind, event_date,
                time_start, time_end, building_room, plate_number, requestee_role, pass_code, status
           FROM guest_reservations
          WHERE created_at BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?)
          ORDER BY created_at ASC`, bounds);
    } else if (type === 'users') {
      // Explicit column list: never select password / codes / OTPs
      rows = await q(
        `SELECT id, UNIX_TIMESTAMP(created_at) AS ts, name, email, role, is_verified, failed_login_attempts,
                (locked_until IS NOT NULL AND locked_until > NOW()) AS is_locked
           FROM users
          WHERE created_at BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?)
          ORDER BY created_at ASC`, bounds);
    } else if (type === 'audit') {
      const { clause, params } = buildAuditWhere(req.query, range);
      rows = (await q(`SELECT ${AUDIT_COLUMNS} FROM audit_logs WHERE ${clause} ORDER BY created_at ASC, id ASC LIMIT 5000`, params))
        .map(mapAuditRow);
    }

    rows = rows.map((r) => ({ ...r, ts: Number(r.ts) }));

    const format = req.query.format === 'csv' ? 'CSV' : 'PDF';
    // Only record in audit log if actual records were found and exported
    if (rows.length > 0) {
      logAudit({
        req,
        category: 'admin',
        action: 'REPORT_GENERATED',
        description: `Generated ${REPORT_TITLES[type]} (${format})`
      });
    }

    res.json({
      type,
      title: REPORT_TITLES[type],
      range: { from: range.from, to: range.to, days: range.days },
      generatedAt: Math.floor(Date.now() / 1000),
      rows
    });
  } catch (err) {
    handleServerError(res, err, 'Failed to generate report.');
  }
};

module.exports = { getAnalytics, getAuditLogs, getReport, parseRange };
