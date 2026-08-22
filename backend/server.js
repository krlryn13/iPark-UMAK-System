const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./config/db');
const parkingRoutes = require('./routes/parkingRoutes');
const authRoutes = require('./routes/authRoutes');
const stickerRoutes = require('./routes/stickerRoutes');
const guestRoutes = require('./routes/guestRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('iPark UMAK API is running...');
});

app.use('/api', parkingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stickers', stickerRoutes);
app.use('/api/guests', guestRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});