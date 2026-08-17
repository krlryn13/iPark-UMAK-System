const express = require('express');
const router = express.Router();
const stickerController = require('../controllers/stickerController');
const uploadSecurity = require('../middleware/uploadMiddleware');

const documentUpload = uploadSecurity.fields([
  { name: 'student_id_doc', maxCount: 1 },
  { name: 'or_cr_doc', maxCount: 1 },
  { name: 'license_doc', maxCount: 1 }
]);

// Wrapper to handle Multer security errors gracefully
const handleUploadMiddleware = (req, res, next) => {
  documentUpload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Security Limit Exceeded: Document file size must not exceed 5MB.' });
      }
      return res.status(400).json({ error: err.message || 'File upload error.' });
    }
    next();
  });
};

router.post('/apply', handleUploadMiddleware, stickerController.applySticker);
router.get('/user/:userId', stickerController.getUserStickers);
router.get('/admin/all', stickerController.getAllStickersAdmin);
router.post('/admin/update', stickerController.updateStickerStatusAdmin);

module.exports = router;
