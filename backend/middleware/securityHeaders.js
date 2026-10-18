
const helmet = require('helmet');

const securityHeaders = helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "https:", "http:", "data:", "blob:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com", "https://maps.google.com", "https://accounts.google.com"],
            scriptSrcElem: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://maps.google.com", "https://accounts.google.com"],
            frameSrc: ["'self'", "https://maps.google.com", "https://www.google.com", "https://accounts.google.com"],
            imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
            connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            fontSrc: ["'self'", "https:", "data:"]
        }
    }
});

module.exports = securityHeaders;
