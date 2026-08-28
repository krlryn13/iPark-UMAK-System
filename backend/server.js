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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInputs);
app.use('/api', globalLimiter);

// Serve uploaded documents statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads/documents')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads/documents')));

app.get('/', (req, res) => {
    res.send('iPark UMAK API is running...');
});

app.use('/api', parkingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stickers', stickerRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/payment', paymentRoutes);

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
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});