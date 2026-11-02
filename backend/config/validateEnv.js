

require('dotenv').config();

const validateEnv = () => {
    const host = process.env.DB_HOST || process.env.MYSQLHOST;
    const user = process.env.DB_USER || process.env.MYSQLUSER;
    const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE;
    const jwtSecret = process.env.JWT_SECRET;

    const missing = [];
    if (!host) missing.push('DB_HOST / MYSQLHOST');
    if (!user) missing.push('DB_USER / MYSQLUSER');
    if (!dbName) missing.push('DB_NAME / MYSQLDATABASE');
    if (!jwtSecret) missing.push('JWT_SECRET');

    if (missing.length > 0) {
        console.error(`FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
        console.error('Please set them in your .env file or Render environment variables.');
        process.exit(1);
    }

    // Recommended vars check
    const recommendedVars = ['EMAIL_USER', 'EMAIL_PASS', 'PAYMONGO_SECRET_KEY', 'FRONTEND_URL', 'GOOGLE_CLIENT_ID', 'ENCRYPTION_KEY'];
    const missingRecommended = recommendedVars.filter(varName => !process.env[varName]);
    if (missingRecommended.length > 0) {
        console.warn(`[ENV WARNING] Missing recommended variables: ${missingRecommended.join(', ')}`);
    }
};

module.exports = validateEnv;
