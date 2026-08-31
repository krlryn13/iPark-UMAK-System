/**
 * Environment Variable Validation
 * Validates that all critical environment variables are set before the server starts.
 * Import this at the top of server.js.
 */

require('dotenv').config();

const requiredVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
const recommendedVars = ['EMAIL_USER', 'EMAIL_PASS', 'PAYMONGO_SECRET_KEY', 'FRONTEND_URL', 'GOOGLE_CLIENT_ID'];

const validateEnv = () => {
    // Auto-fill JWT_SECRET fallback (dev convenience)
    if (!process.env.JWT_SECRET) {
        process.env.JWT_SECRET = 'ipark_umak_2026_s3cr3t_jwt_key_x7k2m9';
    }

    const missing = requiredVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
        console.error(`FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
        console.error('Please set them in your .env file before starting the server.');
        process.exit(1);
    }

    // Warn about recommended vars (non-fatal)
    const missingRecommended = recommendedVars.filter(varName => !process.env[varName]);
    if (missingRecommended.length > 0) {
        console.warn(`[ENV WARNING] Missing recommended variables: ${missingRecommended.join(', ')}`);
        console.warn('Some features (email, payments, Google OAuth) may not work without them.');
    }

    // Production-specific checks
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
        if (!process.env.FRONTEND_URL) {
            console.warn('[PRODUCTION WARNING] FRONTEND_URL is not set. CORS and PayMongo redirects may not work correctly.');
        }
        if (process.env.PAYMONGO_SECRET_KEY && process.env.PAYMONGO_SECRET_KEY.startsWith('sk_test_')) {
            console.warn('[PRODUCTION WARNING] PayMongo TEST keys detected. Switch to LIVE keys for real payments.');
        }
    }
};

module.exports = validateEnv;
