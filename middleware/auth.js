const { db } = require('../database');
const jwt = require('jsonwebtoken');

/**
 * 🔒 Authentication & Authorization Middleware
 */
const authMiddleware = {
    // Main Auth Guard
    auth: async (req, res, next) => {
        const token = req.cookies.fp_token;
        if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' });
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await db('users').where({ id: decoded.id }).first();
            if (!user) throw new Error('Ghost Token');
            
            req.user = { ...decoded, email_verified: user.email_verified, role: user.role };
            next();
        } catch (err) {
            res.clearCookie('fp_token');
            res.status(401).json({ error: 'SESSION_INVALID' });
        }
    },

    // Verified Email Guard
    verifiedOnly: (req, res, next) => {
        if (!req.user.email_verified) {
            return res.status(403).json({ error: 'VERIFICATION_REQUIRED' });
        }
        next();
    },

    // Admin Guard
    adminOnly: (req, res, next) => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ADMIN_ACCESS_REQUIRED' });
        }
        next();
    },

    // Bot Guard
    botGuard: (req, res, next) => {
        const userAgent = req.headers['user-agent'] || '';
        const botPatterns = [/headless/i, /bot/i, /crawl/i, /spider/i, /python/i, /curl/i, /postman/i];
        if (botPatterns.some(p => p.test(userAgent))) {
            return res.status(403).json({ error: 'BOT_DETECTION: Automated access prohibited.' });
        }
        next();
    }
};

module.exports = authMiddleware;
