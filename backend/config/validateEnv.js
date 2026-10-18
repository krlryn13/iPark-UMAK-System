

require('dotenv').config();

const validateEnv = () => {
    // Auto-fill JWT_SECRET fallback (dev convenience)
    if (!process.env.JWT_SECRET) {
        process.env.JWT_SECRET = 'ipark_umak_2026_s3cr3t_jwt_key_x7k2m9';
    }

    const host = process.env.DB_HOST || process.env.MYSQLHOST;
    const user = process.env.DB_USER || process.env.MYSQLUSER;
    const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE;

    const missing = [];
    if (!host) missing.push('DB_HOST / MYSQLHOST');
    if (!user) missing.push('DB_USER / MYSQLUSER');
    if (!dbName) missing.push('DB_NAME / MYSQLDATABASE');

    if (missing.length > 0) {
        console.error(`FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
        console.error('Please set them in your .env file or Render environment variables.');
        process.exit(1);
    }

    // Recommended vars check
    const recommendedVars = ['EMAIL_USER', 'EMAIL_PASS', 'PAYMONGO_SECRET_KEY', 'FRONTEND_URL', 'GOOGLE_CLIENT_ID'];
    const missingRecommended = recommendedVars.filter(varName => !process.env[varName]);
    if (missingRecommended.length > 0) {
        console.warn(`[ENV WARNING] Missing recommended variables: ${missingRecommended.join(', ')}`);
    }
};

module.exports = validateEnv;
