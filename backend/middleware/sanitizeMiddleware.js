/**
 * Input Sanitization Middleware
 * Defense-in-depth layer that sanitizes all incoming request data.
 * Strips HTML tags, trims whitespace, and prevents XSS payloads.
 */

// Strip HTML tags from a string (prevent stored XSS)
const stripHtmlTags = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<[^>]*>/g, '');
};

// Recursively sanitize all string values in an object
const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
        return stripHtmlTags(obj).trim();
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key of Object.keys(obj)) {
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }
    return obj;
};

const sanitizeInputs = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};

module.exports = sanitizeInputs;
