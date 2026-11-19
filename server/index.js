require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
}));
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment requests, please try again later.' },
});

const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  throw new Error('FRONTEND_URL environment variable is required');
}

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));
app.use(express.json());

// ============ SEO ============

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nAllow: /\n');
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
});

app.get('/sitemap.xml', async (req, res) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  const articles = db.prepare("SELECT slug, updated_at FROM articles WHERE status = 'published' ORDER BY updated_at DESC").all();
  const pages = ['', '/archive', '/about', '/membership', '/newsletter'];

  const urls = pages.map((p) => `
  <url>
    <loc>${baseUrl}${p}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('');

  const articleUrls = articles.map((a) => `
  <url>
    <loc>${baseUrl}/articles/${a.slug}</loc>
    <lastmod>${a.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
${articleUrls}
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

// Auth middleware — verify Firebase ID token
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const idToken = authHeader.substring(7);
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decoded.uid, email: decoded.email, name: decoded.name };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Admin role enforcement middleware
async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}


// ============ PUBLIC ARTICLES ============

app.get('/api/articles', (req, res) => {
  const { category, tag, search, sort = 'newest', premium = 'false', page = 1, per_page = 12 } = req.query;
  const pageNum = parseInt(page);
  const perPage = parseInt(per_page);
  const offset = (pageNum - 1) * perPage;

  let sql = `SELECT a.*, c.name AS category_name, au.name AS author_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN authors au ON a.author_id = au.id
    WHERE a.status = 'published'`;
  const params = [];

  if (premium === 'false') {
    sql += ' AND a.is_premium = 0';
  }
  if (category) {
    sql += ' AND (c.slug = ? OR a.category_id = ?)';
    params.push(category, category);
  }
  if (tag) {
    sql += ` AND a.id IN (SELECT article_id FROM article_tags WHERE tag_id = (SELECT id FROM tags WHERE slug = ?))`;
    params.push(tag);
  }
  if (search) {
    sql += ` AND a.id IN (SELECT rowid FROM articles_search WHERE articles_search MATCH ?)`;
    params.push(search);
  }

  const sortMap = { newest: 'a.published_at DESC', oldest: 'a.published_at ASC', popular: 'a.view_count DESC' };
  sql += ` ORDER BY ${sortMap[sort] || 'a.published_at DESC'} LIMIT ? OFFSET ?`;
  params.push(perPage, offset);

  const countSql = `SELECT COUNT(*) AS cnt FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN authors au ON a.author_id = au.id
    WHERE a.status = 'published'${premium === 'false' ? ' AND a.is_premium = 0' : ''}${category ? ' AND (c.slug = ? OR a.category_id = ?)' : ''}${tag ? ` AND a.id IN (SELECT article_id FROM article_tags WHERE tag_id = (SELECT id FROM tags WHERE slug = ?))` : ''}${search ? ` AND a.id IN (SELECT rowid FROM articles_search WHERE articles_search MATCH ?)` : ''}`;
  const countParams = [];
  if (premium === 'false') { /* no extra param */ }
  if (category) { countParams.push(category, category); }
  if (tag) { countParams.push(tag); }
  if (search) { countParams.push(search); }
  const totalRow = db.prepare(countSql).get(countParams);
  const total = totalRow.cnt;

  const rows = db.prepare(sql).all(params);
  const articles = rows.map(r => ({
    id: r.id, title: r.title, subtitle: r.subtitle, slug: r.slug,
    excerpt: r.excerpt, featured_image: r.featured_image,
    author_name: r.author_name, category_name: r.category_name,
    tags: db.prepare('SELECT t.id, t.name, t.slug FROM tags t JOIN article_tags at ON at.tag_id = t.id WHERE at.article_id = ?').all(r.id),
    published_at: r.published_at, updated_at: r.updated_at,
    reading_time: r.reading_time, is_premium: !!r.is_premium,
    view_count: r.view_count,
  }));

  res.json({ data: articles, meta: { page: pageNum, per_page: perPage, total, total_pages: Math.ceil(total / perPage) } });
});

app.get('/api/articles/:slug', async (req, res) => {
  const row = db.prepare(`SELECT a.*, c.name AS category_name, au.name AS author_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN authors au ON a.author_id = au.id
    WHERE a.slug = ? AND a.status = 'published'`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Article not found' });

  // Premium gating: if article is premium, require active subscription
  let content = row.content;
  if (row.is_premium) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      content = row.preview_length ? row.content.slice(0, row.preview_length) : row.excerpt;
    } else {
      try {
        const idToken = authHeader.substring(7);
        const decoded = await admin.auth().verifyIdToken(idToken);
        const user = db.prepare('SELECT membership, subscription_status FROM users WHERE id = ?').get(decoded.uid);
        if (!user || user.membership !== 'premium' || user.subscription_status !== 'active') {
          content = row.preview_length ? row.content.slice(0, row.preview_length) : row.excerpt;
        }
      } catch {
        content = row.preview_length ? row.content.slice(0, row.preview_length) : row.excerpt;
      }
    }
  }

  // Increment view count
  db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').run(row.id);

  const tags = db.prepare('SELECT t.id, t.name, t.slug FROM tags t JOIN article_tags at ON at.tag_id = t.id WHERE at.article_id = ?').all(row.id);

  const article = {
    id: row.id, title: row.title, subtitle: row.subtitle, slug: row.slug,
    content, excerpt: row.excerpt, featured_image: row.featured_image,
    author_name: row.author_name, category_name: row.category_name, tags,
    published_at: row.published_at, updated_at: row.updated_at,
    reading_time: row.reading_time, is_premium: !!row.is_premium,
    preview_length: row.preview_length, view_count: row.view_count,
  };

  res.json({ data: article });
});

app.get('/api/categories', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json({ data: rows });
});

app.get('/api/tags', (req, res) => {
  const rows = db.prepare('SELECT * FROM tags ORDER BY name').all();
  res.json({ data: rows });
});

app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ data: [] });
  const rows = db.prepare(`SELECT a.id, a.title, a.subtitle, a.slug, a.excerpt, c.name AS category_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'published' AND a.id IN (SELECT rowid FROM articles_search WHERE articles_search MATCH ?)
    LIMIT 20`).all(q);
  res.json({ data: rows });
});

// ============ AUTH ============

app.get('/api/auth/me', authLimiter, requireAuth, (req, res) => {
  const { uid, email, name } = req.user;
  let user = db.prepare('SELECT id, email, name, membership, subscription_status, role FROM users WHERE id = ?').get(uid);
  if (!user) {
    // Auto-create user record on first authenticated request
    const id = uid;
    db.prepare('INSERT INTO users (id, email, name, role, membership) VALUES (?, ?, ?, \'member\', \'free\')').run(id, email, name || '');
    user = { id, email, name: name || '', membership: 'free', subscription_status: null, role: 'member' };
  }
  res.json({ data: user });
});

app.put('/api/auth/profile', authLimiter, requireAuth, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.uid;
  if (!name) return res.status(400).json({ error: 'Name required' });
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, userId);
  const user = db.prepare('SELECT id, email, name, membership, subscription_status, role FROM users WHERE id = ?').get(userId);
  res.json({ data: user });
});

// Delete account (requires auth)
app.delete('/api/auth/account', requireAuth, async (req, res) => {
  const userId = req.user.uid;
  try {
    await admin.auth().deleteUser(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ data: { ok: true } });
  } catch {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ============ BOOKMARKS ============

app.get('/api/bookmarks', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT b.id, b.created_at, a.id AS article_id, a.title, a.slug, a.excerpt, a.reading_time, a.is_premium
    FROM bookmarks b
    JOIN articles a ON b.article_id = a.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC`).all(req.user.uid);
  res.json({ data: rows });
});

app.post('/api/bookmarks', requireAuth, (req, res) => {
  const { article_id } = req.body;
  if (!article_id) return res.status(400).json({ error: 'article_id required' });
  const id = Math.random().toString(36).slice(2);
  try {
    db.prepare('INSERT OR IGNORE INTO bookmarks (id, user_id, article_id) VALUES (?, ?, ?)').run(id, req.user.uid, article_id);
    res.status(201).json({ data: { id } });
  } catch {
    res.status(409).json({ error: 'Already bookmarked' });
  }
});

app.delete('/api/bookmarks/:article_id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND article_id = ?').run(req.user.uid, req.params.article_id);
  res.json({ data: { ok: true } });
});

app.get('/api/bookmarks/check/:article_id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND article_id = ?').get(req.user.uid, req.params.article_id);
  res.json({ data: { bookmarked: !!row } });
});

// ============ MEMBERSHIP ============

app.get('/api/membership', requireAuth, (req, res) => {
  const user = db.prepare('SELECT membership, subscription_status FROM users WHERE id = ?').get(req.user.uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ data: { membership: user.membership, subscription_status: user.subscription_status } });
});

// ============ NEWSLETTER ============

app.post('/api/newsletter/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const id = Math.random().toString(36).slice(2);
  const verificationToken = Math.random().toString(36).slice(2);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  try {
    db.prepare('INSERT INTO newsletter_subscribers (id, email, verified, verification_token, verification_token_expires) VALUES (?, ?, 0, ?, ?)').run(id, email, verificationToken, expiresAt);
    // In production, send a confirmation email containing the token. Returned here so the
    // flow can be completed without an external email provider.
    res.json({ data: { id, email, verified: false, verification_token: verificationToken, expires_at: expiresAt } });
  } catch {
    res.status(409).json({ error: 'Already subscribed' });
  }
});

app.post('/api/newsletter/verify', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Verification token required' });
  const row = db.prepare('SELECT id, verified, verification_token_expires FROM newsletter_subscribers WHERE verification_token = ? AND verified = 0').get(token);
  if (!row) return res.status(400).json({ error: 'Invalid or already verified token' });
  if (row.verification_token_expires && new Date(row.verification_token_expires) < new Date()) {
    return res.status(410).json({ error: 'Verification token expired' });
  }
  db.prepare('UPDATE newsletter_subscribers SET verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?').run(row.id);
  res.json({ data: { verified: true } });
});

app.post('/api/newsletter/unsubscribe', (req, res) => {
  const { email, token } = req.body;
  if (token) {
    db.prepare('DELETE FROM newsletter_subscribers WHERE verification_token = ?').run(token);
  } else if (email) {
    db.prepare('DELETE FROM newsletter_subscribers WHERE email = ?').run(email);
  } else {
    return res.status(400).json({ error: 'Email or verification token required' });
  }
  res.json({ data: { unsubscribed: true } });
});

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || '';

async function paystackRequest(method, path, body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`https://api.paystack.co${path}`, options);
  return res.json();
}

// Verify Paystack-Signature header (new whsec_ webhook signing secret)
function verifyPaystackSignature(rawBody, signatureHeader, webhookSecret) {
  const crypto = require('crypto');
  const parts = signatureHeader.split(',');
  let timestamp = null;
  const signatures = [];

  for (const part of parts) {
    const kv = part.split('=');
    if (kv[0] === 't') timestamp = parseInt(kv[1], 10);
    if (kv[0] === 'v1') signatures.push(kv[1]);
  }

  if (!timestamp || signatures.length === 0) return false;

  // Reject if timestamp is more than 300 seconds from server time
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) return false;

  // Compute HMAC-SHA512 of "timestamp.rawBody" using whsec_ secret
  const payload = timestamp + '.' + rawBody.toString();
  const expected = crypto.createHmac('sha512', webhookSecret).update(payload).digest('hex');

  // Constant-time compare against each v1 signature
  for (const sig of signatures) {
    if (/^[0-9a-f]{128}$/.test(sig)) {
      const expectedBuf = Buffer.from(expected, 'hex');
      const sigBuf = Buffer.from(sig, 'hex');
      if (expectedBuf.length === sigBuf.length && crypto.timingSafeEqual(expectedBuf, sigBuf)) {
        return true;
      }
    }
  }

  return false;
}

// ============ PAYMENTS (Paystack) ============

app.post('/api/payments/subscription', paymentLimiter, requireAuth, async (req, res) => {
  const { plan, email } = req.body;
  if (!plan) return res.status(400).json({ error: 'Plan required' });
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(500).json({ error: 'Paystack not configured. Set PAYSTACK_SECRET_KEY.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.uid);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Idempotency: reject if an active subscription already exists
  const existingSub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? AND status = ?').get(req.user.uid, 'active');
  if (existingSub) {
    return res.status(409).json({ error: 'Active subscription already exists' });
  }

  try {
    // Ensure a plan exists for this tier (create if needed)
    const planName = `AntiJournals ${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
    let planResp = await paystackRequest('GET', `/plan?name=${encodeURIComponent(planName)}`);
    let planCode;
    if (planResp.data && planResp.data.length > 0) {
      planCode = planResp.data[0].plan_code;
    } else {
      const amountMap = { monthly: 200000, yearly: 2000000 }; // NGN in kobo (Ã¢â€šÂ¦2,000 / Ã¢â€šÂ¦20,000)
      const intervalMap = { monthly: 'monthly', yearly: 'yearly' };
      const createResp = await paystackRequest('POST', '/plan', {
        name: planName,
        amount: amountMap[plan] || 200000,
        interval: intervalMap[plan] || 'monthly',
        currency: 'NGN',
      });
      if (!createResp.status) {
        return res.status(500).json({ error: 'Failed to create payment plan' });
      }
      planCode = createResp.data.plan_code;
    }

    // Initialize subscription payment (transaction)
    const initResp = await paystackRequest('POST', '/transaction/initialize', {
      email: user.email,
      amount: (amountMap[plan] || 200000),
      currency: 'NGN',
      metadata: {
        user_id: user.id,
        plan_code: planCode,
        plan: plan,
        type: 'subscription',
      },
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/account?payment=success`,
    });

    if (!initResp.status) {
      return res.status(500).json({ error: initResp.message || 'Payment initialization failed' });
    }

    res.json({ data: { authorization_url: initResp.data.authorization_url, reference: initResp.data.reference } });
  } catch (err) {
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

app.post('/api/payments/purchase', paymentLimiter, async (req, res) => {
  const { article_id, email } = req.body;
  if (!article_id || !email) return res.status(400).json({ error: 'Missing fields' });
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(500).json({ error: 'Paystack not configured. Set PAYSTACK_SECRET_KEY.' });
  }

  const article = db.prepare('SELECT * FROM articles WHERE id = ? AND is_premium = 1').get(article_id);
  if (!article) return res.status(404).json({ error: 'Premium article not found' });

  // Idempotency: reject if a paid purchase already exists for this email + article
  const existingPurchase = db.prepare('SELECT * FROM purchases WHERE email = ? AND article_id = ? AND status = ?').get(email, article_id, 'paid');
  if (existingPurchase) {
    return res.status(409).json({ error: 'Purchase already completed for this article' });
  }

  // Price per article: Ã¢â€šÂ¦1,000 in kobo (configurable could be added to settings later)
  const amount = 100000;

  try {
    const initResp = await paystackRequest('POST', '/transaction/initialize', {
      email,
      amount,
      currency: 'NGN',
      metadata: {
        article_id,
        type: 'purchase',
      },
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/articles/${article.slug}?payment=success`,
    });

    if (!initResp.status) {
      return res.status(500).json({ error: initResp.message || 'Payment initialization failed' });
    }

    // Record pending purchase
    const purchaseId = Math.random().toString(36).slice(2);
    db.prepare(`INSERT INTO purchases (id, email, article_id, amount, currency, status, paystack_reference)
      VALUES (?, ?, ?, ?, 'NGN', 'pending', ?)`)
      .run(purchaseId, email, article_id, amount, initResp.data.reference);

    res.json({ data: { authorization_url: initResp.data.authorization_url, reference: initResp.data.reference } });
  } catch (err) {
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const rawBody = req.body;
  const paystackSignature = req.headers['paystack-signature'];
  const legacySignature = req.headers['x-paystack-signature'];

  let verified = false;

  // Verify new Paystack-Signature header (uses whsec_ webhook signing secret)
  if (paystackSignature && PAYSTACK_WEBHOOK_SECRET) {
    try {
      verified = verifyPaystackSignature(rawBody, paystackSignature, PAYSTACK_WEBHOOK_SECRET);
    } catch {
      verified = false;
    }
  }

  // Fall back to deprecated x-paystack-signature (uses sk_ secret key)
  if (!verified && legacySignature && PAYSTACK_SECRET_KEY) {
    try {
      const hash = require('crypto').createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
      if (hash === legacySignature) verified = true;
    } catch {
      verified = false;
    }
  }

  if (!verified) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { event: eventType, data } = event;

  try {
    if (eventType === 'charge.success') {
      const { reference, metadata, amount, currency, customer } = data;

      if (metadata?.type === 'subscription') {
        // Activate subscription
        const userId = metadata.user_id;
        const plan = metadata.plan;
        const now = new Date().toISOString();
        const periodEnd = plan === 'yearly'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // Check if subscription exists
        const existing = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId);
        if (existing) {
          db.prepare(`UPDATE subscriptions SET status = 'active', plan = ?, amount = ?, currency = ?,
            current_period_end = ?, updated_at = ? WHERE user_id = ?`)
            .run(plan, amount, currency, periodEnd, now, userId);
        } else {
          const subId = Math.random().toString(36).slice(2);
          db.prepare(`INSERT INTO subscriptions (id, user_id, plan, amount, currency, interval, status, current_period_end)
            VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`)
            .run(subId, userId, plan, amount, currency, plan, periodEnd);
        }

        db.prepare(`UPDATE users SET membership = 'premium', subscription_status = 'active' WHERE id = ?`).run(userId);

        // Record analytics
        db.prepare(`INSERT INTO analytics_events (id, event_type, user_id, created_at)
          VALUES (?, 'membership_conversion', ?, ?)`)
          .run(Math.random().toString(36).slice(2), userId, now);
      }

      if (metadata?.type === 'purchase') {
        // Mark purchase as paid and grant access
        const purchase = db.prepare('SELECT * FROM purchases WHERE paystack_reference = ?').get(reference);
        if (purchase && purchase.status !== 'paid') {
          db.prepare(`UPDATE purchases SET status = 'paid' WHERE id = ?`).run(purchase.id);
          db.prepare(`INSERT INTO analytics_events (id, event_type, article_id, created_at)
            VALUES (?, 'premium_purchase', ?, ?)`)
            .run(Math.random().toString(36).slice(2), purchase.article_id, new Date().toISOString());
        }
      }
    }

    if (eventType === 'charge.failed') {
      const { metadata, reference } = data;
      if (metadata?.type === 'purchase') {
        const purchase = db.prepare('SELECT * FROM purchases WHERE paystack_reference = ?').get(reference);
        if (purchase) {
          db.prepare(`UPDATE purchases SET status = 'failed' WHERE id = ?`).run(purchase.id);
        }
      }
      if (metadata?.type === 'subscription') {
        const userId = metadata.user_id;
        db.prepare(`UPDATE users SET subscription_status = 'failed' WHERE id = ?`).run(userId);
      }
    }

    if (eventType === 'subscription.not_renewable' || eventType === 'subscription.disable') {
      const customerEmail = data.customer?.email;
      if (customerEmail) {
        db.prepare(`UPDATE users SET membership = 'free', subscription_status = 'canceled' WHERE email = ?`).run(customerEmail);
      }
    }

    // Subscription expiration check: deactivate expired subscriptions
    const now = new Date().toISOString();
    const expired = db.prepare(`SELECT user_id FROM subscriptions WHERE status = 'active' AND current_period_end < ?`).all(now);
    for (const sub of expired) {
      db.prepare(`UPDATE subscriptions SET status = 'canceled' WHERE user_id = ?`).run(sub.user_id);
      db.prepare(`UPDATE users SET membership = 'free', subscription_status = 'canceled' WHERE id = ?`).run(sub.user_id);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.get('/api/payments/verify/:reference', authLimiter, requireAuth, async (req, res) => {
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(500).json({ error: 'Paystack not configured' });
  }
  try {
    const verifyResp = await paystackRequest('GET', `/transaction/verify/${req.params.reference}`);
    if (!verifyResp.status) {
      return res.status(400).json({ error: 'Verification failed' });
    }
    const { status, reference, metadata, amount } = verifyResp.data;
    res.json({ data: { status, reference, metadata, amount, paid: status === 'success' } });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Payment history (requires auth)
app.get('/api/payments/history', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT id, article_id, amount, currency, status, paystack_reference, created_at
    FROM purchases WHERE user_id = ? OR email = ?
    ORDER BY created_at DESC`).all(req.user.uid, req.user.email);
  res.json({ data: rows });
});

// ============ ANALYTICS ============

app.post('/api/analytics', requireAuth, (req, res) => {
  const { event_type, article_id, session_id, referrer } = req.body;
  if (!event_type) return res.status(400).json({ error: 'event_type required' });
  const id = Math.random().toString(36).slice(2);
  try {
    db.prepare(`INSERT INTO analytics_events (id, event_type, article_id, user_id, session_id, ip, user_agent, referrer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, event_type, article_id || null, req.user.uid, session_id || null, req.ip, req.headers['user-agent'] || null, referrer || null);
    res.json({ data: { ok: true } });
  } catch {
    res.status(500).json({ error: 'Failed to record event' });
  }
});

// Health
app.get('/api/health', (req, res) => res.json({ data: { status: 'ok' } }));

// Analytics data retention cleanup: delete events older than 12 months.
// Intended to be invoked by a scheduled job (cron). Admin only.
app.post('/api/admin/analytics/retention', requireAuth, requireAdmin, (req, res) => {
  const cutoff = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const result = db.prepare('DELETE FROM analytics_events WHERE created_at < ?').run(cutoff);
    res.json({ data: { deleted: result.changes, cutoff } });
  } catch {
    res.status(500).json({ error: 'Retention cleanup failed' });
  }
});

app.listen(PORT, () => {
  console.log(`AntiJournals API running on http://localhost:${PORT}`);
});
