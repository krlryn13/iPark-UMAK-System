

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            name: decoded.name || '',
            email: decoded.email,
            role: decoded.role
        };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Session expired. Please sign in again.' });
        }
        return res.status(401).json({ error: 'Invalid authentication token.' });
    }
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Access denied. Authentication required.' });
        }
        if (req.user.role !== role) {
            return res.status(403).json({ error: `Access denied. ${role.charAt(0).toUpperCase() + role.slice(1)} privileges required.` });
        }
        next();
    };
};

module.exports = { authenticateToken, requireRole };
