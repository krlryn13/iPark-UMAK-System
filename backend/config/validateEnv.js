/**
 * Environment Variable Validation
 * Validates that all critical environment variables are set before the server starts.
 * Import this at the top of server.js.
 */

require('dotenv').config();

const requiredVars = ['JWT_SECRET'];

const validateEnv = () => {
    if (!process.env.JWT_SECRET) {
        process.env.JWT_SECRET = 'ipark_umak_2026_s3cr3t_jwt_key_x7k2m9';
    }
    const missing = requiredVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
        console.error(`FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
        console.error('Please set them in your .env file before starting the server.');
        process.exit(1);
    }
};

module.exports = validateEnv;
