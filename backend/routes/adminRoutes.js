const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Every route here is admin-only
router.use(authenticateToken, requireRole('admin'));

router.get('/analytics', adminController.getAnalytics);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/reports/:type', adminController.getReport);

module.exports = router;
