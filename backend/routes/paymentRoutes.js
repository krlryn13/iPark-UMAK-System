const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Protected Payment Endpoints
router.post('/create-checkout', authenticateToken, authLimiter, paymentController.createCheckoutSession);
router.get('/verify-session/:sessionId', authenticateToken, paymentController.verifyCheckoutSession);

module.exports = router;
