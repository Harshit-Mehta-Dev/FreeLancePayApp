import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { getCookie, setCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { encrypt, decrypt } from './worker-encryption.js';

const app = new Hono();

// 1. BANK-LEVEL SECURITY HEADERS
app.use('*', secureHeaders());

// 2. STRICT ORIGIN LOCKDOWN
const ALLOWED_ORIGIN = 'https://freelance-pay-cloud.pages.dev';

// 3. INTELLIGENT RATE LIMITER (In-Memory per Isolate)
const rateLimitMap = new Map();
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
  if (origin && origin !== ALLOWED_ORIGIN) {
    console.warn(`Blocked request from unauthorized origin: ${origin}`);
    return c.json({ error: 'Security Violation: Origin not permitted' }, 403);
  }
  await next();
});

app.use('*', cors({
  origin: ALLOWED_ORIGIN,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
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

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (c) => {
  const { name, email, password, currency } = await c.req.json();
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
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
    console.error('Register error:', e);
    return c.json({ error: 'Email already exists' }, 400); 
  }
});

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  const ip = c.req.header('CF-Connecting-IP') || 'Unknown';
  
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    await logSecurityEvent(c, 'AUTH_FAILURE', ip, `Failed login attempt for: ${email}`);
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const role = isRootAdmin(email) ? 'admin' : (user.role || 'user');
  const token = await new jose.SignJWT({ id: user.id, email: user.email, name: user.name, role })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(new TextEncoder().encode(c.env.JWT_SECRET));

  setCookie(c, 'fp_token', token, { 
    httpOnly: true, 
    secure: true, 
    sameSite: 'Strict', 
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });
  return c.json({ user: { id: user.id, name: user.name, email: user.email, currency: user.currency, role } });
});

app.get('/api/auth/me', auth, async (c) => {
  const user = await c.env.DB.prepare('SELECT id, name, email, currency, role FROM users WHERE id = ?').bind(c.get('user').id).first();
  if (user && isRootAdmin(user.email)) user.role = 'admin';
  return c.json(user);
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
      ).bind(name, email, await bcrypt.hash(Math.random().toString(36), 10), 'USD', picture, role).first();
      user = { id: result.id, name, email, role, currency: 'USD' };
    } else {
      user.role = role;
    }
    
    const token = await new jose.SignJWT({ id: user.id, email: user.email, name: user.name, role: user.role })
      .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(new TextEncoder().encode(c.env.JWT_SECRET));

    setCookie(c, 'fp_token', token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'Strict', 
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    // Dynamic redirect back to the app
    const appOrigin = 'https://freelance-pay-cloud.pages.dev';
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
      ).bind(name, email, await bcrypt.hash(Math.random().toString(36), 10), 'USD', picture, role).first();
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
    return c.json({ error: 'Invalid Google Token' }, 401);
  }
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
  const bills = await c.env.DB.prepare('SELECT * FROM bills WHERE user_id = ? ORDER BY due_date ASC').bind(c.get('user').id).all();
  return c.json(bills.results);
});

app.post('/api/bills', auth, async (c) => {
  const { name, amount, due_date, category, recurrence, notes, client } = await c.req.json();
  const res = await c.env.DB.prepare('INSERT INTO bills (user_id, name, amount, due_date, category, recurrence, notes, client) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(c.get('user').id, name, amount, due_date, category, recurrence, notes, client).first();
  return c.json({ id: res.id });
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
      (SELECT COUNT(*) FROM bills WHERE user_id = ? AND status = "upcoming") as upcomingCount
  `).bind(uid, uid, uid, uid, ymNow, uid, ymNow, uid).first();

  const recentBills = await c.env.DB.prepare('SELECT * FROM bills WHERE user_id = ? ORDER BY due_date ASC LIMIT 5').bind(uid).all();
  
  const byCategory = await c.env.DB.prepare(`
    SELECT category, SUM(amount) as total 
    FROM bills 
    WHERE user_id = ? AND status IN ("upcoming", "overdue") 
    GROUP BY category
  `).bind(uid).all();

  // Cashflow (simplified for performance)
  const cashflow = [];
  for (let i = -2; i <= 5; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    
    const exp = await c.env.DB.prepare('SELECT SUM(amount) as val FROM bills WHERE user_id = ? AND strftime("%Y-%m", due_date) = ?').bind(uid, ym).first();
    const inc = await c.env.DB.prepare('SELECT SUM(amount) as val FROM income WHERE user_id = ? AND strftime("%Y-%m", received_date) = ?').bind(uid, ym).first();
    
    cashflow.push({
      month: monthLabel,
      income: inc.val || 0,
      expenses: exp.val || 0,
      net: (inc.val || 0) - (exp.val || 0)
    });
  }

  return c.json({
    totalDue: stats.totalDue || 0,
    overdueAmt: stats.overdueAmt || 0,
    overdueCount: stats.overdueCount || 0,
    paidThisMonth: stats.paidThisMonth || 0,
    incomeThisMonth: stats.incomeThisMonth || 0,
    upcomingCount: stats.upcomingCount || 0,
    cashflow,
    recentBills: recentBills.results,
    byCategory: byCategory.results
  });
});

app.post('/api/bills/:id/pay', auth, async (c) => {
  const bid = c.req.param('id');
  const uid = c.get('user').id;
  const { amount, paid_date } = await c.req.json();

  const bill = await c.env.DB.prepare('SELECT * FROM bills WHERE id = ? AND user_id = ?').bind(bid, uid).first();
  if (!bill) return c.json({ error: 'Bill not found' }, 404);

  await c.env.DB.prepare('INSERT INTO payments (user_id, bill_id, amount, paid_date) VALUES (?, ?, ?, ?)')
    .bind(uid, bid, amount, paid_date).run();

  await c.env.DB.prepare('UPDATE bills SET status = "paid" WHERE id = ?').bind(bid).run();

  return c.json({ success: true });
});

app.delete('/api/bills/:id', auth, async (c) => {
  await c.env.DB.prepare('DELETE FROM bills WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('user').id).run();
  return c.json({ success: true });
});

app.delete('/api/income/:id', auth, async (c) => {
  await c.env.DB.prepare('DELETE FROM income WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('user').id).run();
  return c.json({ success: true });
});

app.delete('/api/auth/data', auth, async (c) => {
  const uid = c.get('user').id;
  await c.env.DB.prepare('DELETE FROM payments WHERE user_id = ?').bind(uid).run();
  await c.env.DB.prepare('DELETE FROM bills WHERE user_id = ?').bind(uid).run();
  await c.env.DB.prepare('DELETE FROM income WHERE user_id = ?').bind(uid).run();
  return c.json({ success: true });
});

// --- ADMIN COMMAND CENTER ---
app.get('/api/admin/stats', auth, async (c) => {
  if (!isRootAdmin(c.get('user').email)) return c.json({ error: 'Clearance required' }, 403);
  
  const userCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
  const billCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM bills').first();
  const totalMoney = await c.env.DB.prepare('SELECT SUM(amount) as sum FROM payments').first();
  const recentLogs = await c.env.DB.prepare('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 10').all();

  return c.json({
    users: userCount.count,
    bills: billCount.count,
    totalVolume: totalMoney.sum || 0,
    logs: recentLogs.results
  });
});

export default app;
