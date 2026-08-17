const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');

router.get('/lots', parkingController.getLots);
router.get('/slots', parkingController.getSlots);
router.get('/lots/:lotId/slots', parkingController.getSlotsByLotId);

module.exports = router;