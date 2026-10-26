const db = require('../config/db');

/**
 * Audit trail service.
 *
 * logAudit() is fire-and-forget: it never throws and never blocks the
 * request that triggered it. A failed audit insert is logged to the console
 * only, so a logging problem can never break login, payments, etc.
 *
 * NEVER pass passwords, OTPs, verification codes, or tokens in `metadata`.
 */

const CATEGORIES = ['auth', 'sticker', 'guest', 'admin'];

const truncate = (value, max) => {
  if (value === null || value === undefined) return null;
  const str = String(value);
  return str.length > max ? str.slice(0, max) : str;
};

const getClientIp = (req) => {
  if (!req) return null;
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  const raw = forwarded ? String(forwarded).split(',')[0].trim() : (req.ip || (req.socket && req.socket.remoteAddress) || null);
  if (!raw) return null;
  // Normalize IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  return raw.startsWith('::ffff:') ? raw.slice(7) : raw;
};

/**
 * @param {object} entry
 * @param {import('express').Request} [entry.req]  Used for IP, user agent and req.user
 * @param {'auth'|'sticker'|'guest'|'admin'} entry.category
 * @param {string} entry.action        UPPER_SNAKE_CASE action code, e.g. LOGIN_SUCCESS
 * @param {string} entry.description   Human-readable sentence shown in the admin UI
 * @param {'success'|'failed'} [entry.status]
 * @param {{id?:number,email?:string,role?:string}} [entry.actor]  Overrides req.user
 * @param {string} [entry.targetType]
 * @param {number} [entry.targetId]
 * @param {object} [entry.metadata]
 */
const logAudit = ({ req, category, action, description, status = 'success', actor, targetType, targetId, metadata } = {}) => {
  try {
    if (!CATEGORIES.includes(category) || !action || !description) {
      console.warn('[AUDIT] Skipped invalid audit entry:', { category, action });
      return;
    }

    const who = actor || (req && req.user) || {};

    let metadataJson = null;
    if (metadata && typeof metadata === 'object') {
      try {
        metadataJson = JSON.stringify(metadata).slice(0, 4000);
      } catch (e) {
        metadataJson = null;
      }
    }

    db.query(
      `INSERT INTO audit_logs
        (category, action, actor_id, actor_email, actor_role, target_type, target_id, description, status, ip_address, user_agent, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category,
        truncate(action, 64),
        who.id || null,
        truncate(who.email ? String(who.email).toLowerCase() : null, 255),
        truncate(who.role || null, 50),
        truncate(targetType || null, 50),
        targetId || null,
        truncate(description, 500),
        status === 'failed' ? 'failed' : 'success',
        truncate(getClientIp(req), 64),
        truncate(req && req.headers ? req.headers['user-agent'] : null, 255),
        metadataJson
      ],
      (err) => {
        if (err) console.error('[AUDIT LOG ERROR]', err.message);
      }
    );
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err.message);
  }
};

module.exports = { logAudit, CATEGORIES };
