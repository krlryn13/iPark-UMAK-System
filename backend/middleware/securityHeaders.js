/**
 * Security Headers Middleware
 * Uses helmet to set HTTP security headers:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: SAMEORIGIN
 * - X-XSS-Protection
 * - Strict-Transport-Security
 * - And more...
 */

const helmet = require('helmet');

const securityHeaders = helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow static file serving for uploads
});

module.exports = securityHeaders;
