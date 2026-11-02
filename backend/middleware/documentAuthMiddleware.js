const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { decryptAES256 } = require('../utils/encryption');

const UPLOAD_DOCS_DIR = path.resolve(__dirname, '../uploads/documents');

/**
 * Middleware / Handler to authenticate and authorize document access.
 * Enforces the Philippine Data Privacy Act (RA 10173).
 *
 * Checks:
 * 1. Valid JWT token from Authorization header or ?token= query parameter.
 * 2. Admin role has global read permission for verification purposes.
 * 3. Non-admin users can ONLY access files that belong to their own vehicle sticker applications.
 * 4. Path traversal prevention.
 */
const serveProtectedDocument = (req, res) => {
  const rawFilename = req.params.filename;
  if (!rawFilename) {
    return res.status(400).json({ error: 'Filename is required.' });
  }

  // Prevent path traversal
  const safeFilename = path.basename(rawFilename);
  const targetFilePath = path.join(UPLOAD_DOCS_DIR, safeFilename);

  // 1. Extract Token from Authorization header or Query param FIRST (prevents filename enumeration)
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Access Denied (Data Privacy Protection): An active authentication token is required to view identity documents.'
    });
  }

  // 2. Verify JWT Token
  const jwtSecret = process.env.JWT_SECRET || 'ipark_umak_2026_s3cr3t_jwt_key_x7k2m9';
  let decoded = null;
  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired authentication session. Please sign in again.'
    });
  }

  // Verify file exists on disk
  if (!fs.existsSync(targetFilePath)) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  // 3. Authorization: If Admin, allow access immediately
  if (decoded.role === 'admin') {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.sendFile(targetFilePath);
  }

  // 4. Authorization: If Student/Faculty, verify document belongs to them
  const userId = decoded.id;
  db.query(
    'SELECT student_id_doc, or_cr_doc, license_doc, payment_proof_doc FROM vehicle_stickers WHERE user_id = ?',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to verify document ownership.' });
      }

      let isOwner = false;
      for (const row of (rows || [])) {
        const decryptedPaths = [
          decryptAES256(row.student_id_doc),
          decryptAES256(row.or_cr_doc),
          decryptAES256(row.license_doc),
          decryptAES256(row.payment_proof_doc)
        ].filter(Boolean);

        for (const p of decryptedPaths) {
          if (path.basename(p) === safeFilename) {
            isOwner = true;
            break;
          }
        }
        if (isOwner) break;
      }

      if (!isOwner) {
        return res.status(403).json({
          error: 'Access Denied: You do not have permission to view this document.'
        });
      }

      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      return res.sendFile(targetFilePath);
    }
  );
};

module.exports = { serveProtectedDocument };

