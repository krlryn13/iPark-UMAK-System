const express = require('express');
const router = express.Router();
const stickerController = require('../controllers/stickerController');
const uploadSecurity = require('../middleware/uploadMiddleware');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const documentUpload = uploadSecurity.fields([
  { name: 'student_id_doc', maxCount: 1 },
  { name: 'or_cr_doc', maxCount: 1 },
  { name: 'license_doc', maxCount: 1 },
  { name: 'payment_proof_doc', maxCount: 1 }
]);

// Wrapper to handle Multer security errors gracefully
const handleUploadMiddleware = (req, res, next) => {
  documentUpload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Security Limit Exceeded: Document file size must not exceed 5MB.' });
      }
      return res.status(400).json({ error: 'Failed to process document upload. Please ensure files are PNG, JPG, or PDF under 5MB.' });
    }
    next();
  });
};

// Public verification for Security Guards / Scanners
router.get('/verify/:identifier', stickerController.verifyStickerPublic);

// Authenticated user
router.post('/apply', authenticateToken, handleUploadMiddleware, stickerController.applySticker);
router.post('/pay', authenticateToken, handleUploadMiddleware, stickerController.payApprovedSticker);
router.get('/user/:userId', authenticateToken, stickerController.getUserStickers);

// Admin only
router.get('/admin/all', authenticateToken, requireRole('admin'), stickerController.getAllStickersAdmin);
router.post('/admin/update', authenticateToken, requireRole('admin'), stickerController.updateStickerStatusAdmin);
router.post('/admin/verify-payment', authenticateToken, requireRole('admin'), stickerController.verifyPaymentAdmin);

module.exports = router;
