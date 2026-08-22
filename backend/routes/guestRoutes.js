const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');

router.post('/create', guestController.createReservation);
router.get('/user/:email', guestController.getReservationsByEmail);
router.get('/admin/all', guestController.getAllReservationsAdmin);
router.post('/admin/update-status', guestController.updateReservationStatusAdmin);

module.exports = router;
