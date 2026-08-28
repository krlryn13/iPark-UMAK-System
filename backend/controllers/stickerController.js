const stickerModel = require('../models/stickerModel');
const emailService = require('../services/emailService');
const db = require('../config/db');
const { handleServerError } = require('../utils/errorHandler');
const { encryptAES256, decryptAES256 } = require('../utils/encryption');

const generateRefNo = (method) => {
  const prefix = method ? method.toUpperCase() : 'PAY';
  const randomStr = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${Date.now().toString().slice(-6)}-${randomStr}`;
};

// Helper to generate official UMak sticker code (e.g. UMK-CAR-2026-8941)
const generateStickerNumber = (vehicleType = 'car') => {
  const prefix = vehicleType === 'motorcycle' ? 'MC' : vehicleType === 'ebike' ? 'EB' : 'CAR';
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `UMK-${prefix}-${year}-${random}`;
};

// APPLY FOR STICKER + ONLINE PAYMENT + SECURE DOCUMENT UPLOADS
const applySticker = (req, res) => {
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
    payment_method
  } = req.body;

  if (!user_id || !student_id_num || !plate_number) {
    return res.status(400).json({ error: 'Required information is missing (User ID, Student ID, Plate Number).' });
  }

  // Server-side Philippine LTO Regex Format Checks
  const licenseRegex = /^[A-Z]\d{2}-\d{2}-\d{6}$/i;
  const plateRegex = /^[A-Z]{2,3}\s?\d{3,4}$|^[0-9]{3,4}\s?[A-Z]{2,3}$|^\d{4}\s?[A-Z]{2}$|^\d{11,15}$|^E-BIKE$/i;

  if (license_number && !licenseRegex.test(license_number.trim())) {
    return res.status(400).json({ error: 'Invalid Driver\'s License format. Must be in A00-00-000000 format (e.g. N01-12-345678).' });
  }

  if (plate_number && !plateRegex.test(plate_number.trim())) {
    return res.status(400).json({ error: 'Invalid Plate / MV File Number format (e.g. ABC 1234 or 11-15 digit MV File No).' });
  }

  // Handle file uploads (file paths encrypted using AES-256-GCM before DB save)
  const files = req.files || {};
  const student_id_doc = files.student_id_doc ? encryptAES256(`/uploads/documents/${files.student_id_doc[0].filename}`) : null;
  const or_cr_doc = files.or_cr_doc ? encryptAES256(`/uploads/documents/${files.or_cr_doc[0].filename}`) : null;
  const license_doc = files.license_doc ? encryptAES256(`/uploads/documents/${files.license_doc[0].filename}`) : null;
  const payment_proof_doc = files.payment_proof_doc ? encryptAES256(`/uploads/documents/${files.payment_proof_doc[0].filename}`) : null;

  const payment_ref_no = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const applicationData = {
    user_id,
    applicant_name: applicant_name || 'Heron Applicant',
    email: email || '',
    student_id_num: student_id_num.trim(),
    vehicle_type: vehicle_type || 'car',
    vehicle_make: vehicle_make || 'Standard Vehicle',
    plate_number: plate_number.trim().toUpperCase(),
    or_number: or_number || 'OR-PENDING',
    cr_number: cr_number || 'CR-PENDING',
    license_number: license_number || 'LIC-PENDING',
    amount: 200.00,
    payment_method: payment_method || 'PayMongo API',
    payment_ref_no,
    payment_status: payment_proof_doc ? 'paid' : 'unpaid',
    student_id_doc,
    or_cr_doc,
    license_doc,
    payment_proof_doc
  };

  // Check if user already has an active or pending application
  stickerModel.getByUserId(user_id, (err, existing) => {
    if (err) return handleServerError(res, err, 'Failed to check existing sticker applications.');

    // Check if a sticker is active (less than 1 year old) or pending
    const isWithinOneYear = (dateStr) => {
      if (!dateStr) return true;
      const createdDate = new Date(dateStr);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return createdDate >= oneYearAgo;
    };

    const activeOrPending = (existing || []).find(s => {
      if (s.status === 'expired' || s.status === 'rejected') return false;
      // If approved/issued but older than 1 year, allow re-application/renewal
      if ((s.status === 'approved' || s.status === 'issued') && !isWithinOneYear(s.created_at)) {
        return false;
      }
      return s.status === 'pending' || s.status === 'approved' || s.status === 'issued';
    });
    
    if (activeOrPending && activeOrPending.status === 'pending') {
      // Update existing pending application with new files/payment details
      const updateData = {
        student_id_num: student_id_num ? student_id_num.trim() : activeOrPending.student_id_num,
        plate_number: plate_number ? plate_number.trim().toUpperCase() : activeOrPending.plate_number,
        vehicle_type: vehicle_type || activeOrPending.vehicle_type,
        vehicle_make: vehicle_make || activeOrPending.vehicle_make,
        or_number: or_number || activeOrPending.or_number,
        cr_number: cr_number || activeOrPending.cr_number,
        license_number: license_number || activeOrPending.license_number,
        payment_method: payment_method || activeOrPending.payment_method
      };

      if (student_id_doc) updateData.student_id_doc = student_id_doc;
      if (or_cr_doc) updateData.or_cr_doc = or_cr_doc;
      if (license_doc) updateData.license_doc = license_doc;
      if (payment_proof_doc) {
        updateData.payment_proof_doc = payment_proof_doc;
        updateData.payment_status = 'paid';
      }

      stickerModel.updatePendingApplication(activeOrPending.id, updateData, (updErr) => {
        if (updErr) return handleServerError(res, updErr, 'Failed to update sticker application.');
        return res.json({
          message: 'Vehicle sticker application & payment proof updated successfully!',
          applicationId: activeOrPending.id,
          paymentRefNo: activeOrPending.payment_ref_no || payment_ref_no,
          amount: 200.00
        });
      });
      return;
    }

    if (activeOrPending && (activeOrPending.status === 'approved' || activeOrPending.status === 'issued')) {
      return res.status(400).json({ error: 'You already have an active vehicle sticker valid for 1 year. Renewal will be open once your sticker expires.' });
    }

    stickerModel.createApplication(applicationData, (createErr, result) => {
      if (createErr) return handleServerError(res, createErr, 'Failed to submit sticker application.');

      res.status(201).json({
        message: 'Vehicle sticker payment & secure document upload successful! Pending OHSO approval.',
        applicationId: result.insertId,
        paymentRefNo: payment_ref_no,
        amount: 200.00
      });
    });
  });
};

const decryptStickerRows = (rows) => {
  return (rows || []).map(row => ({
    ...row,
    student_id_doc: decryptAES256(row.student_id_doc),
    or_cr_doc: decryptAES256(row.or_cr_doc),
    license_doc: decryptAES256(row.license_doc),
    payment_proof_doc: decryptAES256(row.payment_proof_doc)
  }));
};

const getUserStickers = (req, res) => {
  const userId = req.params.userId;
  stickerModel.getByUserId(userId, (err, results) => {
    if (err) return handleServerError(res, err, 'Failed to fetch user sticker applications.');
    res.json(decryptStickerRows(results));
  });
};

const getAllStickersAdmin = (req, res) => {
  stickerModel.getAllApplications((err, results) => {
    if (err) return handleServerError(res, err, 'Failed to fetch sticker applications.');
    res.json(decryptStickerRows(results));
  });
};

const updateStickerStatusAdmin = (req, res) => {
  const { id, status, admin_remarks, vehicle_type } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'Application ID and status are required.' });
  }

  let stickerNumber = null;
  if (status === 'approved' || status === 'issued') {
    stickerNumber = generateStickerNumber(vehicle_type || 'car');
  }

  stickerModel.updateStatus(id, status, stickerNumber, admin_remarks || '', (err, result) => {
    if (err) return handleServerError(res, err, 'Failed to update sticker application status.');

    // Fetch sticker application record to send email notification
    db.query('SELECT * FROM vehicle_stickers WHERE id = ?', [id], (findErr, rows) => {
      if (!findErr && rows && rows[0]) {
        const stk = rows[0];
        emailService.sendStickerStatusEmail(
          stk.email,
          stk.applicant_name,
          status,
          stickerNumber || stk.sticker_number,
          stk.vehicle_type,
          stk.plate_number
        ).catch(console.error);
      }
    });

    res.json({
      message: `Sticker application ${status} successfully.`,
      stickerNumber
    });
  });
};

const verifyStickerPublic = (req, res) => {
  const { identifier } = req.params;

  if (!identifier) {
    return res.status(400).json({ error: 'Sticker number or reference code is required.' });
  }

  stickerModel.getByRefOrStickerNumber(identifier, (err, record) => {
    if (err) return handleServerError(res, err, 'Failed to verify sticker.');

    if (!record) {
      return res.status(404).json({
        isValid: false,
        error: 'No official UMak vehicle sticker found for this reference code.'
      });
    }

    const isWithinOneYear = (dateStr) => {
      if (!dateStr) return true;
      const createdDate = new Date(dateStr);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return createdDate >= oneYearAgo;
    };

    const isExpired = !isWithinOneYear(record.created_at) || record.status === 'expired';
    const isApprovedOrIssued = record.status === 'approved' || record.status === 'issued';

    const issueDate = new Date(record.created_at);
    const expireDate = new Date(issueDate);
    expireDate.setFullYear(expireDate.getFullYear() + 1);

    res.json({
      isValid: isApprovedOrIssued && !isExpired,
      status: record.status,
      isExpired: isExpired,
      stickerNumber: record.sticker_number || 'PENDING ASSIGNMENT',
      paymentRefNo: record.payment_ref_no,
      applicantName: record.applicant_name,
      studentIdNum: record.student_id_num,
      vehicleType: record.vehicle_type,
      vehicleMake: record.vehicle_make,
      plateNumber: record.plate_number,
      paymentStatus: record.payment_status,
      issuedAt: record.created_at,
      expiresAt: expireDate.toISOString(),
      verifiedAt: new Date().toISOString()
    });
  });
};

module.exports = { applySticker, getUserStickers, getAllStickersAdmin, updateStickerStatusAdmin, verifyStickerPublic };
