const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public — guests don't need an account
router.post('/create', guestController.createReservation);

// Authenticated user
router.get('/user/:email', authenticateToken, guestController.getReservationsByEmail);

// Admin only
router.get('/admin/all', authenticateToken, requireRole('admin'), guestController.getAllReservationsAdmin);
router.post('/admin/update-status', authenticateToken, requireRole('admin'), guestController.updateReservationStatusAdmin);
router.post('/admin/claim-card', authenticateToken, requireRole('admin'), guestController.claimCard);
router.post('/admin/surrender-card', authenticateToken, requireRole('admin'), guestController.surrenderCard);
router.get('/admin/available-cards', authenticateToken, requireRole('admin'), guestController.getAvailableCards);

module.exports = router;
