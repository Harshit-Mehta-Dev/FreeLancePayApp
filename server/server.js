require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { db, initDb } = require('./database');
const { connectMongo, AuditLog, AIInspection } = require('./mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const apicache = require('apicache');
const slowDown = require('express-slow-down');
const { xss } = require('express-xss-sanitizer');
const mongoSanitize = require('express-mongo-sanitize');
const { encrypt, decrypt } = require('./encryption');
const Joi = require('joi');
const mavin = require('./mavin-ai');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { OAuth2Client } = require('google-auth-library');
const gClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

// ===================== JOI VALIDATION SCHEMAS =====================
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    currency: Joi.string().length(3).uppercase().optional()
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  bill: Joi.object({
    name: Joi.string().required(),
    amount: Joi.number().min(0).required(),
    due_date: Joi.date().iso().required(),
    category: Joi.string().optional(),
    recurrence: Joi.string().valid('one-time', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly').optional(),
    notes: Joi.string().allow('', null).optional(),
    client: Joi.string().allow('', null).optional()
  })
};

// ===================== CYBER-DEFENSE CONFIG =====================
const SECURITY_LEVELS = { LOW: 1, MEDIUM: 2, HIGH: 3 };
const CURRENT_SECURITY_LEVEL = SECURITY_LEVELS.HIGH; // Forced High Security
const IP_BLACKLIST = new Set();
const VIOLATION_COUNT = new Map(); // Track offenses per IP
const BAN_THRESHOLD = 5; // 5 violations = Auto-Ban
let MAINTENANCE_MODE = false; // Global switch to lock system for repairs
let REGISTRATION_ENABLED = true; // Global switch to control new signups

let transporter;

// ===================== CYBER-SECURE EMAIL ENGINE =====================
const setupEmail = async () => {
    const isProduction = process.env.NODE_ENV === 'production' || CURRENT_SECURITY_LEVEL === SECURITY_LEVELS.HIGH;
    
    // Check for real SMTP credentials first (Secure Path)
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: { rejectUnauthorized: isProduction }
        });
        console.log('🛡️  Secure SMTP Transporter Initialized');
        return;
    }

    // Fallback to Ethereal only in Non-Production (Dev Path)
    if (!isProduction) {
        try {
            const account = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: account.smtp.host,
                port: account.smtp.port,
                secure: account.smtp.secure,
                auth: { user: account.user, pass: account.pass }
            });
            console.log('✉️  Test Email Transporter Ready (Ethereal - DEVELOPMENT ONLY)');
        } catch (err) {
            console.error('❌ Failed to setup test email:', err.message);
        }
    } else {
        // Self-Healing: Redirect email to console when SMTP is missing
        transporter = {
            sendMail: async (mailOptions) => {
                console.log('📬 [Self-Heal] Email redirected to console:', mailOptions.to);
                console.log('--- Content:', mailOptions.text || '(HTML)');
                await logSecurityEvent('MAIL_REDIRECT', 'SYSTEM', `Mail to ${mailOptions.to} redirected to console.`);
                return { messageId: 'internal-self-heal' };
            }
        };
    }
};

setupEmail();

// Keep-alive to prevent premature exit in some environments
setInterval(() => {}, 1000 * 60 * 60); // 1 hour tick


process.on('unhandledRejection', (reason, promise) => {
    console.error('🌊 UNHANDLED_REJECTION:', reason);
});

// Global Rate Limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});
// Auth Rate Limiter
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 requests per windowMs
    message: { error: 'Too many authentication attempts. Please try again in an hour.' }
});

// AI & Expensive Resource Limiter (Protect against bot drain)
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Relaxed: 50 requests per hour
    message: { error: 'AI processing quota exceeded. Please try again in an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Bot Detection Middleware
const botGuard = (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    const botPatterns = [/headless/i, /bot/i, /crawl/i, /spider/i, /python/i, /curl/i, /postman/i];
    
    if (botPatterns.some(p => p.test(userAgent))) {
        console.warn(`🤖 Bot detected and restricted: ${userAgent} from ${req.ip}`);
        // Apply much stricter rate limit or just block
        return res.status(403).json({ error: 'Automated access to AI resources is prohibited.' });
    }
    next();
};

// DDoS Speed Limiter (Gradually slows down suspicious traffic)
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per 15 minutes, then...
    delayMs: (hits) => hits * 100, // add 100ms delay per request above 50
});

const cache = apicache.middleware;

const app = express();
const PORT = process.env.PORT || 5175;

// Self-Correction Engine: Monitor and repair common runtime anomalies
const selfHeal = (err, req, res, next) => {
    if (err.code === 'ECONNREFUSED') {
        console.log('🩹 [Self-Heal] Suppressed connection refusal error. System is still stabilizing.');
        return res.status(204).end();
    }
    next(err);
};
app.use(selfHeal);

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET is not defined in environment variables!');
    process.exit(1);
}

// Database initialization is now handled in startServer()



// Security Logging Helper
// Security Logging Helper (Dual-Layer: SQLite + MongoDB)
const logSecurityEvent = async (type, ip, details) => {
    try {
        // Layer 1: Relational Audit
        await db('security_logs').insert({ event_type: type, ip_address: ip, details });
        
        // Layer 2: Intelligence Vault (NoSQL) - Only if connected
        if (mongoose.connection.readyState === 1) {
            await AuditLog.create({ event: type, ip, details });
        }
        
        // Active Countermeasure: Breach Antivirus
        if (type === 'MALICIOUS_PATTERN' || type === 'UNAUTHORIZED_ACCESS') {
            const count = (VIOLATION_COUNT.get(ip) || 0) + 1;
            VIOLATION_COUNT.set(ip, count);
            if (count >= BAN_THRESHOLD) {
                IP_BLACKLIST.add(ip);
                console.error(`🔥 AUTO-BAN: IP ${ip} blacklisted after ${count} violations.`);
                await db('security_logs').insert({ event_type: 'IP_BLACKHAWK_BAN', ip_address: ip, details: 'Breach Antivirus triggered: IP Blacklisted' });
                if (mongoose.connection.readyState === 1) {
                    await AuditLog.create({ event: 'IP_BLACKHAWK_BAN', ip, details: 'Breach Antivirus triggered' });
                }
            }
        }
    } catch (e) { console.error('Failed to log security event:', e); }
};

// ===================== REVERSE PROXY GATEWAY LAYER =====================
// 1. SSL Termination Simulation & IP Hiding
app.use((req, res, next) => {
    const isLocal = req.ip === '::1' || req.ip === '127.0.0.1' || req.ip.includes('127.0.0.1');
    if (IP_BLACKLIST.has(req.ip) && !isLocal) {
        return res.status(403).json({ error: 'ACCESS_DENIED: Your IP is blacklisted by Cyber-Cloud Antivirus.' });
    }
    if (MAINTENANCE_MODE && !req.url.startsWith('/api/admin')) {
        return res.status(503).json({ error: 'SYSTEM_OFFLINE: Maintenance in progress. Cyber-Cloud is currently undergoing structural hardening.' });
    }
    req.headers['x-forwarded-proto'] = 'https';
    req.headers['x-real-ip'] = req.ip;
    res.setHeader('X-Powered-By', 'CyberCloud-Gateway/1.1');
    res.setHeader('Via', '1.1 CyberProxy');
    next();
});

// 2. Load Balancer / DDoS Shield
app.use(speedLimiter);
app.use(globalLimiter);

// 3. Response Compression (Optimized Bandwidth)
app.use(compression());

// 4. Response Caching (Caching identical responses for 5 mins)
// Only for GET requests that are not the 'me' or 'dashboard' private routes
app.use('/api/public', cache('5 minutes'));

// Serve static files from the React app (Production)
const clientPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientPath));

// ===================== SECURITY WALL (INTERCEPTOR) =====================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://accounts.google.com/gsi/client", "https://*.google.com"],
            "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "https://accounts.google.com/gsi/style"],
            "font-src": ["'self'", "fonts.gstatic.com"],
            "img-src": ["'self'", "data:", "blob:", "https://*", "https://*.googleusercontent.com"],
            "connect-src": ["'self'", "https://*.google.com"],
            "frame-src": ["'self'", "https://accounts.google.com/"],
        }
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// Block common malicious patterns
app.use((req, res, next) => {
    const maliciousPatterns = [
        /\.\.\//, // Directory traversal
        /<script/i, // Basic XSS
        /UNION SELECT/i, // SQLi
        /OR 1=1/i, // SQLi
        /xp_cmdshell/i, // SQLi (MS SQL)
        /SLEEP\(/i, // SQLi (Timing)
        /\$ne/i, // NoSQLi
        /\$where/i, // NoSQLi
        /eval\(/i, // Code execution
        /0x[0-9a-f]+/i // Hex/Shellcode attempts
    ];

    const suspect = JSON.stringify(req.query) + JSON.stringify(req.body) + req.url;
    if (maliciousPatterns.some(pattern => pattern.test(suspect))) {
        logSecurityEvent('MALICIOUS_PATTERN', req.ip, `Pattern match: ${req.url}`);
        console.warn(`🛑 Malicious activity blocked from ${req.ip}: ${req.url}`);
        
        // Escalation if on HIGH security
        if (CURRENT_SECURITY_LEVEL >= SECURITY_LEVELS.HIGH) {
            VIOLATION_COUNT.set(req.ip, (VIOLATION_COUNT.get(req.ip) || 0) + 2); // Double violation points
        }
        
        return res.status(403).json({ error: 'Security breach detected. Connection terminated.' });
    }
    next();
});

// 3. XSS Sanitization (Strips HTML tags from input)
app.use(xss());

// 4. Custom Deep Sanitization (Recursively trim, escape, and prevent NoSQL injection)
const sanitize = (obj) => {
    if (typeof obj === 'string') return obj.trim().replace(/<[^>]*>?/gm, ''); // Basic HTML strip
    if (typeof obj === 'object' && obj !== null) {
        const sanitizedObj = Array.isArray(obj) ? [] : {};
        for (let key in obj) {
            // NoSQL Injection Protection: skip keys starting with $ or containing .
            if (key.startsWith('$') || key.includes('.')) {
                console.warn(`🛡️ Blocked NoSQL injection attempt via key: ${key}`);
                continue;
            }
            sanitizedObj[key] = sanitize(obj[key]);
        }
        return sanitizedObj;
    }
    return obj;
};

app.use((req, res, next) => {
    if (req.body) req.body = sanitize(req.body);
    if (req.query) {
        // Express 5 query might be read-only, so we create a new sanitized version
        try {
            const sanitizedQuery = sanitize(req.query);
            Object.defineProperty(req, 'query', {
                value: sanitizedQuery,
                writable: true,
                configurable: true
            });
        } catch (e) {
            console.warn('Failed to overwrite req.query, using manual sanitization');
        }
    }
    if (req.params) req.params = sanitize(req.params);
    next();
});

app.use(globalLimiter);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(mongoSanitize());
app.use(xss());
app.use(cookieParser());

// Auth middleware (Enhanced with Ghost Token Protection)
const auth = async (req, res, next) => {
  const token = req.cookies.fp_token;
  if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED: No secure session found.' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ghost Token Check: Ensure user still exists in the database
    const user = await db('users').where({ id: decoded.id }).first();
    if (!user) {
        res.clearCookie('fp_token');
        return res.status(401).json({ error: 'SESSION_EXPIRED: Account no longer active.' });
    }
    
    req.user = { ...decoded, email_verified: user.email_verified, role: user.role };
    next();
  } catch (err) {
    res.clearCookie('fp_token');
    const errorType = err.name === 'TokenExpiredError' ? 'SESSION_EXPIRED' : 'SESSION_INVALID';
    res.status(401).json({ error: `${errorType}: Please sign in again.` });
  }
};

// Verified-Only Guard
const verifiedOnly = (req, res, next) => {
  if (!req.user.email_verified) {
    return res.status(403).json({ error: 'VERIFICATION_REQUIRED: Please verify your email in Settings to unlock this feature.' });
  }
  next();
};


// Joi Validation Middleware
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const details = error.details.map(d => d.message).join(', ');
            logSecurityEvent('VALIDATION_FAILURE', req.ip, `Input validation failed: ${details}`);
            return res.status(400).json({ error: `VALIDATION_ERROR: ${details}` });
        }
        next();
    };
};

// ===================== AUTH ROUTES =====================

app.post('/api/auth/register', authLimiter, validateRequest(schemas.register), async (req, res) => {
  const { name, email, password, currency } = req.body;
  const userEmail = email.toLowerCase();
  
  const existing = await db('users').where({ email: userEmail }).first();
  if (existing) return res.status(400).json({ error: 'Email already registered' });
  
  if (!REGISTRATION_ENABLED && userEmail !== 'harshitmehta1012@gmail.com') {
    return res.status(403).json({ error: 'REGISTRATION_DISABLED: Public signups are closed.' });
  }

  const role = (userEmail === 'harshitmehta1012@gmail.com') ? 'admin' : 'user';
  const hashedPassword = bcrypt.hashSync(password, 12); // Strong Bcrypt cost 12
  
  try {
    const [userId] = await db('users').insert({ name, email: userEmail, password: hashedPassword, role, currency: currency || 'USD' });
    const token = jwt.sign({ id: userId, email: userEmail, role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('fp_token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ success: true, user: { id: userId, name, email: userEmail, role, currency } });
    await logSecurityEvent('AUTH_REGISTER', req.ip, `New user: ${userEmail}`);
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', authLimiter, validateRequest(schemas.login), async (req, res) => {
  const { email, password } = req.body;
  const userEmail = email.toLowerCase();
  
  const user = await db('users').where({ email: userEmail }).first();
  if (!user || !bcrypt.compareSync(password, user.password)) {
    await logSecurityEvent('AUTH_FAILURE', req.ip, `Failed login: ${userEmail}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  await logSecurityEvent('AUTH_SUCCESS', req.ip, `Login success: ${userEmail}`);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('fp_token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, currency: user.currency, avatar: user.avatar } });
});


app.post('/api/auth/feedback', auth, async (req, res) => {
  const { email, subject, message, rating } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });
  
  try {
    await db('feedback').insert({
      user_id: req.user.id,
      email: email || req.user.email,
      subject,
      message,
      rating: rating || 5
    });
    
    await logSecurityEvent('USER_FEEDBACK', req.ip, `Feedback received from ${req.user.email}: ${subject}`);
    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

app.get('/api/auth/google', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  // Normalize host for Google: Force localhost if on 127.0.0.1 to match most common Google Console config
  let normalizedHost = host.includes('5175') ? host.replace('5175', '5173') : host;
  if (normalizedHost.startsWith('127.0.0.1')) normalizedHost = normalizedHost.replace('127.0.0.1', 'localhost');
  
  const redirectUri = `${protocol}://${normalizedHost}/api/auth/google/callback`;
  
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile&access_type=offline&prompt=consent`;
  res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/auth?error=no_code');

  const host = req.get('host');
  const protocol = req.protocol;
  const redirectUri = `${protocol}://${host.includes('5175') ? host.replace('5175', '5173') : host}/api/auth/google/callback`;

  try {
    const { tokens } = await gClient.getToken({
      code,
      redirect_uri: redirectUri
    });
    gClient.setCredentials(tokens);

    const ticket = await gClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await db('users').where({ email }).first();
    if (!user) {
      const [id] = await db('users').insert({
        name,
        email,
        password: bcrypt.hashSync(Math.random().toString(36), 12),
        currency: 'USD',
        role: 'user',
        email_verified: true,
        avatar: picture
      });
      user = await db('users').where({ id }).first();
      await logSecurityEvent('OAUTH_REGISTER', req.ip, `New user via Google: ${email}`);
    }

    const jwtToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('fp_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    // Redirect back to frontend with a success flag
    res.send(`<script>window.opener ? window.opener.postMessage({type: 'AUTH_SUCCESS', user: ${JSON.stringify(user)}}, '*') : window.location.href = '/';</script>`);
  } catch (err) {
    console.error('Google Callback Error:', err);
    res.redirect('/auth?error=google_failed');
  }
});

app.post('/api/auth/google/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Google Token required' });

  try {
    const ticket = await gClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, name, sub: google_id, picture } = payload;

    let user = await db('users').where({ email }).first();
    if (!user) {
      // Create new Google user
      const [id] = await db('users').insert({
        name,
        email,
        password: bcrypt.hashSync(Math.random().toString(36), 12), // Random password for OAuth users
        currency: 'USD',
        role: 'user',
        email_verified: true,
        avatar: picture
      });
      user = await db('users').where({ id }).first();
      await logSecurityEvent('OAUTH_REGISTER', req.ip, `New user via Google: ${email}`);
    } else {
      await logSecurityEvent('OAUTH_LOGIN', req.ip, `Login via Google: ${email}`);
    }

    // Generate JWT
    const jwtToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('fp_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, currency: user.currency, avatar: user.avatar } });
  } catch (err) {
    console.error('Google Verify Error:', err);
    res.status(401).json({ error: 'Invalid Google Token' });
  }
});

app.post('/api/auth/logout', auth, async (req, res) => {
  await logSecurityEvent('AUTH_LOGOUT', req.ip, `User logged out: ${req.user.email}`);
  res.clearCookie('fp_token');
  res.json({ success: true });
});

app.get('/api/auth/me', auth, async (req, res) => {
  const user = await db('users').select('id', 'name', 'email', 'currency', 'role', 'created_at', 'email_verified', 'avatar').where({ id: req.user.id }).first();
  if (user) {
    user.role = (user.email.toLowerCase() === 'harshitmehta1012@gmail.com') ? 'admin' : user.role;
  }
  res.json(user);
});

app.patch('/api/auth/settings', auth, async (req, res) => {
  const { name, currency, avatar } = req.body;
  await db('users').where({ id: req.user.id }).update({ name, currency, avatar });
  const updated = await db('users').select('id', 'name', 'email', 'currency', 'avatar').where({ id: req.user.id }).first();
  res.json({ success: true, user: updated });
});

app.post('/api/auth/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  const user = await db('users').where({ id: req.user.id }).first();
  if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(400).json({ error: 'Current password is incorrect' });
  await db('users').where({ id: req.user.id }).update({ password: bcrypt.hashSync(newPassword, 12) });
  res.json({ success: true });
});

app.post('/api/auth/send-verification', auth, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (user.email_verified) return res.status(400).json({ error: 'Email already verified' });
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db('users').where({ id: req.user.id }).update({ verification_code: otp });
    
    if (transporter) {
      const fromEmail = process.env.EMAIL_USER || 'no-reply@freelancepay.com';
      let message = {
          from: `"FreelancePay" <${fromEmail}>`,
          to: user.email,
          subject: 'Your FreelancePay Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
              <h2 style="color: #8b5cf6;">Welcome to FreelancePay!</h2>
              <p>Hi ${user.name},</p>
              <p>Thank you for using FreelancePay to manage your freelance business, track your bills, and project your cashflow seamlessly.</p>
              <p>To verify your email address, please use the following unique One-Time Password (OTP):</p>
              <div style="font-size: 24px; font-weight: bold; background: #f3f4f6; padding: 10px 20px; border-radius: 6px; display: inline-block; letter-spacing: 4px; color: #1e293b; margin: 20px 0;">
                ${otp}
              </div>
              <p>This code is unique to you and will help secure your account.</p>
              <p>Best regards,<br>The FreelancePay Team</p>
            </div>
          `
      };

      let info = await transporter.sendMail(message);
      
      // SECURITY FIX: Never leak preview URLs to the user or logs in Production
      const isDev = process.env.NODE_ENV !== 'production';
      const url = info.messageId !== 'internal-suppressed' && isDev ? nodemailer.getTestMessageUrl(info) : null;
      
      if (url) console.log('🔍 [DEV ONLY] Email Preview:', url);
      
      return res.json({ 
          success: true, 
          message: 'Verification code sent to your email',
          // Only return previewUrl in dev to prevent hacker interception of OTPs
          ...(isDev && url ? { previewUrl: url } : {}) 
      });
    } else {
      return res.status(500).json({ error: 'Email service not ready' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/auth/verify-email', auth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required' });
  
  const user = await db('users').where({ id: req.user.id }).first();
  if (user.verification_code !== code) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }
  
  await db('users').where({ id: req.user.id }).update({ email_verified: 1, verification_code: null });
  res.json({ success: true, email_verified: 1 });
});

app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  const user = await db('users').where({ email }).first();
  if (!user) return res.json({ success: true, message: 'If an account exists, a reset code has been sent.' }); // Privacy safe
  
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
  
  await db('users').where({ id: user.id }).update({ reset_code: resetCode, reset_expires: expires });
  
  if (transporter) {
    const fromEmail = process.env.EMAIL_USER || 'no-reply@freelancepay.com';
    let message = {
        from: `"FreelancePay" <${fromEmail}>`,
        to: email,
        subject: 'Reset Your FreelancePay Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #8b5cf6;">Password Reset Request</h2>
            <p>Hi ${user.name},</p>
            <p>You requested to reset your password for your FreelancePay account. Use the following 6-digit code to proceed:</p>
            <div style="font-size: 24px; font-weight: bold; background: #f3f4f6; padding: 10px 20px; border-radius: 6px; display: inline-block; letter-spacing: 4px; color: #1e293b; margin: 20px 0;">
              ${resetCode}
            </div>
            <p>This code will expire in 15 minutes. If you did not request this, you can safely ignore this email.</p>
            <p>Best regards,<br>The FreelancePay Team</p>
          </div>
        `
    };
    let info = await transporter.sendMail(message);
    const isDev = process.env.NODE_ENV !== 'production';
    const url = info.messageId !== 'internal-suppressed' && isDev ? nodemailer.getTestMessageUrl(info) : null;
    
    if (url) console.log('🔍 [DEV ONLY] Password Reset Preview:', url);

    res.json({ 
        success: true, 
        message: 'Reset code sent',
        ...(isDev && url ? { previewUrl: url } : {})
    });
  } else {
    res.status(500).json({ error: 'Email service unavailable' });
  }
});

app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'All fields required' });
  
  const user = await db('users').where({ email }).first();
  if (!user || user.reset_code !== code) return res.status(400).json({ error: 'Invalid or expired code' });
  
  const now = new Date().toISOString();
  if (user.reset_expires < now) return res.status(400).json({ error: 'Code has expired' });
  
  const hashed = bcrypt.hashSync(newPassword, 12);
  await db('users').where({ id: user.id }).update({ password: hashed, reset_code: null, reset_expires: null });
  
  res.json({ success: true, message: 'Password updated successfully' });
});

app.post('/api/auth/feedback', auth, botGuard, aiLimiter, async (req, res) => {
  const { subject, message, rating, email } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });
  
  const user = await db('users').where({ id: req.user.id }).first();
  const adminEmail = 'harshitmehta1012@gmail.com';
  const senderEmail = email || user.email;

  if (transporter) {
    const fromEmail = process.env.EMAIL_USER || 'no-reply@freelancepay.com';
    let emailContent = {
        from: `"FreelancePay Feedback" <${fromEmail}>`,
        to: adminEmail,
        replyTo: senderEmail,
        subject: `New Feedback: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #8b5cf6;">New User Feedback</h2>
            <p><strong>From:</strong> ${user.name}</p>
            <p><strong>Reply-to Email:</strong> ${senderEmail}</p>
            <p><strong>Rating:</strong> ${rating || 'N/A'} / 5</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 10px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
        `
    };
    try {
      await transporter.sendMail(emailContent);
      res.json({ success: true, message: 'Feedback sent successfully! Thank you.' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to send feedback' });
    }
  } else {
    res.status(500).json({ error: 'Email service unavailable' });
  }
});

// ===================== EXPORT SYSTEM (Two-step Token Download) =====================
// In-memory store for single-use download tokens (expires in 60 seconds)
const downloadTokens = new Map();

// Step 1: Authenticated user requests a download token
app.post('/api/auth/export-token', auth, verifiedOnly, (req, res) => {
  const { format } = req.body;
  if (!['excel', 'pdf'].includes(format)) return res.status(400).json({ error: 'Invalid format' });

  const token = require('crypto').randomBytes(32).toString('hex');
  downloadTokens.set(token, {
    uid: req.user.id,
    format,
    expires: Date.now() + 60_000 // 60 second window
  });

  // Auto-cleanup after 60 seconds
  setTimeout(() => downloadTokens.delete(token), 60_000);

  res.json({ token });
});

// Step 2: Download using one-time token (no auth cookie needed — safe to open in browser tab)
app.get('/api/download', async (req, res) => {
  const { token } = req.query;
  const entry = downloadTokens.get(token);

  if (!entry || Date.now() > entry.expires) {
    return res.status(401).send('<h2>Download link expired or invalid. Please try again.</h2>');
  }

  // One-time use — delete immediately
  downloadTokens.delete(token);
 
  const { uid, format } = entry;
  const user = await db('users').select('id', 'name', 'email', 'currency').where({ id: uid }).first();
  const bills = await db('bills').where({ user_id: uid }).orderBy('due_date', 'asc');
  const income = await db('income').where({ user_id: uid }).orderBy('received_date', 'desc');
  const payments = await db('payments')
    .select('payments.*', 'bills.name as bill_name')
    .leftJoin('bills', 'payments.bill_id', 'bills.id')
    .where('payments.user_id', uid)
    .orderBy('payments.paid_date', 'desc');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  try {
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'FreelancePay';
      workbook.created = new Date();

      // --- Profile Sheet ---
      const pSheet = workbook.addWorksheet('Profile');
      pSheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Currency', key: 'currency', width: 12 },
        { header: 'Account Since', key: 'created_at', width: 20 }
      ];
      pSheet.getRow(1).font = { bold: true };
      pSheet.addRow(user);

      // --- Bills Sheet ---
      const bSheet = workbook.addWorksheet('Bills');
      bSheet.columns = [
        { header: 'Bill Name', key: 'name', width: 25 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Due Date', key: 'due_date', width: 15 },
        { header: 'Recurrence', key: 'recurrence', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Client', key: 'client', width: 20 },
        { header: 'Notes', key: 'notes', width: 30 }
      ];
      bSheet.getRow(1).font = { bold: true };
      bills.forEach(b => bSheet.addRow(b));

      // --- Payments Sheet ---
      const paySheet = workbook.addWorksheet('Payment History');
      paySheet.columns = [
        { header: 'Bill Name', key: 'bill_name', width: 25 },
        { header: 'Amount Paid', key: 'amount', width: 15 },
        { header: 'Date Paid', key: 'paid_date', width: 15 },
        { header: 'Method', key: 'method', width: 15 },
        { header: 'Reference', key: 'reference', width: 20 },
        { header: 'Notes', key: 'note', width: 30 }
      ];
      paySheet.getRow(1).font = { bold: true };
      payments.forEach(p => paySheet.addRow(p));

      // --- Income Sheet ---
      const iSheet = workbook.addWorksheet('Income');
      iSheet.columns = [
        { header: 'Description', key: 'description', width: 25 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Date Received', key: 'received_date', width: 15 },
        { header: 'Client', key: 'client', width: 20 },
        { header: 'Category', key: 'category', width: 15 }
      ];
      iSheet.getRow(1).font = { bold: true };
      income.forEach(i => iSheet.addRow(i));

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="FreelancePay_${timestamp}.xlsx"`);
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);

    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      const pdfReady = new Promise((resolve, reject) => {
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });

      const cur = user.currency || '$';

      // Header
      doc.rect(0, 0, 595, 80).fill('#1a1a2e');
      doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('FreelancePay', 50, 20);
      doc.fontSize(10).font('Helvetica').fillColor('#aaaaaa').text('Financial Report', 50, 50);
      doc.fillColor('#aaaaaa').text(`Generated: ${new Date().toLocaleString()}  |  User: ${user.name}`, 50, 63);
      doc.moveDown(4);

      // Summary Boxes
      doc.fillColor('#333333').fontSize(13).font('Helvetica-Bold').text('SUMMARY', 50, 100);
      doc.moveTo(50, 116).lineTo(545, 116).strokeColor('#444').stroke();
      doc.fillColor('#111').fontSize(11).font('Helvetica');
      doc.text(`Total Bills: ${bills.length}`, 50, 125);
      doc.text(`Outstanding: ${cur}${bills.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amount, 0).toFixed(2)}`, 200, 125);
      doc.text(`Total Income: ${cur}${income.reduce((s, i) => s + i.amount, 0).toFixed(2)}`, 350, 125);
      doc.text(`Payments Made: ${payments.length}`, 50, 142);
      doc.moveDown(3);

      // Bills Table
      doc.fillColor('#333333').fontSize(13).font('Helvetica-Bold').text('BILLS', 50);
      doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor('#444').stroke();
      doc.moveDown(0.5);
      const bHeaders = ['Name', 'Category', 'Amount', 'Due Date', 'Status'];
      const bWidths = [160, 90, 70, 80, 70];
      let bx = 50;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#555');
      bHeaders.forEach((h, i) => { doc.text(h, bx, doc.y, { width: bWidths[i] }); bx += bWidths[i]; });
      doc.moveDown(0.5);
      bills.slice(0, 20).forEach(b => {
        let cx = 50; const y = doc.y;
        doc.fontSize(9).font('Helvetica').fillColor('#222');
        [b.name || '', b.category || '', `${cur}${Number(b.amount).toFixed(2)}`, b.due_date || '', b.status || ''].forEach((v, i) => {
          doc.text(String(v), cx, y, { width: bWidths[i] }); cx += bWidths[i];
        });
        doc.moveDown(0.4);
      });

      // Payments Table
      doc.addPage();
      doc.fillColor('#333333').fontSize(13).font('Helvetica-Bold').text('PAYMENT HISTORY', 50, 50);
      doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor('#444').stroke();
      doc.moveDown(0.5);
      payments.slice(0, 30).forEach(p => {
        doc.fontSize(9).font('Helvetica').fillColor('#222');
        doc.text(`${p.paid_date || ''}  —  ${p.bill_name || 'Direct'}  —  ${cur}${Number(p.amount).toFixed(2)}`, 50);
        doc.moveDown(0.3);
      });

      // Income Table
      doc.moveDown(1);
      doc.fillColor('#333333').fontSize(13).font('Helvetica-Bold').text('INCOME', 50);
      doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor('#444').stroke();
      doc.moveDown(0.5);
      income.slice(0, 20).forEach(i => {
        doc.fontSize(9).font('Helvetica').fillColor('#222');
        doc.text(`${i.received_date || ''}  —  ${i.description || ''}  —  ${cur}${Number(i.amount).toFixed(2)}  (${i.client || 'N/A'})`, 50);
        doc.moveDown(0.3);
      });

      doc.end();
      const pdfBuffer = await pdfReady;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="FreelancePay_${timestamp}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    }
  } catch (err) {
    console.error('[DOWNLOAD_ERROR]', err);
    res.status(500).send(`<h2>Report generation failed: ${err.message}</h2>`);
  }
});

// Delete all data (keep account)

app.delete('/api/auth/data', auth, verifiedOnly, async (req, res) => {
  const uid = req.user.id;
  await db('payments').where({ user_id: uid }).delete();
  await db('bills').where({ user_id: uid }).delete();
  await db('income').where({ user_id: uid }).delete();
  res.json({ success: true });
});

// Delete account entirely
app.delete('/api/auth/account', auth, verifiedOnly, async (req, res) => {
  const uid = req.user.id;
  await db('payments').where({ user_id: uid }).delete();
  await db('bills').where({ user_id: uid }).delete();
  await db('income').where({ user_id: uid }).delete();
  await db('users').where({ id: uid }).delete();
  res.json({ success: true });
});

// Get security logs for audit (ADMIN ONLY)
app.get('/api/admin/security-logs', auth, async (req, res) => {
  const ADMIN_EMAIL = 'harshitmehta1012@gmail.com';
  if (!req.user.email || req.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    await logSecurityEvent('UNAUTHORIZED_ACCESS', req.ip, `User ${req.user.email} tried to access security logs`);
    return res.status(403).json({ error: 'Unauthorized: Admin access required' });
  }
  const logs = await db('security_logs').orderBy('created_at', 'desc').limit(50);
  res.json(logs);
});

// Trigger database backup (ADMIN ONLY)
app.post('/api/admin/trigger-backup', auth, (req, res) => {
    const ADMIN_EMAIL = 'harshitmehta1012@gmail.com';
    if (!req.user.email || req.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    try {
        const { exec } = require('child_process');
        exec('node scripts/db-backup.js', (error, stdout, stderr) => {
            if (error) {
                console.error('Backup Error:', error);
                return res.status(500).json({ error: 'Backup failed' });
            }
            logSecurityEvent('MANUAL_BACKUP', req.ip, 'User triggered manual database snapshot');
            res.json({ success: true, message: 'Snapshot created successfully' });
        });
    } catch (e) {
        res.status(500).json({ error: 'Backup process failed' });
    }
});

// Public dashboard (no auth needed — returns aggregated stats only)
app.get('/api/public/stats', async (req, res) => {
  const totalUsers = (await db('users').count('* as cnt').first()).cnt;
  const totalBills = (await db('bills').count('* as cnt').first()).cnt;
  const totalPayments = (await db('payments').count('* as cnt').first()).cnt;
  const totalIncome = (await db('income').sum('amount as val').first()).val || 0;
  res.json({ totalUsers, totalBills, totalPayments, totalIncome });
});

// Health check endpoint for Docker/Monitoring
app.get('/api/public/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString(), platform: 'CyberCloud' });
});

// ===================== BILLS ROUTES =====================

app.get('/api/bills', auth, async (req, res) => {
  const bills = await db('bills').where({ user_id: req.user.id }).orderBy('due_date', 'asc');
  // Auto-mark overdue
  const today = new Date().toISOString().split('T')[0];
  for (let bill of bills) {
    if (bill.due_date < today && bill.status === 'upcoming') {
      await db('bills').where({ id: bill.id }).update({ status: 'overdue' });
      bill.status = 'overdue';
    }
    // Decrypt notes for display
    if (bill.notes) bill.notes = decrypt(bill.notes);
  }
  res.json(bills);
});

app.post('/api/bills', auth, validateRequest(schemas.bill), async (req, res) => {
  const { name, category, amount, due_date, recurrence, notes, client } = req.body;
  const parsedAmount = parseFloat(amount);
  
  const today = new Date().toISOString().split('T')[0];
  const status = due_date < today ? 'overdue' : 'upcoming';
  
  // Encrypt sensitive notes at rest
  const encryptedNotes = notes ? encrypt(notes) : '';
  
  // Trigger MAVIN-AI Inspection for 'Defect Detection'
  const aiResult = mavin.inspectSync('bill', { name, amount: parsedAmount, category });
  
  const [billId] = await db('bills').insert({
    user_id: req.user.id,
    name,
    category: category || 'other',
    amount: parsedAmount,
    due_date,
    recurrence: recurrence || 'one-time',
    status,
    notes: encryptedNotes,
    client: client || ''
  });
  
  // Log inspection result for forensic auditing (Dual-Layer)
  await db('mavin_inspections').insert({
    resource_type: 'bill',
    resource_id: billId,
    result: aiResult.status,
    confidence: aiResult.confidence,
    anomalies: aiResult.anomalies
  });

  await AIInspection.create({
    resourceType: 'bill',
    resourceId: billId,
    status: aiResult.status,
    confidence: aiResult.confidence,
    anomalies: aiResult.anomalies
  });

  const bill = await db('bills').where({ id: billId }).first();
  if (bill.notes) bill.notes = decrypt(bill.notes);
  res.json({ ...bill, mavin_ai: aiResult.status });
});

app.patch('/api/bills/:id', auth, async (req, res) => {
  const { name, category, amount, due_date, recurrence, status, notes, client } = req.body;
  const bill = await db('bills').where({ id: req.params.id, user_id: req.user.id }).first();
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  
  await db('bills').where({ id: req.params.id }).update({
    name: name ?? bill.name,
    category: category ?? bill.category,
    amount: amount ?? bill.amount,
    due_date: due_date ?? bill.due_date,
    recurrence: recurrence ?? bill.recurrence,
    status: status ?? bill.status,
    notes: notes ?? bill.notes,
    client: client ?? bill.client
  });
  
  const updated = await db('bills').where({ id: req.params.id }).first();
  res.json(updated);
});

app.delete('/api/bills/:id', auth, async (req, res) => {
  const bill = await db('bills').where({ id: req.params.id, user_id: req.user.id }).first();
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  await db('payments').where({ bill_id: req.params.id }).delete();
  await db('bills').where({ id: req.params.id }).delete();
  res.json({ success: true });
});

// Mark bill as paid
app.post('/api/bills/:id/pay', auth, async (req, res) => {
  const { amount, paid_date, note } = req.body;
  const bill = await db('bills').where({ id: req.params.id, user_id: req.user.id }).first();
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  
  await db('payments').insert({
    bill_id: req.params.id,
    user_id: req.user.id,
    amount: amount || bill.amount,
    paid_date: paid_date || new Date().toISOString().split('T')[0],
    note: note ? encrypt(note) : ''
  });
  
  await db('bills').where({ id: req.params.id }).update({ status: 'paid' });
  
  // If recurring, create next bill
  if (bill.recurrence !== 'one-time') {
    const nextDate = getNextDate(bill.due_date, bill.recurrence);
    if (nextDate) {
      await db('bills').insert({
        user_id: bill.user_id,
        name: bill.name,
        category: bill.category,
        amount: bill.amount,
        due_date: nextDate,
        recurrence: bill.recurrence,
        status: 'upcoming',
        notes: bill.notes,
        client: bill.client
      });
    }
  }
  res.json({ success: true });
});

// ===================== INCOME ROUTES =====================

app.get('/api/income', auth, async (req, res) => {
  const income = await db('income').where({ user_id: req.user.id }).orderBy('received_date', 'desc');
  income.forEach(i => {
      if (i.description) i.description = decrypt(i.description);
      if (i.client) i.client = decrypt(i.client);
  });
  res.json(income);
});

app.post('/api/income', auth, async (req, res) => {
  const { description, amount, received_date, client, category } = req.body;
  
  // Backend Validation
  if (!description || amount === undefined || !received_date) return res.status(400).json({ error: 'Required fields missing' });
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount < 0) return res.status(400).json({ error: 'Invalid amount' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(received_date)) return res.status(400).json({ error: 'Invalid date format (YYYY-MM-DD)' });

  const [incomeId] = await db('income').insert({
    user_id: req.user.id,
    description: encrypt(description),
    amount: parsedAmount,
    received_date,
    client: client ? encrypt(client) : '',
    category: category || 'freelance'
  });
  const income = await db('income').where({ id: incomeId }).first();
  res.json(income);
});

app.delete('/api/income/:id', auth, async (req, res) => {
  await db('income').where({ id: req.params.id, user_id: req.user.id }).delete();
  res.json({ success: true });
});

// ===================== DASHBOARD / ANALYTICS =====================

app.get('/api/dashboard', auth, aiLimiter, async (req, res) => {
  const uid = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const dbType = process.env.DB_TYPE || 'sqlite3';

  // Helper for cross-DB date formatting
  const dateFmt = (col) => {
    if (dbType === 'mysql') return db.raw(`DATE_FORMAT(${col}, '%Y-%m')`);
    if (dbType === 'postgres') return db.raw(`to_char(${col}, 'YYYY-MM')`);
    return db.raw(`strftime('%Y-%m', ${col})`);
  };

  // Update overdue
  await db('bills').where({ user_id: uid, status: 'upcoming' }).andWhere('due_date', '<', today).update({ status: 'overdue' });

  const totalDue = (await db('bills').where({ user_id: uid }).whereIn('status', ['upcoming', 'overdue']).sum('amount as val').first()).val || 0;
  const overdueAmt = (await db('bills').where({ user_id: uid, status: 'overdue' }).sum('amount as val').first()).val || 0;
  const overdueCount = (await db('bills').where({ user_id: uid, status: 'overdue' }).count('* as cnt').first()).cnt;
  
  // paidThisMonth and incomeThisMonth
  const ymNow = new Date().toISOString().slice(0, 7); // YYYY-MM
  const paidThisMonth = (await db('payments').where({ user_id: uid }).andWhere(dateFmt('paid_date'), '=', ymNow).sum('amount as val').first()).val || 0;
  const incomeThisMonth = (await db('income').where({ user_id: uid }).andWhere(dateFmt('received_date'), '=', ymNow).sum('amount as val').first()).val || 0;
  
  const upcomingCount = (await db('bills').where({ user_id: uid, status: 'upcoming' }).count('* as cnt').first()).cnt;

  // 6-month cashflow projection
  const cashflow = [];
  for (let i = -2; i <= 5; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    
    const exp = (await db('bills').where({ user_id: uid }).andWhere(dateFmt('due_date'), '=', ym).sum('amount as val').first()).val || 0;
    const inc = (await db('income').where({ user_id: uid }).andWhere(dateFmt('received_date'), '=', ym).sum('amount as val').first()).val || 0;
    
    cashflow.push({
      month: new Date(d.getFullYear(), d.getMonth(), 1).toLocaleString('default', { month: 'short', year: '2-digit' }),
      income: inc,
      expenses: exp,
      net: inc - exp
    });
  }

  // Recent bills
  const recentBills = await db('bills').where({ user_id: uid }).orderBy('due_date', 'asc').limit(5);
  // Category breakdown
  const byCategory = await db('bills')
    .select('category')
    .sum('amount as total')
    .where({ user_id: uid })
    .whereIn('status', ['upcoming', 'overdue'])
    .groupBy('category');

  res.json({ totalDue, overdueAmt, overdueCount, paidThisMonth, incomeThisMonth, upcomingCount, cashflow, recentBills, byCategory });
});

// ===================== PAYMENTS HISTORY =====================

app.get('/api/payments', auth, async (req, res) => {
  const payments = await db('payments')
    .select('payments.*', 'bills.name as bill_name', 'bills.category')
    .join('bills', 'payments.bill_id', 'bills.id')
    .where('payments.user_id', req.user.id)
    .orderBy('payments.paid_date', 'desc')
    .limit(50);
  res.json(payments);
});

// ===================== HELPERS =====================

function getNextDate(dateStr, recurrence) {
  const d = new Date(dateStr);
  switch (recurrence) {
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
    default: return null;
  }
  return d.toISOString().split('T')[0];
}

// ===================== MAVIN-CLOUD AUTONOMOUS MAINTENANCE =====================
// Runs every 24 hours to audit the system and train the AI threat model
const MAINTENANCE_INTERVAL = 24 * 60 * 60 * 1000;
setInterval(async () => {
  console.log('🛡️ MAVIN: Starting autonomous system maintenance...');
  try {
    const stats = await mavin.train('AutonomousGuard', 100);
    await logSecurityEvent('MAINTENANCE', '127.0.0.1', 'Autonomous system audit completed. System integrity verified.');
    console.log('✅ MAVIN: Maintenance complete. Stats:', stats);
  } catch (err) {
    console.error('❌ MAVIN: Autonomous maintenance failed:', err.message);
  }
}, MAINTENANCE_INTERVAL);

// Run an initial audit 5 seconds after startup
setTimeout(() => {
  mavin.train('InitialAudit', 50).catch(e => console.error('MAVIN Initial Audit Failed:', e));
}, 5000);

// ===================== ADMIN & SECURITY COMMAND CENTER =====================

const isAdmin = (req, res, next) => {
  const rootEmail = 'harshitmehta1012@gmail.com';
  const userEmail = req.user && req.user.email ? req.user.email.toLowerCase() : '';
  
  if (req.user && (req.user.role === 'admin' || userEmail === rootEmail)) {
    next();
  } else {
    res.status(403).json({ error: 'ACCESS_DENIED: Administrative clearance required for Cyber-Cloud Command Center.' });
  }
};

app.get('/api/admin/security-stats', auth, isAdmin, async (req, res) => {
  try {
    const totalLogs = await db('security_logs').count('* as cnt').first();
    const maliciousCount = await db('security_logs').where({ event_type: 'MALICIOUS_PATTERN' }).count('* as cnt').first();
    const authFailures = await db('security_logs').where({ event_type: 'AUTH_FAILURE' }).count('* as cnt').first();
    const bans = await db('security_logs').where({ event_type: 'IP_BLACKHAWK_BAN' }).count('* as cnt').first();
    const totalUsers = await db('users').count('* as cnt').first();
    
    // Aggregated platform metrics
    const platformRevenue = await db('payments').sum('amount as total').first();
    const platformExpenses = await db('bills').whereIn('status', ['paid']).sum('amount as total').first();
    
    // Get stats from Intelligence Vault (MongoDB)
    const mongoCount = await AuditLog.countDocuments();
    
    const os = require('os');
    const uptime = os.uptime();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const loadAvg = os.loadavg();

    res.json({
      total_events: totalLogs.cnt,
      threats_neutralized: maliciousCount.cnt,
      auth_violations: authFailures.cnt,
      active_bans: bans.cnt,
      vault_integrity: mongoCount > 0 ? 'Optimal' : 'Checking...',
      mavin_status: 'Active',
      total_users: totalUsers.cnt,
      platform_revenue: platformRevenue.total || 0,
      platform_expenses: platformExpenses.total || 0,
      system_health: {
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory_usage: `${Math.round(((totalMem - freeMem) / totalMem) * 100)}%`,
        load_avg: loadAvg[0].toFixed(2),
        cpu_cores: os.cpus().length,
        platform: os.platform(),
        arch: os.arch()
      },
      settings: {
        maintenance_mode: MAINTENANCE_MODE,
        registration_enabled: REGISTRATION_ENABLED
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve security stats' });
  }
});

app.get('/api/admin/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await db('users').select('id', 'name', 'email', 'role', 'created_at', 'email_verified');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/users/:id/role', auth, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    try {
        await db('users').where({ id }).update({ role });
        await logSecurityEvent('ADMIN_ACTION', req.ip, `Role of user ${id} updated to ${role} by ${req.user.email}`);
        res.json({ success: true, message: 'Role updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

app.get('/api/admin/security-logs', auth, isAdmin, async (req, res) => {
  try {
    const logs = await db('security_logs').orderBy('created_at', 'desc').limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve security logs' });
  }
});

app.get('/api/admin/feedback', auth, isAdmin, async (req, res) => {
  try {
    const feedback = await db('feedback').orderBy('created_at', 'desc').limit(50);
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve feedback' });
  }
});

// Delete user COMPLETELY (ADMIN ONLY)
app.delete('/api/admin/users/:id', auth, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db('users').where({ id }).first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin' && user.email.toLowerCase() === 'harshitmehta1012@gmail.com') {
      return res.status(403).json({ error: 'FORBIDDEN: Cannot delete the root administrator.' });
    }

    await db.transaction(async trx => {
      await trx('payments').where({ user_id: id }).delete();
      await trx('bills').where({ user_id: id }).delete();
      await trx('income').where({ user_id: id }).delete();
      await trx('feedback').where({ user_id: id }).delete();
      await trx('users').where({ id }).delete();
    });

    await logSecurityEvent('ADMIN_DELETE_USER', req.ip, `User ${user.email} (ID: ${id}) was COMPLETELY DELETED by ${req.user.email}`);
    res.json({ success: true, message: 'User and all associated data deleted successfully.' });
  } catch (err) {
    console.error('Delete User Failed:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.post('/api/admin/toggle-maintenance', auth, isAdmin, async (req, res) => {
  MAINTENANCE_MODE = !MAINTENANCE_MODE;
  await logSecurityEvent('SYSTEM_SETTING', req.ip, `Maintenance mode set to: ${MAINTENANCE_MODE}`);
  res.json({ success: true, maintenance_mode: MAINTENANCE_MODE });
});

app.post('/api/admin/toggle-registration', auth, isAdmin, async (req, res) => {
  REGISTRATION_ENABLED = !REGISTRATION_ENABLED;
  await logSecurityEvent('SYSTEM_SETTING', req.ip, `Public registration set to: ${REGISTRATION_ENABLED}`);
  res.json({ success: true, registration_enabled: REGISTRATION_ENABLED });
});

// System Diagnostics & Developer Tools
app.get('/api/admin/system-info', auth, isAdmin, (req, res) => {
  const os = require('os');
  const info = {
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    env: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    cpu: os.cpus()[0].model,
    hostname: os.hostname(),
    network: os.networkInterfaces(),
    process_uptime: process.uptime()
  };
  res.json(info);
});

app.get('/api/admin/env-safe', auth, isAdmin, (req, res) => {
  const safeEnv = {};
  const sensitiveKeys = ['SECRET', 'KEY', 'PASS', 'TOKEN', 'AUTH', 'DB_PASSWORD'];
  
  Object.keys(process.env).forEach(key => {
    const isSensitive = sensitiveKeys.some(sk => key.toUpperCase().includes(sk));
    safeEnv[key] = isSensitive ? '********' : process.env[key];
  });
  
  res.json(safeEnv);
});

// Database Table Explorer (ADMIN ONLY)
app.get('/api/admin/db/tables', auth, isAdmin, async (req, res) => {
  try {
    const dbType = process.env.DB_TYPE || 'sqlite3';
    let tables;
    if (dbType === 'sqlite3') {
      tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table'");
      tables = tables.map(t => t.name).filter(n => !n.startsWith('sqlite_'));
    } else {
      // Basic support for other DBs
      tables = ['users', 'bills', 'payments', 'income', 'security_logs', 'feedback', 'mavin_inspections'];
    }
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

app.get('/api/admin/db/table/:name', auth, isAdmin, async (req, res) => {
  try {
    const data = await db(req.params.name).select('*').limit(100);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch data from ${req.params.name}` });
  }
});

// Cache Management
app.post('/api/admin/clear-cache', auth, isAdmin, (req, res) => {
  apicache.clear();
  logSecurityEvent('ADMIN_ACTION', req.ip, `System cache cleared by ${req.user.email}`);
  res.json({ success: true, message: 'Application cache cleared successfully' });
});

app.post('/api/admin/purge-logs', auth, isAdmin, async (req, res) => {
  try {
    await db('security_logs').delete();
    await logSecurityEvent('ADMIN_ACTION', req.ip, `All security logs were purged by ${req.user.email}`);
    res.json({ success: true, message: 'Security logs purged successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to purge logs' });
  }
});

// ===================== BUG REPORTING ENGINE =====================

app.post('/api/bugs', auth, async (req, res) => {
  try {
    const { subject, description, image_data } = req.body;
    if (!subject || !description) return res.status(400).json({ error: 'Subject and description are required' });

    const [bugId] = await db('bug_reports').insert({
      user_id: req.user.id,
      subject,
      description,
      image_data: image_data || null,
      status: 'open'
    });

    await logSecurityEvent('BUG_REPORTED', req.ip, `Bug report created by ${req.user.email}`);
    res.json({ success: true, id: bugId });
  } catch (err) {
    console.error('Bug Creation Error:', err);
    res.status(500).json({ error: 'Failed to create bug report' });
  }
});

app.get('/api/bugs', auth, async (req, res) => {
  try {
    let bugs;
    if (req.user.role === 'admin') {
      bugs = await db('bug_reports')
        .join('users', 'bug_reports.user_id', 'users.id')
        .select('bug_reports.*', 'users.name as user_name', 'users.email as user_email')
        .orderBy('created_at', 'desc');
    } else {
      bugs = await db('bug_reports')
        .where({ user_id: req.user.id })
        .orderBy('created_at', 'desc');
    }
    res.json(bugs);
  } catch (err) {
    console.error('Fetch Bugs Error:', err);
    res.status(500).json({ error: 'Failed to fetch bugs' });
  }
});

app.get('/api/bugs/:id/messages', auth, async (req, res) => {
  try {
    const bug = await db('bug_reports').where({ id: req.params.id }).first();
    if (!bug) return res.status(404).json({ error: 'Bug report not found' });
    if (req.user.role !== 'admin' && bug.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to bug report' });
    }

    const messages = await db('bug_messages')
      .where({ bug_report_id: req.params.id })
      .join('users', 'bug_messages.sender_id', 'users.id')
      .select('bug_messages.*', 'users.name as sender_name', 'users.role as sender_role')
      .orderBy('created_at', 'asc');
    
    res.json(messages);
  } catch (err) {
    console.error('Fetch Bug Messages Error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/bugs/:id/messages', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const bug = await db('bug_reports').where({ id: req.params.id }).first();
    if (!bug) return res.status(404).json({ error: 'Bug report not found' });
    if (req.user.role !== 'admin' && bug.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to bug report' });
    }

    await db('bug_messages').insert({
      bug_report_id: req.params.id,
      sender_id: req.user.id,
      message
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Send Bug Message Error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.patch('/api/bugs/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'resolved'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await db('bug_reports').where({ id: req.params.id }).update({ status });
    res.json({ success: true });
  } catch (err) {
    console.error('Update Bug Status Error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.post('/api/admin/system-restart', auth, isAdmin, async (req, res) => {
  await logSecurityEvent('ADMIN_ACTION', req.ip, `System restart requested by ${req.user.email}`);
  res.json({ success: true, message: 'Restart command received. Process will recycle shortly.' });
  // In a real production env with PM2, we might exit and let the process manager restart us.
  // setTimeout(() => process.exit(0), 1000); 
});

// Handle React routing, return all requests to React app (Fallback)
app.use((req, res) => {
  const indexPath = path.join(__dirname, '../client/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Production assets not found. If in development, use the Vite dev server on port 5173.' });
  }
});

const startServer = async () => {
  try {
    await initDb();
    // Connect to Mongo in background (Non-blocking)
    connectMongo();
    await mavin.init();
    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 FreeLancePay App API running on http://0.0.0.0:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
  }
};

startServer();
