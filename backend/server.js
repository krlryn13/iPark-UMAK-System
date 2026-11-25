const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const validateEnv = require('./config/validateEnv');
validateEnv();

const db = require('./config/db');
const securityHeaders = require('./middleware/securityHeaders');
const sanitizeInputs = require('./middleware/sanitizeMiddleware');
const { globalLimiter } = require('./middleware/rateLimiter');
const parkingRoutes = require('./routes/parkingRoutes');
const authRoutes = require('./routes/authRoutes');
const stickerRoutes = require('./routes/stickerRoutes');
const guestRoutes = require('./routes/guestRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(securityHeaders);

// CORS — allow localhost for dev, and FRONTEND_URL for production (Vercel)
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://192.168.1.13:5173',
    'http://192.168.1.13:5174',
    process.env.FRONTEND_URL
].filter(Boolean).map(url => url.replace(/\/+$/, ''));

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/+$/, '');
        if (allowedOrigins.includes(cleanOrigin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInputs);
app.use('/api', globalLimiter);

// Secure document serving endpoint with authentication & Data Privacy Act enforcement
const { serveProtectedDocument } = require('./middleware/documentAuthMiddleware');
app.get('/uploads/documents/:filename', serveProtectedDocument);
app.get('/uploads/:filename', serveProtectedDocument);

app.use('/api', parkingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stickers', stickerRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/device', deviceRoutes);

// Diagnostic DB Health Check endpoint (Safe generic response)
app.get('/api/db-health', (req, res) => {
    db.query('SELECT 1 + 1 AS result', (err, rows) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Database connection failed'
            });
        }
        res.json({
            status: 'ok',
            message: 'Database pool is connected and operational.'
        });
    });
});

// Diagnostic Email Test endpoint — restricted to authenticated Admin users only
const { authenticateToken, requireRole } = require('./middleware/authMiddleware');
app.get('/api/email-test', authenticateToken, requireRole('admin'), async (req, res) => {
    const toEmail = req.query.email || process.env.EMAIL_USER;
    const { sendVerificationEmail } = require('./services/emailService');
    try {
        await sendVerificationEmail(toEmail, 'Test Admin', '123456');
        res.json({
            status: 'ok',
            message: `Test email sent successfully to ${toEmail}!`
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to send test email via SMTP'
        });
    }
});

// Serve frontend static build in production (Single-Server Deployment)
const frontendDist = path.join(__dirname, '../frontend/dist');
if (require('fs').existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
            return res.sendFile(path.join(frontendDist, 'index.html'));
        }
        next();
    });
} else {
    app.get('/', (req, res) => {
        res.send('iPark UMAK API is running...');
    });
}

app.listen(PORT, async () => {
    console.log(`iPark UMAK Backend Server is running on port ${PORT}`);
    try {
        const { initAuthDB } = require('./init_auth_db');
        const { initGuestDB } = require('./init_guest_db');
        const { initStickersDB } = require('./init_stickers_db');
        const { initAuditDB } = require('./init_audit_db');
        const { seedHPSB } = require('./seed_hpsb');
        
        await initAuthDB();
        await initGuestDB();
        await initStickersDB();
        await initAuditDB();
        await seedHPSB();
        console.log('✓ Automatic Cloud DB Table Initialization & Seeding Completed!');
    } catch (dbInitErr) {
        console.error('[DB AUTO INIT ERROR]', dbInitErr.message);
    }
});