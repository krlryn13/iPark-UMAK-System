/**
 * Environment Variable Validation
 * Validates that all critical environment variables are set before the server starts.
 * Import this at the top of server.js.
 */

require('dotenv').config();

const requiredVars = ['JWT_SECRET'];

const validateEnv = () => {
    const missing = requiredVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
        console.error(`FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
        console.error('Please set them in your .env file before starting the server.');
        process.exit(1);
    }
};

module.exports = validateEnv;
