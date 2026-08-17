const stickerModel = require('../models/stickerModel');

const generateRefNo = (method) => {
  const prefix = method ? method.toUpperCase() : 'PAY';
  const randomStr = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${Date.now().toString().slice(-6)}-${randomStr}`;
};

const generateStickerNumber = (vehicleType) => {
  const code = vehicleType === 'car' ? 'CAR' : vehicleType === 'motorcycle' ? 'MC' : 'EB';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `UMAK-2026-${code}-${randomNum}`;
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

  if (!user_id || !applicant_name || !email || !student_id_num || !plate_number || !payment_method) {
    return res.status(400).json({ error: 'Please provide all required vehicle & payment details.' });
  }

  // Extract uploaded document filenames if present
  let student_id_doc = null;
  let or_cr_doc = null;
  let license_doc = null;

  if (req.files) {
    if (req.files.student_id_doc && req.files.student_id_doc[0]) {
      student_id_doc = `/uploads/documents/${req.files.student_id_doc[0].filename}`;
    }
    if (req.files.or_cr_doc && req.files.or_cr_doc[0]) {
      or_cr_doc = `/uploads/documents/${req.files.or_cr_doc[0].filename}`;
    }
    if (req.files.license_doc && req.files.license_doc[0]) {
      license_doc = `/uploads/documents/${req.files.license_doc[0].filename}`;
    }
  }

  const payment_ref_no = generateRefNo(payment_method);

  const applicationData = {
    user_id,
    applicant_name: applicant_name.trim(),
    email: email.trim().toLowerCase(),
    student_id_num: student_id_num.trim(),
    vehicle_type: vehicle_type || 'car',
    vehicle_make: vehicle_make || 'Standard Vehicle',
    plate_number: plate_number.trim().toUpperCase(),
    or_number: or_number || 'OR-PENDING',
    cr_number: cr_number || 'CR-PENDING',
    license_number: license_number || 'LIC-PENDING',
    amount: 200.00,
    payment_method,
    payment_ref_no,
    payment_status: 'paid',
    student_id_doc,
    or_cr_doc,
    license_doc
  };

  stickerModel.createApplication(applicationData, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({
      message: 'Vehicle sticker payment & secure document upload successful! Pending OHSO approval.',
      applicationId: result.insertId,
      paymentRefNo: payment_ref_no,
      amount: 200.00
    });
  });
};

const getUserStickers = (req, res) => {
  const userId = req.params.userId;
  stickerModel.getByUserId(userId, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

const getAllStickersAdmin = (req, res) => {
  stickerModel.getAllApplications((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
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
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      message: `Sticker application ${status} successfully.`,
      stickerNumber
    });
  });
};

module.exports = { applySticker, getUserStickers, getAllStickersAdmin, updateStickerStatusAdmin };
