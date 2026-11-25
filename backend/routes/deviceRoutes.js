const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const authenticateDevice = require('../middleware/deviceAuthMiddleware');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public/Website endpoints for live monitoring
router.get('/state', deviceController.getLiveState);

// ESP32 Device endpoints (Secured by X-API-KEY)
router.post('/events', authenticateDevice, deviceController.ingestEvent);
router.post('/heartbeat', authenticateDevice, deviceController.heartbeat);
router.get('/sync-cards', authenticateDevice, deviceController.syncCards);

// Admin-only endpoints for monitoring & command dispatch
router.get('/admin/events', authenticateToken, requireRole('admin'), deviceController.getEventsAndWarnings);
router.post('/admin/command', authenticateToken, requireRole('admin'), deviceController.sendCommand);

module.exports = router;
