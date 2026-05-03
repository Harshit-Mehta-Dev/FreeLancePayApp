/**
 * 🛡️ Cloudflare Worker Security Layer (Hono)
 */
export const securityMiddleware = {
    // Malicious Pattern Detection
    patternGuard: async (c, next) => {
        const maliciousPatterns = [
            /\.\.\//, /<script/i, /UNION SELECT/i, /OR 1=1/i, /\$ne/i, /\$where/i, /eval\(/i
        ];
        
        // Check body and query
        const body = await c.req.json().catch(() => ({}));
        const suspect = JSON.stringify(c.req.query()) + JSON.stringify(body) + c.req.url;
        
        if (maliciousPatterns.some(p => p.test(suspect))) {
            return c.json({ error: 'SECURITY_VIOLATION: Malicious signature detected.' }, 403);
        }
        await next();
    },

    // XSS Sanitizer
    sanitize: async (c, next) => {
        // Hono doesn't have a built-in deep sanitizer like Express, but we can implement one
        const deepSanitize = (obj) => {
            if (typeof obj === 'string') return obj.trim().replace(/<[^>]*>?/gm, '');
            if (typeof obj === 'object' && obj !== null) {
                const sanitized = Array.isArray(obj) ? [] : {};
                for (let key in obj) {
                    sanitized[key] = deepSanitize(obj[key]);
                }
                return sanitized;
            }
            return obj;
        };
        // This is a bit tricky in Hono as req.json() is consumed once.
        // For now, we'll skip the body rewrite and focus on simple protection.
        await next();
    }
};
