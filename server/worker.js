import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { getCookie, setCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';

import * as jose from 'jose';
import { encrypt, decrypt } from './worker-encryption.js';

// --- SECURE CRYPTOGRAPHY (WebCrypto PBKDF2) ---
const hashPassword = async (password) => {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  return `$pbkdf2$100000$${saltHex}$${hashHex}`;
};

const verifyPassword = async (password, storedHash) => {
  if (storedHash.startsWith('$pbkdf2$')) {
    const [, , iterationsStr, saltHex, originalHashHex] = storedHash.split('$');
    const iterations = parseInt(iterationsStr, 10);
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const hashBuffer = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256' },
      keyMaterial, 256
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const newHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return newHashHex === originalHashHex;
  }
  
  // Legacy bcrypt fallback for older passwords
  return await bcrypt.compare(password, storedHash);
};

const app = new Hono();

// 1. BANK-LEVEL SECURITY HEADERS
app.use('*', secureHeaders());

// 2. STRICT ORIGIN LOCKDOWN
const getOrigin = (c) => c.env.AUTH_ORIGIN || 'https://freelance-pay-cloud.pages.dev';

// 3. INTELLIGENT RATE LIMITER (In-Memory per Isolate)
const rateLimitMap = new Map();
const downloadTokens = new Map(); // Store tokens for download
const RATE_LIMIT = 100; // 100 requests per minute

app.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || '127.0.0.1';
  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, startTime: now };

  if (now - userData.startTime > 60000) {
    userData.count = 1;
    userData.startTime = now;
  } else {
    userData.count++;
  }
  rateLimitMap.set(ip, userData);

  if (userData.count > RATE_LIMIT) {
    await logSecurityEvent(c, 'RATE_LIMIT_EXCEEDED', ip, `IP blocked for 1 minute`);
    return c.json({ error: 'Too many requests. Please try again later.' }, 429);
  }

  const origin = c.req.header('Origin');
  const ALLOWED_ORIGIN = getOrigin(c);
  if (origin) {
    const isAllowed = origin === ALLOWED_ORIGIN || origin.endsWith('.pages.dev') || origin.includes('localhost') || origin.includes('127.0.0.1');
    if (!isAllowed) {
      console.warn(`Blocked request from unauthorized origin: ${origin}`);
      const ip = c.req.header('CF-Connecting-IP') || 'Unknown';
      await logSecurityEvent(c, 'SECURITY_VIOLATION_ORIGIN', ip, `Blocked request from unauthorized origin: ${origin}`);
      return c.json({ error: 'Security Violation: Origin not permitted' }, 403);
    }
  }
  await next();
});

app.use('*', cors({
  origin: (origin, c) => {
    const ALLOWED_ORIGIN = getOrigin(c);
    if (!origin) return ALLOWED_ORIGIN;
    // Explicitly allow the primary production domain and common development origins
    const isAllowed = origin === ALLOWED_ORIGIN || 
                      origin === 'https://freelance-pay-cloud.pages.dev' ||
                      origin.endsWith('.pages.dev') || 
                      origin.includes('localhost') || 
                      origin.includes('127.0.0.1');
    return isAllowed ? origin : ALLOWED_ORIGIN;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 600,
}));

app.get('/', (c) => c.json({ 
  message: 'FreeLancePay Cloud API is Live', 
  status: 'Healthy',
  security: 'Super-Secure Multi-Layered Mode ACTIVE',
  documentation: 'https://freelance-pay-cloud.pages.dev/legal'
}));

const ADMIN_EMAIL = 'harshitmehta1012@gmail.com';
const isRootAdmin = (email) => email?.toLowerCase() === ADMIN_EMAIL;

// Auth Middleware Helper
const auth = async (c, next) => {
  const token = getCookie(c, 'fp_token');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(c.env.JWT_SECRET)
    );

    // Immediate ban check for active sessions
    const user = await c.env.DB.prepare('SELECT is_banned FROM users WHERE id = ?').bind(payload.id).first();
    if (user?.is_banned) {
      return c.json({ error: 'PERMANENT_BAN', message: 'Your access has been permanently revoked.' }, 403);
    }

    c.set('user', payload);
    await next();
  } catch (e) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

const logSecurityEvent = async (c, type, ip, details) => {
  try {
    await c.env.DB.prepare(
      'INSERT INTO security_logs (event_type, ip_address, details) VALUES (?, ?, ?)'
    ).bind(type, ip || 'Cloudflare-Worker', details).run();
  } catch (e) { console.error('Log failed', e); }
};

// --- STRIPE ROUTES ---
app.post('/api/stripe/create-checkout-session', async (c) => {
  try {
    const { tier, billingCycle, currency, successUrl, cancelUrl } = await c.req.json();
    
    const stripeSecretKey = c.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) return c.json({ error: 'Stripe not configured' }, 500);
    
    let price = 0;
    if (tier === 'pro') {
      if (currency === 'INR') {
        price = billingCycle === 'monthly' ? 799 : 639;
      } else {
        price = billingCycle === 'monthly' ? 9 : 7;
      }
    } else if (tier === 'premium') {
      if (currency === 'INR') {
        price = billingCycle === 'monthly' ? 2499 : 1999;
      } else {
        price = billingCycle === 'monthly' ? 29 : 23;
      }
    } else {
      return c.json({ error: 'Invalid tier' }, 400);
    }
    
    const unitAmountCents = price * 100;
    const name = tier === 'pro' ? 'Freelancer Pro' : 'Agency Premium';
    
    const bodyParams = new URLSearchParams();
    bodyParams.append('payment_method_types[0]', 'card');
    bodyParams.append('mode', 'payment');
    bodyParams.append('success_url', successUrl);
    bodyParams.append('cancel_url', cancelUrl);
    bodyParams.append('line_items[0][price_data][currency]', currency.toLowerCase());
    bodyParams.append('line_items[0][price_data][product_data][name]', name);
    bodyParams.append('line_items[0][price_data][unit_amount]', unitAmountCents.toString());
    bodyParams.append('line_items[0][quantity]', '1');
    
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });
    
    if (!stripeRes.ok) {
      const errBody = await stripeRes.text();
      throw new Error(`Stripe API returned ${stripeRes.status}: ${errBody}`);
    }
    
    const session = await stripeRes.json();
    return c.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Stripe error in Worker:', err);
    return c.json({ error: err.message }, 500);
  }
});

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (c) => {
  try {
    const { name, email, password, currency } = await c.req.json();
    const hashedPassword = await hashPassword(password);
    
    // Check if email was previously banned
    const existing = await c.env.DB.prepare('SELECT is_banned FROM users WHERE email = ?').bind(email).first();
    if (existing?.is_banned) {
      return c.json({ error: 'PERMANENT_BAN', message: 'This email is permanently blacklisted.' }, 403);
    }

    const role = isRootAdmin(email) ? 'admin' : 'user';
    const result = await c.env.DB.prepare(
      'INSERT INTO users (name, email, password, currency, role) VALUES (?, ?, ?, ?, ?) RETURNING id'
    ).bind(name, email, hashedPassword, currency || 'USD', role).first();
    
    const user = { id: result.id, name, email, currency: currency || 'USD', role };
    const token = await new jose.SignJWT(user)
      .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(new TextEncoder().encode(c.env.JWT_SECRET));

    setCookie(c, 'fp_token', token, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 60 * 60 * 24 * 7 });
    return c.json({ success: true, user });
  } catch (e) {
    console.error('FATAL REGISTER ERROR:', e.stack || e);
    return c.json({ error: 'Email already exists or error occurred: ' + e.message }, 400);
  }
});

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  const ip = c.req.header('CF-Connecting-IP') || 'Unknown';
  
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  
  if (user?.is_banned) {
    await logSecurityEvent(c, 'BANNED_LOGIN_ATTEMPT', ip, `Banned user ${email} attempted login`);
    return c.json({ error: 'PERMANENT_BAN', message: 'Access Denied: Permanent Suspension Active.' }, 403);
  }

  if (!user || !(await verifyPassword(password, user.password))) {
    await logSecurityEvent(c, 'AUTH_FAILURE', ip, `Failed login attempt for: ${email}`);
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const role = isRootAdmin(email) ? 'admin' : (user.role || 'user');
  const token = await new jose.SignJWT({ id: user.id, email: user.email, name: user.name, role })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(new TextEncoder().encode(c.env.JWT_SECRET));

  setCookie(c, 'fp_token', token, { 
    httpOnly: true, 
    secure: true, 
    sameSite: 'Lax', 
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });
  return c.json({ user: { id: user.id, name: user.name, email: user.email, currency: user.currency, role } });
});

app.post('/api/auth/forgot-password', async (c) => {
  const { email } = await c.req.json();
  const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  
  if (!user) {
    return c.json({ message: 'If the email exists, a reset code was sent.' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  
  await c.env.DB.prepare('UPDATE users SET reset_code = ?, reset_expires = ? WHERE id = ?')
    .bind(code, expires, user.id).run();

  try {
    const emailRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: email, name: 'FreelancePay User' }] }],
        from: { email: 'noreply@freelance-pay.com', name: 'FreelancePay Security' },
        subject: 'FreelancePay - Password Reset Code',
        content: [{ type: 'text/html', value: `<h2>Password Reset</h2><p>Your 6-digit reset code is: <strong>${code}</strong></p><p>This code will expire in 15 minutes.</p>` }]
      })
    });
    const resultText = await emailRes.text();
    if (!emailRes.ok) console.error('MailChannels Error:', resultText);
  } catch(e) {
    console.error('Email sending failed:', e);
  }

  return c.json({ message: 'Reset code sent!', previewCode: code });
});

app.post('/api/auth/reset-password', async (c) => {
  const { email, code, newPassword } = await c.req.json();
  
  const user = await c.env.DB.prepare('SELECT id, reset_code, reset_expires FROM users WHERE email = ?').bind(email).first();
  if (!user || user.reset_code !== code) {
    return c.json({ error: 'Invalid or expired reset code' }, 400);
  }

  if (new Date(user.reset_expires) < new Date()) {
    return c.json({ error: 'Reset code has expired' }, 400);
  }

  const hashedPassword = await hashPassword(newPassword);
  
  await c.env.DB.prepare('UPDATE users SET password = ?, reset_code = NULL, reset_expires = NULL WHERE id = ?')
    .bind(hashedPassword, user.id).run();
    
  return c.json({ success: true, message: 'Password reset successfully' });
});

app.get('/api/auth/me', auth, async (c) => {
  const user = await c.env.DB.prepare('SELECT id, name, email, currency, role, email_verified, avatar FROM users WHERE id = ?').bind(c.get('user').id).first();
  if (user && isRootAdmin(user.email)) user.role = 'admin';
  return c.json(user);
});

app.patch('/api/auth/settings', auth, async (c) => {
  const { name, currency, avatar } = await c.req.json();
  const userId = c.get('user').id;
  
  await c.env.DB.prepare('UPDATE users SET name = ?, currency = ?, avatar = ? WHERE id = ?')
    .bind(name, currency, avatar || null, userId).run();
    
  return c.json({ success: true });
});

app.post('/api/auth/send-verification', auth, async (c) => {
  const user = c.get('user');
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  await c.env.DB.prepare('UPDATE users SET verification_code = ? WHERE id = ?')
    .bind(code, user.id).run();

  // Log it so admin can see if needed
  await logSecurityEvent(c, 'VERIFICATION_CODE_SENT', c.req.header('CF-Connecting-IP'), `Code ${code} generated for ${user.email}`);

  // Mock successful response with "Preview" link for local testing feel
  return c.json({ 
    success: true, 
    message: 'A 6-digit verification code has been generated. For security, please check your logs or contact support if you did not receive it.',
    previewUrl: `https://freelance-pay-cloud.pages.dev/verification-help?code=${code}` // Custom help page
  });
});

app.post('/api/auth/verify-email', auth, async (c) => {
  const { code } = await c.req.json();
  const userId = c.get('user').id;
  
  const user = await c.env.DB.prepare('SELECT verification_code FROM users WHERE id = ?')
    .bind(userId).first();

  if (!user || !user.verification_code || user.verification_code !== code) {
    return c.json({ error: 'Invalid or expired verification code' }, 400);
  }

  await c.env.DB.prepare('UPDATE users SET email_verified = 1, verification_code = NULL WHERE id = ?')
    .bind(userId).run();

  await logSecurityEvent(c, 'EMAIL_VERIFIED', c.req.header('CF-Connecting-IP'), `User ${userId} verified their email`);
  
  return c.json({ success: true });
});

app.patch('/api/auth/settings', auth, async (c) => {
  const { name, currency, avatar } = await c.req.json();
  const userId = c.get('user').id;

  if (name) {
    await c.env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(name, userId).run();
  }
  if (currency) {
    await c.env.DB.prepare('UPDATE users SET currency = ? WHERE id = ?').bind(currency, userId).run();
  }
  if (avatar) {
    await c.env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(avatar, userId).run();
  }

  await logSecurityEvent(c, 'PROFILE_UPDATED', c.req.header('CF-Connecting-IP'), `User ${userId} updated their profile settings`);

  return c.json({ success: true });
});

// --- GOOGLE OAUTH ---

app.get('/api/auth/google', (c) => {
  const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${c.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile&access_type=offline&prompt=consent`;
  return c.redirect(url);
});

app.get('/api/auth/google/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) return c.redirect('/auth?error=no_code');
  const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`;

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: c.env.GOOGLE_CLIENT_ID, client_secret: c.env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: 'authorization_code' })
    });
    const tokens = await tokenResponse.json();
    const idToken = tokens.id_token;
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    const { email, name, picture } = payload;

    let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    const role = isRootAdmin(email) ? 'admin' : 'user';
    if (!user) {
      const result = await c.env.DB.prepare(
        'INSERT INTO users (name, email, password, currency, email_verified, avatar, role) VALUES (?, ?, ?, ?, 1, ?, ?) RETURNING id'
      ).bind(name, email, await hashPassword(Math.random().toString(36)), 'USD', picture, role).first();
      user = { id: result.id, name, email, role, currency: 'USD' };
    } else {
      user.role = role;
    }
    
    const token = await new jose.SignJWT({ id: user.id, email: user.email, name: user.name, role: user.role })
      .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(new TextEncoder().encode(c.env.JWT_SECRET));

    setCookie(c, 'fp_token', token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'Lax', 
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    // Dynamic redirect back to the app
    const appOrigin = getOrigin(c);
    return c.html(`<html><body><script>if (window.opener) { window.opener.postMessage({type: 'AUTH_SUCCESS', user: ${JSON.stringify(user)}}, '*'); window.close(); } else { window.location.href = '${appOrigin}'; }</script></body></html>`);
  } catch (e) { 
    console.error('Google Callback Error:', e);
    const appOrigin = 'https://freelance-pay-cloud.pages.dev';
    return c.redirect(`${appOrigin}/auth?error=google_failed`); 
  }
});

app.post('/api/auth/google/verify', async (c) => {
  const { token } = await c.req.json();
  if (!token) return c.json({ error: 'Google Token required' }, 400);

  try {
    // Verify token with Google's public keys
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!response.ok) throw new Error('Invalid token');
    const payload = await response.json();
    
    if (payload.aud !== c.env.GOOGLE_CLIENT_ID) {
      throw new Error('Invalid audience');
    }

    const { email, name, picture } = payload;
    let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    const role = isRootAdmin(email) ? 'admin' : 'user';
    
    if (!user) {
      const result = await c.env.DB.prepare(
        'INSERT INTO users (name, email, password, currency, email_verified, avatar, role) VALUES (?, ?, ?, ?, 1, ?, ?) RETURNING id'
      ).bind(name, email, await hashPassword(Math.random().toString(36)), 'USD', picture, role).first();
      user = { id: result.id, name, email, role, currency: 'USD' };
    } else {
      user.role = role;
    }
    
    const jwtToken = await new jose.SignJWT({ id: user.id, email: user.email, name: user.name, role: user.role })
      .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(new TextEncoder().encode(c.env.JWT_SECRET));

    setCookie(c, 'fp_token', jwtToken, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'None', 
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    return c.json({ success: true, user });
  } catch (e) {
    console.error('Verify error:', e);
    const ip = c.req.header('CF-Connecting-IP') || 'Unknown';
    await logSecurityEvent(c, 'GOOGLE_AUTH_FAILURE', ip, `Token verification failed: ${e.message}`);
    return c.json({ error: 'Invalid Google Token', details: e.message }, 401);
  }
});

app.post('/api/auth/feedback', async (c) => {
  const { email, subject, message, rating } = await c.req.json();
  if (!subject || !message) return c.json({ error: 'Missing fields' }, 400);

  // Try to get user_id from token if available (optional feedback)
  let userId = null;
  const token = getCookie(c, 'fp_token');
  if (token) {
    try {
      const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(c.env.JWT_SECRET));
      userId = payload.id;
    } catch (e) {}
  }

  await c.env.DB.prepare(
    'INSERT INTO feedback (user_id, email, subject, message, rating) VALUES (?, ?, ?, ?, ?)'
  ).bind(userId, email || null, subject, message, rating || 5).run();

  return c.json({ success: true });
});

// --- HEALTH CHECK ---
app.get('/api/health', async (c) => {
  const dbStatus = await c.env.DB.prepare('SELECT 1').first() ? 'UP' : 'DOWN';
  const envVars = {
    GOOGLE_CLIENT_ID: !!c.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!c.env.GOOGLE_CLIENT_SECRET,
    JWT_SECRET: !!c.env.JWT_SECRET
  };
  return c.json({ status: 'UP', db: dbStatus, env: envVars });
});

// --- CORE APP ROUTES ---

app.get('/api/bills', auth, async (c) => {
  const uid = c.get('user').id;
  const today = new Date().toISOString().split('T')[0];

  // Auto-update overdue bills in DB before returning
  await c.env.DB.prepare('UPDATE bills SET status = "overdue" WHERE user_id = ? AND status = "upcoming" AND due_date < ?')
    .bind(uid, today).run();

  const { results } = await c.env.DB.prepare('SELECT * FROM bills WHERE user_id = ? ORDER BY due_date ASC').bind(uid).all();
  
  // Decrypt notes for display
  const processed = await Promise.all(results.map(async (bill) => {
    if (bill.notes && c.env.JWT_SECRET) bill.notes = await decrypt(bill.notes, c.env.JWT_SECRET);
    return bill;
  }));
  
  return c.json(processed);
});

app.post('/api/bills', auth, async (c) => {
  const { name, amount, due_date, category, recurrence, notes, client } = await c.req.json();
  const encryptedNotes = notes ? await encrypt(notes, c.env.JWT_SECRET) : null;
  const res = await c.env.DB.prepare('INSERT INTO bills (user_id, name, amount, due_date, category, recurrence, notes, client) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(c.get('user').id, name, amount, due_date, category, recurrence, encryptedNotes, client).first();
  return c.json({ id: res.id });
});

app.patch('/api/bills/:id', auth, async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user');
  const body = await c.req.json();
  
  const bill = await c.env.DB.prepare('SELECT * FROM bills WHERE id = ? AND user_id = ?').bind(id, user.id).first();
  if (!bill) return c.json({ error: 'Bill not found' }, 404);

  const name = body.name ?? bill.name;
  const amount = body.amount ?? bill.amount;
  const due_date = body.due_date ?? bill.due_date;
  const category = body.category ?? bill.category;
  const recurrence = body.recurrence ?? bill.recurrence;
  const status = body.status ?? bill.status;
  const notes = body.notes !== undefined ? (body.notes ? await encrypt(body.notes, c.env.JWT_SECRET) : null) : bill.notes;
  const client = body.client ?? bill.client;

  await c.env.DB.prepare(
    'UPDATE bills SET name=?, amount=?, due_date=?, category=?, recurrence=?, status=?, notes=?, client=? WHERE id=? AND user_id=?'
  ).bind(name, amount, due_date, category, recurrence, status, notes, client, id, user.id).run();

  return c.json({ success: true });
});

app.get('/api/income', auth, async (c) => {
  const res = await c.env.DB.prepare('SELECT * FROM income WHERE user_id = ? ORDER BY received_date DESC').bind(c.get('user').id).all();
  return c.json(res.results);
});

app.post('/api/income', auth, async (c) => {
  const { description, amount, received_date, client, category } = await c.req.json();
  const res = await c.env.DB.prepare('INSERT INTO income (user_id, description, amount, received_date, client, category) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(c.get('user').id, description, amount, received_date, client, category).first();
  return c.json({ id: res.id });
});

app.get('/api/payments', auth, async (c) => {
  const res = await c.env.DB.prepare('SELECT p.*, b.name as bill_name FROM payments p LEFT JOIN bills b ON p.bill_id = b.id WHERE p.user_id = ? ORDER BY p.paid_date DESC')
    .bind(c.get('user').id).all();
  return c.json(res.results);
});

app.get('/api/dashboard', auth, async (c) => {
  const uid = c.get('user').id;
  const today = new Date().toISOString().split('T')[0];
  const ymNow = today.slice(0, 7);

  // Update overdue bills
  await c.env.DB.prepare('UPDATE bills SET status = "overdue" WHERE user_id = ? AND status = "upcoming" AND due_date < ?')
    .bind(uid, today).run();

  const stats = await c.env.DB.prepare(`
    SELECT 
      (SELECT SUM(amount) FROM bills WHERE user_id = ? AND status IN ("upcoming", "overdue")) as totalDue,
      (SELECT SUM(amount) FROM bills WHERE user_id = ? AND status = "overdue") as overdueAmt,
      (SELECT COUNT(*) FROM bills WHERE user_id = ? AND status = "overdue") as overdueCount,
      (SELECT SUM(amount) FROM payments WHERE user_id = ? AND strftime("%Y-%m", paid_date) = ?) as paidThisMonth,
      (SELECT SUM(amount) FROM income WHERE user_id = ? AND strftime("%Y-%m", received_date) = ?) as incomeThisMonth,
      (SELECT SUM(amount) FROM expenses WHERE user_id = ? AND strftime("%Y-%m", date) = ?) as expensesThisMonth,
      (SELECT COUNT(*) FROM bills WHERE user_id = ? AND status = "upcoming") as upcomingCount,
      (SELECT COUNT(*) FROM projects WHERE user_id = ? AND status = "active") as activeProjects,
      (SELECT SUM(duration_seconds) FROM time_entries WHERE user_id = ? AND strftime("%Y-%m", start_time) = ?) as monthSeconds,
      (SELECT name FROM clients WHERE id = (SELECT client_id FROM income WHERE user_id = ? GROUP BY client_id ORDER BY SUM(amount) DESC LIMIT 1)) as topClient
  `).bind(uid, uid, uid, uid, ymNow, uid, ymNow, uid, ymNow, uid, uid, uid, ymNow, uid).first();

  const recentBills = await c.env.DB.prepare('SELECT * FROM bills WHERE user_id = ? ORDER BY due_date ASC LIMIT 5').bind(uid).all();
  
  const byCategory = await c.env.DB.prepare(`
    SELECT category, SUM(amount) as total 
    FROM bills 
    WHERE user_id = ? AND status IN ("upcoming", "overdue") 
    GROUP BY category
    `).bind(uid).all();

  // Lifecycle expansion for dashboard
  const recentProjects = await c.env.DB.prepare('SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT 5').bind(uid).all();
  const recentInvoices = await c.env.DB.prepare('SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.user_id = ? ORDER BY i.created_at DESC LIMIT 5').bind(uid).all();
  const recentClients = await c.env.DB.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').bind(uid).all();
  const recentTime = await c.env.DB.prepare('SELECT t.*, p.name as project_name FROM time_entries t LEFT JOIN projects p ON t.project_id = p.id WHERE t.user_id = ? ORDER BY t.start_time DESC LIMIT 5').bind(uid).all();

  // Cashflow (including real expenses)
  const cashflow = [];
  for (let i = -2; i <= 5; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    
    const expBills = await c.env.DB.prepare('SELECT SUM(amount) as val FROM bills WHERE user_id = ? AND strftime("%Y-%m", due_date) = ?').bind(uid, ym).first();
    const realExp = await c.env.DB.prepare('SELECT SUM(amount) as val FROM expenses WHERE user_id = ? AND strftime("%Y-%m", date) = ?').bind(uid, ym).first();
    const inc = await c.env.DB.prepare('SELECT SUM(amount) as val FROM income WHERE user_id = ? AND strftime("%Y-%m", received_date) = ?').bind(uid, ym).first();
    
    cashflow.push({
      month: monthLabel,
      income: inc?.val || 0,
      expenses: (expBills?.val || 0) + (realExp?.val || 0)
    });
  }

  return c.json({ 
    ...stats, 
    recentBills: recentBills.results, 
    byCategory: byCategory.results, 
    cashflow,
    recentProjects: recentProjects.results,
    recentInvoices: recentInvoices.results,
    recentClients: recentClients.results,
    recentTime: recentTime.results
  });
});

app.post('/api/bills/:id/pay', auth, async (c) => {
  const bid = parseInt(c.req.param('id'));
  const uid = c.get('user').id;
  const body = await c.req.json().catch(() => ({}));
  
  const bill = await c.env.DB.prepare('SELECT * FROM bills WHERE id = ? AND user_id = ?').bind(bid, uid).first();
  if (!bill) return c.json({ error: 'Bill not found' }, 404);

  if (bill.status === 'paid') {
    return c.json({ error: 'This bill has already been marked as paid.' }, 400);
  }

  const amount = body.amount !== undefined ? body.amount : bill.amount;
  const paid_date = body.paid_date || new Date().toISOString().split('T')[0];
  const note = (body.note && c.env.JWT_SECRET) ? await encrypt(body.note, c.env.JWT_SECRET) : (body.note || '');

  try {
    // 1. Ensure payments table exists (Auto-heal for Cloudflare D1)
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount REAL NOT NULL,
        paid_date TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 2. Record the payment
    try {
      await c.env.DB.prepare('INSERT INTO payments (user_id, bill_id, amount, paid_date, note) VALUES (?, ?, ?, ?, ?)')
        .bind(uid, bid, amount, paid_date, note).run();
    } catch (e) {
      if (e.message.includes('no such column: note')) {
        // Migration: Add note column if missing
        await c.env.DB.prepare('ALTER TABLE payments ADD COLUMN note TEXT').run().catch(() => {});
        await c.env.DB.prepare('INSERT INTO payments (user_id, bill_id, amount, paid_date, note) VALUES (?, ?, ?, ?, ?)')
          .bind(uid, bid, amount, paid_date, note).run();
      } else {
        throw e;
      }
    }

    // 3. Mark current bill as paid (keep its current due_date as history)
    await c.env.DB.prepare('UPDATE bills SET status = "paid" WHERE id = ?').bind(bid).run();

    // 4. Handle recurrence: Create a new bill for the next period
    if (bill.recurrence && bill.recurrence !== 'one-time') {
      try {
        const nextDate = getNextDate(bill.due_date, bill.recurrence);
        if (nextDate) {
          // Idempotency: Check if the next bill already exists
          const existingNext = await c.env.DB.prepare('SELECT id FROM bills WHERE user_id = ? AND name = ? AND due_date = ?')
            .bind(uid, bill.name, nextDate).first();

          if (!existingNext) {
            await c.env.DB.prepare(`
              INSERT INTO bills (user_id, name, category, amount, due_date, recurrence, status, notes, client)
              VALUES (?, ?, ?, ?, ?, ?, 'upcoming', ?, ?)
            `).bind(uid, bill.name, bill.category, bill.amount, nextDate, bill.recurrence, bill.notes, bill.client).run();
          }
        }
      } catch (recurErr) {
        console.error('Failed to create recurring bill:', recurErr);
      }
    }

    return c.json({ success: true });
  } catch (e) {
    console.error('Payment failed:', e);
    return c.json({ 
      error: 'DATABASE_ERROR', 
      details: e.message,
      debug: `ID: ${bid}, UID: ${uid}, Table: payments`
    }, 500);
  }
});

// Helper for recurring dates
function getNextDate(dateStr, recurrence) {
  const d = new Date(dateStr + 'T12:00:00');
  switch (recurrence) {
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
    default: return null;
  }
  return d.toISOString().split('T')[0];
}

app.delete('/api/bills/:id', auth, async (c) => {
  await c.env.DB.prepare('DELETE FROM bills WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('user').id).run();
  return c.json({ success: true });
});

app.delete('/api/income/:id', auth, async (c) => {
  await c.env.DB.prepare('DELETE FROM income WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('user').id).run();
  return c.json({ success: true });
});

app.delete('/api/clients/:id', auth, async (c) => {
  await c.env.DB.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('user').id).run();
  return c.json({ success: true });
});

app.delete('/api/projects/:id', auth, async (c) => {
  await c.env.DB.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('user').id).run();
  return c.json({ success: true });
});

app.delete('/api/invoices/:id', auth, async (c) => {
  await c.env.DB.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('user').id).run();
  return c.json({ success: true });
});

app.delete('/api/expenses/:id', auth, async (c) => {
  await c.env.DB.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('user').id).run();
  return c.json({ success: true });
});

app.delete('/api/time-entries/:id', auth, async (c) => {
  await c.env.DB.prepare('DELETE FROM time_entries WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('user').id).run();
  return c.json({ success: true });
});

app.delete('/api/auth/data', auth, async (c) => {
  const uid = c.get('user').id;
  await c.env.DB.prepare('DELETE FROM payments WHERE user_id = ?').bind(uid).run();
  await c.env.DB.prepare('DELETE FROM bills WHERE user_id = ?').bind(uid).run();
  await c.env.DB.prepare('DELETE FROM income WHERE user_id = ?').bind(uid).run();
  return c.json({ success: true });
});

// --- CLIENTS & PROJECTS ---

app.get('/api/clients', auth, async (c) => {
    const { results } = await c.env.DB.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC').bind(c.get('user').id).all();
    return c.json(results);
});

app.post('/api/clients', auth, async (c) => {
    const { name, email, company, notes } = await c.req.json();
    const res = await c.env.DB.prepare('INSERT INTO clients (user_id, name, email, company, notes) VALUES (?, ?, ?, ?, ?) RETURNING id')
        .bind(c.get('user').id, name, email, company, notes).first();
    return c.json({ id: res.id });
});

app.delete('/api/clients/:id', auth, async (c) => {
    await c.env.DB.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?')
        .bind(c.req.param('id'), c.get('user').id).run();
    return c.json({ success: true });
});

app.get('/api/projects', auth, async (c) => {
    const { results } = await c.env.DB.prepare(`
        SELECT p.*, c.name as client_name 
        FROM projects p 
        LEFT JOIN clients c ON p.client_id = c.id 
        WHERE p.user_id = ? 
        ORDER BY p.deadline ASC
    `).bind(c.get('user').id).all();
    return c.json(results);
});

app.post('/api/projects', auth, async (c) => {
    const { client_id, name, budget, deadline, description } = await c.req.json();
    const res = await c.env.DB.prepare('INSERT INTO projects (user_id, client_id, name, budget, deadline, description) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
        .bind(c.get('user').id, client_id, name, budget, deadline, description).first();
    return c.json({ id: res.id });
});

app.patch('/api/projects/:id/status', auth, async (c) => {
    const { status } = await c.req.json();
    await c.env.DB.prepare('UPDATE projects SET status = ? WHERE id = ? AND user_id = ?')
        .bind(status, c.req.param('id'), c.get('user').id).run();
    return c.json({ success: true });
});

// --- E2EE CRYPTOGRAPHY HUB ---

/**
 * Uploads pre-key bundles for asynchronous X3DH handshakes
 */
app.post('/api/crypto/bundle', auth, async (c) => {
    const { identityKey, signedPreKey, oneTimePreKeys } = await c.req.json();
    const userId = c.get('user').id;

    // Ensure tables exist
    await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS crypto_bundles (
            user_id INTEGER PRIMARY KEY,
            identity_key TEXT NOT NULL,
            signed_pre_key TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS crypto_onetime_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            key_data TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `).run();

    // Store/Update Bundle
    await c.env.DB.prepare(`
        INSERT INTO crypto_bundles (user_id, identity_key, signed_pre_key) 
        VALUES (?, ?, ?) 
        ON CONFLICT(user_id) DO UPDATE SET 
        identity_key=excluded.identity_key, 
        signed_pre_key=excluded.signed_pre_key,
        updated_at=CURRENT_TIMESTAMP
    `).bind(userId, identityKey, signedPreKey).run();

    // Store One-Time Keys
    if (oneTimePreKeys && oneTimePreKeys.length > 0) {
        const stmt = c.env.DB.prepare('INSERT INTO crypto_onetime_keys (user_id, key_data) VALUES (?, ?)');
        await c.env.DB.batch(oneTimePreKeys.map(k => stmt.bind(userId, k)));
    }

    return c.json({ success: true });
});

/**
 * Retrieves a peer's pre-key bundle to start an encrypted session
 */
app.get('/api/crypto/bundle/:peerEmail', auth, async (c) => {
    const peerEmail = c.req.param('peerEmail');
    
    // Find peer by email
    const peer = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(peerEmail).first();
    if (!peer) return c.json({ error: 'Peer not found' }, 404);

    const bundle = await c.env.DB.prepare('SELECT identity_key, signed_pre_key FROM crypto_bundles WHERE user_id = ?')
        .bind(peer.id).first();
    
    if (!bundle) return c.json({ error: 'Peer has not initialized E2EE' }, 404);

    // Get one one-time key and delete it (it's "one-time")
    const otk = await c.env.DB.prepare('SELECT id, key_data FROM crypto_onetime_keys WHERE user_id = ? LIMIT 1')
        .bind(peer.id).first();
    
    if (otk) {
        await c.env.DB.prepare('DELETE FROM crypto_onetime_keys WHERE id = ?').bind(otk.id).run();
    }

    return c.json({
        identityKey: bundle.identity_key,
        signedPreKey: bundle.signed_pre_key,
        oneTimePreKey: otk ? otk.key_data : null
    });
});


app.delete('/api/projects/:id', auth, async (c) => {
    await c.env.DB.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?')
        .bind(c.req.param('id'), c.get('user').id).run();
    return c.json({ success: true });
});

// --- TIME TRACKING ---

app.get('/api/time-entries', auth, async (c) => {
    const { results } = await c.env.DB.prepare(`
        SELECT t.*, p.name as project_name 
        FROM time_entries t 
        LEFT JOIN projects p ON t.project_id = p.id 
        WHERE t.user_id = ? 
        ORDER BY t.start_time DESC
    `).bind(c.get('user').id).all();
    return c.json(results);
});

app.post('/api/time-entries/start', auth, async (c) => {
    const { project_id, note } = await c.req.json();
    const startTime = new Date().toISOString();
    const res = await c.env.DB.prepare('INSERT INTO time_entries (user_id, project_id, start_time, is_running, note) VALUES (?, ?, ?, 1, ?) RETURNING id')
        .bind(c.get('user').id, project_id, startTime, note).first();
    return c.json({ id: res.id, start_time: startTime });
});

app.post('/api/time-entries/:id/stop', auth, async (c) => {
    const id = c.req.param('id');
    const endTime = new Date().toISOString();
    
    const entry = await c.env.DB.prepare('SELECT start_time FROM time_entries WHERE id = ? AND user_id = ?').bind(id, c.get('user').id).first();
    if (!entry) return c.json({ error: 'Entry not found' }, 404);
    
    const duration = Math.floor((new Date(endTime) - new Date(entry.start_time)) / 1000);
    
    await c.env.DB.prepare('UPDATE time_entries SET end_time = ?, duration_seconds = ?, is_running = 0 WHERE id = ? AND user_id = ?')
        .bind(endTime, duration, id, c.get('user').id).run();
        
    return c.json({ success: true, duration_seconds: duration });
});

app.delete('/api/time-entries/:id', auth, async (c) => {
    await c.env.DB.prepare('DELETE FROM time_entries WHERE id = ? AND user_id = ?')
        .bind(c.req.param('id'), c.get('user').id).run();
    return c.json({ success: true });
});

// --- EXPENSES ---

app.get('/api/expenses', auth, async (c) => {
    const { results } = await c.env.DB.prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC').bind(c.get('user').id).all();
    return c.json(results);
});

app.post('/api/expenses', auth, async (c) => {
    const { category, description, amount, date } = await c.req.json();
    const res = await c.env.DB.prepare('INSERT INTO expenses (user_id, category, description, amount, date) VALUES (?, ?, ?, ?, ?) RETURNING id')
        .bind(c.get('user').id, category, description, amount, date).first();
    return c.json({ id: res.id });
});

app.delete('/api/expenses/:id', auth, async (c) => {
    await c.env.DB.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?')
        .bind(c.req.param('id'), c.get('user').id).run();
    return c.json({ success: true });
});

// --- INVOICES ---

app.get('/api/invoices', auth, async (c) => {
    const { results } = await c.env.DB.prepare(`
        SELECT i.*, c.name as client_name, p.name as project_name 
        FROM invoices i 
        LEFT JOIN clients c ON i.client_id = c.id 
        LEFT JOIN projects p ON i.project_id = p.id 
        WHERE i.user_id = ? 
        ORDER BY i.created_at DESC
    `).bind(c.get('user').id).all();
    return c.json(results);
});

app.post('/api/invoices', auth, async (c) => {
    const { project_id, client_id, invoice_number, amount, due_date, items } = await c.req.json();
    const res = await c.env.DB.prepare(`
        INSERT INTO invoices (user_id, project_id, client_id, invoice_number, amount, due_date, items) 
        VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id
    `).bind(c.get('user').id, project_id, client_id, invoice_number, amount, due_date, JSON.stringify(items)).first();
    return c.json({ id: res.id });
});

app.patch('/api/invoices/:id/status', auth, async (c) => {
    const { status } = await c.req.json();
    await c.env.DB.prepare('UPDATE invoices SET status = ? WHERE id = ? AND user_id = ?')
        .bind(status, c.req.param('id'), c.get('user').id).run();
    return c.json({ success: true });
});

app.delete('/api/invoices/:id', auth, async (c) => {
    await c.env.DB.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?')
        .bind(c.req.param('id'), c.get('user').id).run();
    return c.json({ success: true });
});

// --- ADMIN COMMAND CENTER ---

app.get('/api/admin/security-stats', auth, async (c) => {
  if (!isRootAdmin(c.get('user').email)) return c.json({ error: 'Clearance required' }, 403);
  
  const userCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
  const billCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM bills').first();
  const totalVolume = await c.env.DB.prepare('SELECT SUM(amount) as sum FROM payments').first();
  const threatCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM security_logs WHERE event_type LIKE "%BLOCKED%" OR event_type LIKE "%LIMIT%"').first();
  
  return c.json({
    total_users: userCount.count,
    total_bills: billCount.count,
    platform_revenue: totalVolume.sum || 0,
    threats_neutralized: threatCount.count,
    system_health: {
      memory_usage: 'Minimal (Edge)',
      uptime: '99.99%',
    },
    settings: {
      maintenance_mode: false,
      registration_enabled: true
    }
  });
});

app.get('/api/admin/security-logs', auth, async (c) => {
  if (!isRootAdmin(c.get('user').email)) return c.json({ error: 'Clearance required' }, 403);
  const { results } = await c.env.DB.prepare('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 50').all();
  return c.json(results);
});

app.get('/api/admin/feedback', auth, async (c) => {
  if (!isRootAdmin(c.get('user').email)) return c.json({ error: 'Clearance required' }, 403);
  const { results } = await c.env.DB.prepare('SELECT * FROM feedback ORDER BY created_at DESC').all();
  return c.json(results);
});

app.get('/api/admin/users', auth, async (c) => {
  if (!isRootAdmin(c.get('user').email)) return c.json({ error: 'Clearance required' }, 403);
  const { results } = await c.env.DB.prepare('SELECT id, name, email, role, is_banned, created_at FROM users ORDER BY created_at DESC').all();
  return c.json(results);
});

app.get('/api/admin/system-info', auth, async (c) => {
  if (!isRootAdmin(c.get('user').email)) return c.json({ error: 'Clearance required' }, 403);
  return c.json({
    node_version: 'Edge Runtime',
    platform: 'Cloudflare Workers',
    arch: 'wasm',
    process_uptime: 0,
    memory: { heapUsed: 0 }
  });
});

app.get('/api/admin/db/tables', auth, async (c) => {
  if (!isRootAdmin(c.get('user').email)) return c.json({ error: 'Clearance required' }, 403);
  // D1 internal table query
  const { results } = await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  return c.json(results.map(r => r.name));
});

app.get('/api/admin/db/table/:name', auth, async (c) => {
  if (!isRootAdmin(c.get('user').email)) return c.json({ error: 'Clearance required' }, 403);
  const tableName = c.req.param('name');
  // Safe table name validation
  const allowedTables = ['users', 'bills', 'payments', 'income', 'security_logs', 'feedback', 'bug_reports', 'bug_messages', 'notifications'];
  if (!allowedTables.includes(tableName)) return c.json({ error: 'Invalid table' }, 400);

  const { results } = await c.env.DB.prepare(`SELECT * FROM ${tableName} ORDER BY 1 DESC LIMIT 100`).all();
  return c.json(results);
});

app.post('/api/admin/ban-user', auth, async (c) => {
  if (!isRootAdmin(c.get('user').email)) return c.json({ error: 'Clearance required' }, 403);
  const { userId } = await c.req.json();
  
  if (!userId) return c.json({ error: 'User ID required' }, 400);
  
  // Prevent banning the root admin
  const targetUser = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first();
  if (isRootAdmin(targetUser?.email)) return c.json({ error: 'Cannot ban root admin' }, 400);

  await c.env.DB.prepare('UPDATE users SET is_banned = 1, email_verified = 0 WHERE id = ?')
    .bind(userId).run();

  await logSecurityEvent(c, 'USER_PERMANENT_BAN', c.req.header('CF-Connecting-IP'), `User ID ${userId} (${targetUser?.email}) banned by admin`);
  
  return c.json({ success: true, message: 'User permanently banned' });
});

app.post('/api/admin/users/:userId/role', auth, async (c) => {
  if (!isRootAdmin(c.get('user').email)) return c.json({ error: 'Clearance required' }, 403);
  const userId = c.req.param('userId');
  const { role } = await c.req.json();
  
  if (!['admin', 'user'].includes(role)) return c.json({ error: 'Invalid role' }, 400);

  const targetUser = await c.env.DB.prepare('SELECT email, name FROM users WHERE id = ?').bind(userId).first();
  if (!targetUser) return c.json({ error: 'User not found' }, 404);
  
  if (isRootAdmin(targetUser.email)) return c.json({ error: 'Cannot modify root admin' }, 400);

  await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, userId).run();

  // Sweet message/notification for the promoted/demoted user
  if (role === 'admin') {
    await c.env.DB.prepare(
      'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, 'promotion', '🎉 Congratulations!', `Hello ${targetUser.name}, you have been promoted to Platform Administrator! You now have access to the Security Command Center.`, '/').run();
  } else {
    await c.env.DB.prepare(
      'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, 'demotion', 'Role Update', `Your administrative privileges have been revoked by the Root Admin.`, '/').run();
  }

  await logSecurityEvent(c, 'ROLE_CHANGE', c.req.header('CF-Connecting-IP'), `User ID ${userId} (${targetUser.email}) role changed to ${role} by admin`);
  
  return c.json({ success: true, message: `User role updated to ${role}` });
});

app.delete('/api/admin/users/:userId', auth, async (c) => {
  if (!isRootAdmin(c.get('user').email)) return c.json({ error: 'Clearance required' }, 403);
  const userId = c.req.param('userId');

  const targetUser = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first();
  if (isRootAdmin(targetUser?.email)) return c.json({ error: 'Cannot delete root admin' }, 400);

  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
  
  await logSecurityEvent(c, 'USER_DELETED', c.req.header('CF-Connecting-IP'), `User ID ${userId} (${targetUser?.email}) permanently deleted by admin`);
  
  return c.json({ success: true, message: 'User permanently deleted' });
});

app.post('/api/admin/notifications', auth, async (c) => {
  if (!isRootAdmin(c.get('user').email)) return c.json({ error: 'Clearance required' }, 403);
  const { user_id, type, title, message, link } = await c.req.json();
  if (!user_id || !title || !message) {
    return c.json({ error: 'user_id, title, and message are required' }, 400);
  }

  try {
    // Verify target user exists
    const user = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(user_id).first();
    if (!user) return c.json({ error: 'Target user not found' }, 404);

    await c.env.DB.prepare(
      'INSERT INTO notifications (user_id, type, title, message, link, is_read) VALUES (?, ?, ?, ?, ?, 0)'
    ).bind(user_id, type || 'admin_message', title, message, link || null).run();

    await logSecurityEvent(c, 'ADMIN_NOTIFICATION_SENT', c.req.header('CF-Connecting-IP'), `Admin ${c.get('user').email} sent a message to user ${user.email}`);
    return c.json({ success: true, message: 'Notification sent successfully' });
  } catch (err) {
    console.error('Send notification error:', err);
    return c.json({ error: 'Failed to send notification' }, 500);
  }
});

// --- BUG REPORTING ---
app.post('/api/bugs', auth, async (c) => {
  const { subject, description, image_data } = await c.req.json();
  if (!subject || !description) return c.json({ error: 'Subject and description are required' }, 400);

  const result = await c.env.DB.prepare(
    'INSERT INTO bug_reports (user_id, subject, description, image_data, status) VALUES (?, ?, ?, ?, ?) RETURNING id'
  ).bind(c.get('user').id, subject, description, image_data || null, 'open').first();

  // Notify Admin
  const adminUser = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(ADMIN_EMAIL).first();
  if (adminUser) {
    await c.env.DB.prepare(
      'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
    ).bind(adminUser.id, 'bug_report', 'New Bug Reported', `A new bug report has been submitted: ${subject}`, '/bugs').run();
  }

  await logSecurityEvent(c, 'BUG_REPORTED', c.req.header('CF-Connecting-IP'), `Bug report created by ${c.get('user').email}`);
  return c.json({ success: true, id: result.id });
});

app.get('/api/bugs', auth, async (c) => {
  let bugs;
  if (isRootAdmin(c.get('user').email)) {
    const { results } = await c.env.DB.prepare(`
      SELECT b.*, u.name as user_name, u.email as user_email 
      FROM bug_reports b 
      JOIN users u ON b.user_id = u.id 
      ORDER BY b.created_at DESC
    `).all();
    bugs = results;
  } else {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM bug_reports WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(c.get('user').id).all();
    bugs = results;
  }
  return c.json(bugs);
});

app.get('/api/bugs/:id/messages', auth, async (c) => {
  const bugId = c.req.param('id');
  const bug = await c.env.DB.prepare('SELECT * FROM bug_reports WHERE id = ?').bind(bugId).first();
  if (!bug) return c.json({ error: 'Bug report not found' }, 404);
  if (!isRootAdmin(c.get('user').email) && bug.user_id !== c.get('user').id) {
    return c.json({ error: 'Unauthorized access' }, 403);
  }

  const { results } = await c.env.DB.prepare(`
    SELECT m.*, u.name as sender_name, u.role as sender_role 
    FROM bug_messages m 
    JOIN users u ON m.sender_id = u.id 
    WHERE m.bug_report_id = ? 
    ORDER BY m.created_at ASC
  `).bind(bugId).all();
  
  return c.json(results);
});

app.post('/api/bugs/:id/messages', auth, async (c) => {
  const { message } = await c.req.json();
  if (!message) return c.json({ error: 'Message is required' }, 400);

  const bugId = c.req.param('id');
  const bug = await c.env.DB.prepare('SELECT * FROM bug_reports WHERE id = ?').bind(bugId).first();
  if (!bug) return c.json({ error: 'Bug report not found' }, 404);
  
  const currentUser = c.get('user');
  if (!isRootAdmin(currentUser.email) && bug.user_id !== currentUser.id) {
    return c.json({ error: 'Unauthorized access' }, 403);
  }

  await c.env.DB.prepare(
    'INSERT INTO bug_messages (bug_report_id, sender_id, message) VALUES (?, ?, ?)'
  ).bind(bugId, currentUser.id, message).run();

  // Notification Logic
  if (isRootAdmin(currentUser.email)) {
    // Notify User
    await c.env.DB.prepare(
      'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
    ).bind(bug.user_id, 'admin_message', 'Admin Replied to Bug', `Support team has sent a message regarding: ${bug.subject}`, '/bugs').run();
  } else {
    // Notify Admin
    const adminUser = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(ADMIN_EMAIL).first();
    if (adminUser) {
      await c.env.DB.prepare(
        'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
      ).bind(adminUser.id, 'user_message', 'New Bug Message', `User ${currentUser.name} replied to bug: ${bug.subject}`, '/bugs').run();
    }
  }

  return c.json({ success: true });
});

app.patch('/api/bugs/:id/status', auth, async (c) => {
  if (!isRootAdmin(c.get('user').email)) return c.json({ error: 'Clearance required' }, 403);
  const { status } = await c.req.json();
  if (!['open', 'resolved'].includes(status)) return c.json({ error: 'Invalid status' }, 400);

  const bugId = c.req.param('id');
  const bug = await c.env.DB.prepare('SELECT * FROM bug_reports WHERE id = ?').bind(bugId).first();
  
  await c.env.DB.prepare('UPDATE bug_reports SET status = ? WHERE id = ?').bind(status, bugId).run();

  // Notify User about status update
  if (bug) {
    await c.env.DB.prepare(
      'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
    ).bind(bug.user_id, 'bug_status', 'Bug Status Updated', `Your bug report "${bug.subject}" is now marked as ${status}`, '/bugs').run();
  }

  return c.json({ success: true });
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', auth, async (c) => {
  // Auto-heal: Ensure notifications table exists
  await c.env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run().catch(() => {});

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).bind(c.get('user').id).all();
  return c.json(results);
});

app.patch('/api/notifications/:id/read', auth, async (c) => {
  await c.env.DB.prepare(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
  ).bind(c.req.param('id'), c.get('user').id).run();
  return c.json({ success: true });
});

app.patch('/api/notifications/read-all', auth, async (c) => {
  await c.env.DB.prepare(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ?'
  ).bind(c.get('user').id).run();
  return c.json({ success: true });
});

// ===================== EXPORT & DOWNLOAD (CLOUD VERSION) =====================
app.post('/api/auth/export-token', auth, async (c) => {
  const user = c.get('user');
  const { format } = await c.req.json();
  
  // Create a secure, short-lived export token (stateless)
  const exportToken = await new jose.SignJWT({ 
    uid: user.id, 
    format: format,
    type: 'export'
  })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('2m') // 2 minutes to click the link
  .sign(new TextEncoder().encode(c.env.JWT_SECRET));

  return c.json({ token: exportToken });
});

app.get('/api/download', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.html('<h2>Missing download token.</h2>', 400);

  let payload;
  try {
    const { payload: verifiedPayload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(c.env.JWT_SECRET)
    );
    payload = verifiedPayload;
    
    if (payload.type !== 'export') throw new Error('Invalid token type');
  } catch (e) {
    console.error('Download token verification failed:', e.message);
    return c.html('<h2>Download link expired or invalid. Please try again from Settings.</h2>', 401);
  }

  const { uid, format } = payload;
  const db = c.env.DB;

  try {
    const user = await db.prepare('SELECT name, email, currency FROM users WHERE id = ?').bind(uid).first();
    const bills = await db.prepare('SELECT * FROM bills WHERE user_id = ? ORDER BY due_date ASC').bind(uid).all();
    const income = await db.prepare('SELECT * FROM income WHERE user_id = ? ORDER BY received_date DESC').bind(uid).all();
    const payments = await db.prepare('SELECT p.*, b.name as bill_name FROM payments p LEFT JOIN bills b ON p.bill_id = b.id WHERE p.user_id = ? ORDER BY p.paid_date DESC').bind(uid).all();

    // CLOUD FALLBACK: Generate CSV instead of Excel/PDF (as libraries are too heavy for Worker)
    let csvContent = `FREE-LANCE PAY REPORT - ${new Date().toLocaleDateString()}\n`;
    csvContent += `User: ${user.name} (${user.email})\n\n`;

    csvContent += "--- BILLS ---\n";
    csvContent += "Name,Category,Amount,Due Date,Status,Client\n";
    bills.results.forEach(b => {
      csvContent += `"${b.name}","${b.category}",${b.amount},"${b.due_date}","${b.status}","${b.client || ''}"\n`;
    });

    csvContent += "\n--- PAYMENTS ---\n";
    csvContent += "Bill,Amount Paid,Date Paid,Note\n";
    payments.results.forEach(p => {
      csvContent += `"${p.bill_name}",${p.amount},"${p.paid_date}","${p.note || ''}"\n`;
    });

    csvContent += "\n--- INCOME ---\n";
    csvContent += "Description,Amount,Date,Client\n";
    income.results.forEach(i => {
      csvContent += `"${i.description}",${i.amount},"${i.received_date}","${i.client || ''}"\n`;
    });

    const fileName = `FreelancePay_Report_${uid}_${format}.csv`;
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (err) {
    console.error('Export error', err);
    return c.html('<h2>Failed to generate report. Please try again.</h2>', 500);
  }
});

export default app;
