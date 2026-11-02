const stickerModel = require('../models/stickerModel');
const emailService = require('../services/emailService');
const paymongoService = require('../services/paymongoService');
const db = require('../config/db');
const { handleServerError } = require('../utils/errorHandler');
const { encryptAES256, decryptAES256 } = require('../utils/encryption');
const { logAudit } = require('../services/auditService');

// Helper to generate official UMak sticker code (e.g. UMK-CAR-2026-8941)
const generateStickerNumber = (vehicleType = 'car') => {
  const prefix = vehicleType === 'motorcycle' ? 'MC' : vehicleType === 'ebike' ? 'EB' : 'CAR';
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `UMK-${prefix}-${year}-${random}`;
};

// 1. APPLY FOR STICKER (DOCUMENTS & FORM ONLY, PAYMENT COMES AFTER ADMIN APPROVAL)
const applySticker = async (req, res) => {
  const effectiveUserId = (req.user && req.user.role === 'admin' && req.body.user_id)
    ? req.body.user_id
    : (req.user ? req.user.id : req.body.user_id);

  const {
    applicant_name,
    email,
    student_id_num,
    vehicle_type,
    vehicle_make,
    plate_number,
    or_number,
    cr_number,
    license_number
  } = req.body;

  const user_id = effectiveUserId;

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

  const applicationData = {
    user_id,
    applicant_name: applicant_name || 'UMak Applicant',
    email: email || '',
    student_id_num: student_id_num.trim(),
    vehicle_type: vehicle_type || 'car',
    vehicle_make: vehicle_make || 'Standard Vehicle',
    plate_number: plate_number.trim().toUpperCase(),
    or_number: or_number || 'OR-PENDING',
    cr_number: cr_number || 'CR-PENDING',
    license_number: license_number || 'LIC-PENDING',
    amount: 200.00,
    payment_method: null,
    payment_ref_no: null,
    payment_status: 'unpaid',
    student_id_doc,
    or_cr_doc,
    license_doc,
    payment_proof_doc: null,
    status: 'pending_review'
  };

  stickerModel.getByUserId(user_id, (err, existing) => {
    if (err) return handleServerError(res, err, 'Failed to check existing sticker applications.');

    const isWithinOneYear = (dateStr) => {
      if (!dateStr) return true;
      const createdDate = new Date(dateStr);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return createdDate >= oneYearAgo;
    };

    // If there is an existing application in pending_review or rejected (allow resubmission)
    const pendingOrRejected = (existing || []).find(s => s.status === 'pending_review' || s.status === 'pending' || s.status === 'rejected');

    if (pendingOrRejected) {
      const updateData = {
        applicant_name: applicant_name || pendingOrRejected.applicant_name,
        email: email || pendingOrRejected.email,
        student_id_num: student_id_num ? student_id_num.trim() : pendingOrRejected.student_id_num,
        plate_number: plate_number ? plate_number.trim().toUpperCase() : pendingOrRejected.plate_number,
        vehicle_type: vehicle_type || pendingOrRejected.vehicle_type,
        vehicle_make: vehicle_make || pendingOrRejected.vehicle_make,
        or_number: or_number || pendingOrRejected.or_number,
        cr_number: cr_number || pendingOrRejected.cr_number,
        license_number: license_number || pendingOrRejected.license_number,
        status: 'pending_review',
        rejection_reason: null // Clear previous rejection reason upon resubmission
      };

      if (student_id_doc) updateData.student_id_doc = student_id_doc;
      if (or_cr_doc) updateData.or_cr_doc = or_cr_doc;
      if (license_doc) updateData.license_doc = license_doc;

      stickerModel.updatePendingApplication(pendingOrRejected.id, updateData, (updErr) => {
        if (updErr) return handleServerError(res, updErr, 'Failed to update sticker application.');

        return res.json({
          message: 'Documents submitted successfully! The OHSO team will review your application and send you an email once verified.',
          applicationId: pendingOrRejected.id,
          status: 'pending_review'
        });
      });
      return;
    }

    const activeSticker = (existing || []).find(s => {
      if (s.status === 'expired' || s.status === 'rejected') return false;
      if ((s.status === 'approved' || s.status === 'paid' || s.status === 'claimed' || s.status === 'issued') && !isWithinOneYear(s.created_at)) {
        return false;
      }
      return s.status === 'approved' || s.status === 'paid' || s.status === 'claimed' || s.status === 'issued';
    });

    if (activeSticker) {
      if (activeSticker.status === 'approved' && activeSticker.payment_status !== 'paid') {
        return res.status(400).json({
          error: 'Your application has already been approved! Please proceed with payment in your portal.'
        });
      }
      return res.status(400).json({
        error: 'You already have an active vehicle sticker valid for 1 year.'
      });
    }

    stickerModel.createApplication(applicationData, (createErr, result) => {
      if (createErr) return handleServerError(res, createErr, 'Failed to submit sticker application.');

      logAudit({
        req,
        category: 'sticker',
        action: 'STICKER_APPLIED',
        targetType: 'sticker',
        targetId: result.insertId,
        actor: { id: user_id, email, role: req.user ? req.user.role : 'student' },
        description: `Applied for vehicle sticker (${plate_number})`
      });

      res.status(201).json({
        message: 'Documents submitted successfully! The OHSO team will review your application and send you an email once verified.',
        applicationId: result.insertId,
        status: 'pending_review'
      });
    });
  });
};

// 2. PAY FOR APPROVED STICKER (ONLINE PAYMONGO + MANDATORY PROOF UPLOAD)
const payApprovedSticker = async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const { applicationId, payment_method, payment_ref_no, paymongo_session_id } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (!applicationId) {
    return res.status(400).json({ error: 'Application ID is required.' });
  }

  // Handle payment proof upload
  const files = req.files || {};
  const payment_proof_doc = files.payment_proof_doc ? encryptAES256(`/uploads/documents/${files.payment_proof_doc[0].filename}`) : null;

  db.query('SELECT * FROM vehicle_stickers WHERE id = ?', [applicationId], async (err, rows) => {
    if (err) return handleServerError(res, err, 'Database error.');
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const app = rows[0];

    // Authorization check
    if (req.user.role !== 'admin' && String(app.user_id) !== String(userId)) {
      return res.status(403).json({ error: 'Unauthorized to pay for this application.' });
    }

    // Verify it is approved or resubmitting payment proof
    if (app.payment_status === 'paid' && (app.status === 'ready_for_release' || app.status === 'claimed' || app.status === 'issued')) {
      return res.status(400).json({ error: 'This application has already been verified and paid.' });
    }

    if (app.status !== 'approved' && app.status !== 'payment_submitted' && app.status !== 'payment_held') {
      return res.status(400).json({ error: 'This application is not ready for payment submission.' });
    }

    if (!payment_proof_doc && !app.payment_proof_doc) {
      return res.status(400).json({ error: 'Proof of payment screenshot is required.' });
    }

    // PayMongo session verification if session_id passed
    let confirmedRef = payment_ref_no;
    if (paymongo_session_id) {
      try {
        const sessionInfo = await paymongoService.retrieveCheckoutSession(paymongo_session_id);
        if (sessionInfo && sessionInfo.paymentId) {
          confirmedRef = sessionInfo.paymentId;
        }
      } catch (pmErr) {
        console.warn('[PAYMONGO VERIFY WARN]:', pmErr.message);
      }
    }

    const finalRefNo = confirmedRef || app.payment_ref_no || `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalMethod = payment_method || app.payment_method || 'gcash';

    const updateFields = {
      payment_method: finalMethod,
      payment_ref_no: finalRefNo,
      payment_status: 'pending', // Pending admin verification
      status: 'payment_submitted',
      admin_remarks: app.status === 'payment_held'
        ? 'Payment proof resubmitted by applicant. Awaiting OHSO re-verification.'
        : (app.admin_remarks || 'Payment proof submitted. Awaiting OHSO verification.'),
      rejection_reason: null
    };

    if (payment_proof_doc) {
      updateFields.payment_proof_doc = payment_proof_doc;
    }

    stickerModel.updatePendingApplication(app.id, updateFields, (updateErr) => {
      if (updateErr) return handleServerError(res, updateErr, 'Failed to update payment status.');

      logAudit({
        req,
        category: 'sticker',
        action: 'PAYMENT_SUBMITTED',
        targetType: 'sticker',
        targetId: app.id,
        actor: { id: userId, email: app.email, role: req.user ? req.user.role : 'student' },
        description: `Submitted payment proof (₱${app.amount || 200})`
      });

      // Dispatch receipt acknowledgement email
      emailService.sendPaymentConfirmationEmail({
        toEmail: app.email,
        applicantName: app.applicant_name,
        studentIdNum: app.student_id_num,
        paymentRefNo: finalRefNo,
        paymentMethod: finalMethod,
        amountPaid: app.amount || 200.00,
        vehicleType: app.vehicle_type,
        vehicleMake: app.vehicle_make,
        plateNumber: app.plate_number
      }).catch(e => console.error('[EMAIL RECEIPT WARN]', e.message));

      res.json({
        message: 'Payment and proof submitted successfully! OHSO admin will verify your payment and prepare your sticker for release.',
        applicationId: app.id,
        paymentRefNo: finalRefNo,
        paymentStatus: 'pending',
        status: 'payment_submitted'
      });
    });
  });
};

// 2B. ADMIN VERIFY PAYMENT (Sets to ready_for_release or hold/rejected)
const verifyPaymentAdmin = (req, res) => {
  const { id, action, rejection_reason } = req.body; // action: 'approve' | 'reject' | 'hold'

  if (!id || !action) {
    return res.status(400).json({ error: 'Application ID and action are required.' });
  }

  db.query('SELECT * FROM vehicle_stickers WHERE id = ?', [id], (err, rows) => {
    if (err) return handleServerError(res, err, 'Database error.');
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const app = rows[0];

    if (action === 'approve') {
      const stickerNumber = app.sticker_number || generateStickerNumber(app.vehicle_type || 'car');
      const updateData = {
        payment_status: 'paid',
        status: 'ready_for_release',
        sticker_number: stickerNumber,
        admin_remarks: 'Payment proof verified by OHSO. Sticker is ready for release.'
      };

      stickerModel.updatePendingApplication(app.id, updateData, (updErr) => {
        if (updErr) return handleServerError(res, updErr, 'Failed to update payment verification.');

        logAudit({
          req,
          category: 'admin',
          action: 'PAYMENT_VERIFIED',
          targetType: 'sticker',
          targetId: app.id,
          description: `Verified payment, issued sticker #${stickerNumber}`
        });

        // Dispatch Ready for Release Email
        emailService.sendStickerReadyForReleaseEmail({
          toEmail: app.email,
          applicantName: app.applicant_name,
          studentIdNum: app.student_id_num,
          stickerNumber: stickerNumber,
          vehicleType: app.vehicle_type,
          plateNumber: app.plate_number,
          claimDate: app.claim_date
        }).catch(e => console.error('[EMAIL READY FOR RELEASE WARN]', e.message));

        res.json({
          message: 'Payment verified successfully! Sticker is now marked Ready for Release.',
          stickerNumber,
          status: 'ready_for_release',
          paymentStatus: 'paid',
          applicantName: app.applicant_name
        });
      });
    } else if (action === 'hold' || action === 'reject') {
      const reason = rejection_reason || 'Payment proof was unclear or invalid. Please re-upload your valid payment receipt.';
      const updateData = {
        payment_status: 'pending',
        status: 'payment_held', // Explicitly marked as payment_held
        admin_remarks: `Payment verification placed on hold: ${reason}`,
        rejection_reason: reason
      };

      stickerModel.updatePendingApplication(app.id, updateData, (updErr) => {
        if (updErr) return handleServerError(res, updErr, 'Failed to update payment status to hold.');

        logAudit({
          req,
          category: 'admin',
          action: 'PAYMENT_HOLD',
          targetType: 'sticker',
          targetId: app.id,
          description: 'Placed payment proof on hold'
        });

        // Dispatch Payment Hold Email
        emailService.sendPaymentHoldEmail({
          toEmail: app.email,
          applicantName: app.applicant_name,
          studentIdNum: app.student_id_num,
          paymentRefNo: app.payment_ref_no,
          paymentMethod: app.payment_method,
          vehicleType: app.vehicle_type,
          vehicleMake: app.vehicle_make,
          plateNumber: app.plate_number,
          holdReason: reason,
          claimDate: app.claim_date
        }).catch(e => console.error('[EMAIL PAYMENT HOLD WARN]', e.message));

        res.json({
          message: 'Payment verification placed on hold. Applicant notified via email.',
          status: 'payment_held',
          paymentStatus: 'pending',
          applicantName: app.applicant_name
        });
      });
    } else {
      res.status(400).json({ error: 'Invalid action. Must be "approve", "reject", or "hold".' });
    }
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

  if (req.user && req.user.role !== 'admin' && String(req.user.id) !== String(userId)) {
    return res.status(403).json({ error: 'Access denied: You can only view your own vehicle sticker applications.' });
  }

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
  const { id, status, admin_remarks, vehicle_type, claim_date, rejection_reason } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'Application ID and status are required.' });
  }

  let stickerNumber = null;
  if (status === 'approved' || status === 'issued' || status === 'claimed') {
    stickerNumber = generateStickerNumber(vehicle_type || 'car');
  }

  stickerModel.updateStatus(id, status, stickerNumber, admin_remarks || '', claim_date || null, rejection_reason || null, (err, result) => {
    if (err) return handleServerError(res, err, 'Failed to update sticker application status.');

    // Fetch sticker application record to send email notification and log audit
    db.query('SELECT * FROM vehicle_stickers WHERE id = ?', [id], (findErr, rows) => {
      if (!findErr && rows && rows[0]) {
        const stk = rows[0];

        logAudit({
          req,
          category: 'admin',
          action: status === 'approved' ? 'STICKER_APPROVED' : status === 'rejected' ? 'STICKER_REJECTED' : 'STICKER_UPDATED',
          targetType: 'sticker',
          targetId: stk.id,
          description: status === 'approved' ? 'Approved sticker application' : status === 'rejected' ? 'Rejected sticker application' : `Updated sticker status to ${status}`
        });

        emailService.sendStickerStatusEmail(
          stk.email,
          stk.applicant_name,
          status,
          stickerNumber || stk.sticker_number,
          stk.vehicle_type,
          stk.plate_number,
          claim_date || stk.claim_date,
          rejection_reason || stk.rejection_reason
        ).catch(console.error);
      }
    });

    res.json({
      message: `Sticker application ${status} successfully.`,
      stickerNumber,
      claim_date: claim_date || null
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
    const isApprovedOrIssued = ['approved', 'issued', 'paid', 'claimed', 'ready_for_release'].includes(record.status);

    const issueDate = new Date(record.created_at);
    const expireDate = new Date(issueDate);
    expireDate.setFullYear(expireDate.getFullYear() + 1);

    // Data Privacy Act (RA 10173) PII Masking for public scanner display
    const maskName = (name) => {
      if (!name) return 'UMak Heron';
      const parts = name.trim().split(/\s+/);
      return parts.map(p => {
        if (p.length <= 2) return p;
        return p[0] + '*'.repeat(Math.min(p.length - 2, 4)) + p[p.length - 1];
      }).join(' ');
    };

    const maskStudentId = (id) => {
      if (!id) return 'N/A';
      const clean = id.trim();
      if (clean.length <= 4) return '****';
      return clean.slice(0, 3) + '****' + clean.slice(-2);
    };

    res.json({
      isValid: isApprovedOrIssued && !isExpired,
      status: record.status,
      isExpired: isExpired,
      stickerNumber: record.sticker_number || 'PENDING ASSIGNMENT',
      paymentRefNo: record.payment_ref_no,
      applicantName: maskName(record.applicant_name),
      studentIdNum: maskStudentId(record.student_id_num),
      vehicleType: record.vehicle_type,
      vehicleMake: record.vehicle_make,
      plateNumber: record.plate_number,
      paymentStatus: record.payment_status,
      claimDate: record.claim_date,
      issuedAt: record.created_at,
      expiresAt: expireDate.toISOString(),
      verifiedAt: new Date().toISOString()
    });
  });
};

module.exports = {
  applySticker,
  payApprovedSticker,
  verifyPaymentAdmin,
  getUserStickers,
  getAllStickersAdmin,
  updateStickerStatusAdmin,
  verifyStickerPublic
};
