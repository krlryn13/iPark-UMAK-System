/**
 * Rate Limiter Middleware
 * Tiered rate limiting to prevent brute force attacks and API abuse.
 * 
 * Exports:
 *   globalLimiter  — 100 requests / 15 min per IP (all API routes)
 *   authLimiter    — 5 attempts / 15 min per IP (login, register, verify)
 *   resendLimiter  — 3 attempts / 15 min per IP (resend verification code)
 */

const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.includes('/lots') || req.path.includes('/slots'),
    message: { error: 'Too many requests. Please try again after 15 minutes.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again after 15 minutes.' }
});

const resendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many code resend requests. Please try again after 15 minutes.' }
});

module.exports = { globalLimiter, authLimiter, resendLimiter };
