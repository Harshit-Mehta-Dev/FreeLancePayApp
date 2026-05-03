const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { xss } = require('express-xss-sanitizer');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

/**
 * 🛡️ Security Layer (2026 Structural Hardening)
 */
const securityMiddleware = {
    // DDoS Shield
    globalLimiter: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { error: 'Cyber-Cloud: Too many requests. Threshold exceeded.' }
    }),

    // Auth Protection
    authLimiter: rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 10,
        message: { error: 'Authentication flood detected. IP restricted for 1 hour.' }
    }),

    // AI & Expensive Resource Limiter
    aiLimiter: rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 50,
        message: { error: 'AI processing quota exceeded. Please try again in an hour.' }
    }),

    // Suspicious traffic throttle
    speedLimiter: slowDown({
        windowMs: 15 * 60 * 1000,
        delayAfter: 50,
        delayMs: (hits) => hits * 100
    }),

    // XSS & Injection Sanitizer
    sanitizeInput: (req, res, next) => {
        const deepSanitize = (obj) => {
            if (typeof obj === 'string') return obj.trim().replace(/<[^>]*>?/gm, '');
            if (typeof obj === 'object' && obj !== null) {
                const sanitized = Array.isArray(obj) ? [] : {};
                for (let key in obj) {
                    if (key.startsWith('$') || key.includes('.')) continue; // Block NoSQL
                    sanitized[key] = deepSanitize(obj[key]);
                }
                return sanitized;
            }
            return obj;
        };

        if (req.body) req.body = deepSanitize(req.body);
        if (req.query) req.query = deepSanitize(req.query);
        if (req.params) req.params = deepSanitize(req.params);
        next();
    },

    // Malicious Pattern Detection
    patternGuard: (req, res, next) => {
        const maliciousPatterns = [
            /\.\.\//, /<script/i, /UNION SELECT/i, /OR 1=1/i, /\$ne/i, /\$where/i, /eval\(/i
        ];
        const suspect = JSON.stringify(req.query) + JSON.stringify(req.body) + req.url;
        if (maliciousPatterns.some(p => p.test(suspect))) {
            return res.status(403).json({ error: 'SECURITY_VIOLATION: Malicious signature detected.' });
        }
        next();
    }
};

module.exports = securityMiddleware;
