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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(securityHeaders);

// CORS — allow localhost for dev, and FRONTEND_URL for production (Vercel)
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL    // e.g. https://ipark-umak.vercel.app
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
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

// Serve uploaded documents statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads/documents')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads/documents')));

app.use('/api', parkingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stickers', stickerRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/payment', paymentRoutes);

// Diagnostic DB Health Check endpoint
app.get('/api/db-health', (req, res) => {
    db.query('SELECT 1 + 1 AS result', (err, rows) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Database connection failed',
                error: err.message,
                code: err.code,
                host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
                port: process.env.DB_PORT || process.env.MYSQLPORT || 3306
            });
        }
        res.json({
            status: 'ok',
            message: 'Database pool is connected and functioning perfectly!',
            result: rows[0],
            host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
            port: process.env.DB_PORT || process.env.MYSQLPORT || 3306
        });
    });
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});