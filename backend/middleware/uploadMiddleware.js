const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Extract & sanitize applicant name
    const rawName = req.body?.applicant_name || req.body?.name || 'Heron_User';
    const safeName = rawName.trim().replace(/[^a-zA-Z0-9]/g, '_');
    
    // Friendly document type label
    const docType = file.fieldname === 'student_id_doc' ? 'Student_ID'
      : file.fieldname === 'or_cr_doc' ? 'LTO_OR_CR'
      : file.fieldname === 'license_doc' ? 'Drivers_License'
      : file.fieldname === 'payment_proof_doc' ? 'Payment_Receipt'
      : file.fieldname.replace(/[^a-zA-Z0-9]/g, '_');

    const uniqueSuffix = Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
    cb(null, `${safeName}_${docType}_${uniqueSuffix}${ext}`);
  }
});

// Strict MIME type & Extension Filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Security Error: Invalid file type! Only JPG, PNG, WEBP, and PDF documents are allowed.'), false);
  }
};

// Multer Upload Instance with 5MB Limit
const uploadSecurity = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB Limit per file
  },
  fileFilter: fileFilter
});

module.exports = uploadSecurity;
