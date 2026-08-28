const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { authLimiter, resendLimiter } = require('../middleware/rateLimiter');

// Public auth endpoints (with rate limiting)
router.post('/register', authLimiter, authController.register);
router.post('/verify', authLimiter, authController.verifyCode);
router.post('/resend-code', resendLimiter, authController.resendCode);
router.post('/login', authLimiter, authController.login);
router.post('/request-unlock', authLimiter, authController.requestUnlock);

// Password Reset Endpoints (Forgot Password Flow)
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/verify-reset-otp', authLimiter, authController.verifyResetOtp);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Google OAuth 2.0 Sign-In Endpoint
router.post('/google-login', authLimiter, authController.googleLogin);

// Protected — validate token and return user data
router.get('/me', authenticateToken, authController.getMe);

// Admin only — User Security & Unlock Management
router.get('/admin/users', authenticateToken, requireRole('admin'), authController.getAllUsersAdmin);
router.post('/admin/unlock-user', authenticateToken, requireRole('admin'), authController.adminUnlockUser);

module.exports = router;
