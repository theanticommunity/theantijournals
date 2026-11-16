require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY = '7d';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

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

// Auth middleware
function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
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

app.get('/api/articles/:slug', (req, res) => {
  const row = db.prepare(`SELECT a.*, c.name AS category_name, au.name AS author_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN authors au ON a.author_id = au.id
    WHERE a.slug = ? AND a.status = 'published'`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Article not found' });

  // Increment view count
  db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').run(row.id);

  const tags = db.prepare('SELECT t.id, t.name, t.slug FROM tags t JOIN article_tags at ON at.tag_id = t.id WHERE at.article_id = ?').all(row.id);

  const article = {
    id: row.id, title: row.title, subtitle: row.subtitle, slug: row.slug,
    content: row.content, excerpt: row.excerpt, featured_image: row.featured_image,
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

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const id = Math.random().toString(36).slice(2);
    db.prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)').run(id, email, name, hash);
    const token = jwt.sign({ id, email, role: 'member' }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ data: { id, email, name, membership: 'free' } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ data: { id: user.id, email: user.email, name: user.name, membership: user.membership, subscription_status: user.subscription_status, role: user.role } });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ data: { ok: true } });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, membership, subscription_status, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ data: user });
});

app.put('/api/auth/profile', requireAuth, async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user.id;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
  if (existing) return res.status(409).json({ error: 'Email already in use' });
  db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, userId);
  const user = db.prepare('SELECT id, email, name, membership, subscription_status, role FROM users WHERE id = ?').get(userId);
  res.json({ data: user });
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
  const hash = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ data: { ok: true } });
});

// ============ BOOKMARKS ============

app.get('/api/bookmarks', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT b.id, b.created_at, a.id AS article_id, a.title, a.slug, a.excerpt, a.reading_time, a.is_premium
    FROM bookmarks b
    JOIN articles a ON b.article_id = a.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC`).all(req.user.id);
  res.json({ data: rows });
});

app.post('/api/bookmarks', requireAuth, (req, res) => {
  const { article_id } = req.body;
  if (!article_id) return res.status(400).json({ error: 'article_id required' });
  const id = Math.random().toString(36).slice(2);
  try {
    db.prepare('INSERT OR IGNORE INTO bookmarks (id, user_id, article_id) VALUES (?, ?, ?)').run(id, req.user.id, article_id);
    res.status(201).json({ data: { id } });
  } catch {
    res.status(409).json({ error: 'Already bookmarked' });
  }
});

app.delete('/api/bookmarks/:article_id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND article_id = ?').run(req.user.id, req.params.article_id);
  res.json({ data: { ok: true } });
});

app.get('/api/bookmarks/check/:article_id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND article_id = ?').get(req.user.id, req.params.article_id);
  res.json({ data: { bookmarked: !!row } });
});

// ============ MEMBERSHIP ============

app.get('/api/membership', requireAuth, (req, res) => {
  const user = db.prepare('SELECT membership, subscription_status FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ data: { membership: user.membership, subscription_status: user.subscription_status } });
});

// ============ NEWSLETTER ============

app.post('/api/newsletter/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const id = Math.random().toString(36).slice(2);
  try {
    db.prepare('INSERT INTO newsletter_subscribers (id, email) VALUES (?, ?)').run(id, email);
    res.json({ data: { id, email, verified: false } });
  } catch {
    res.status(409).json({ error: 'Already subscribed' });
  }
});

app.post('/api/newsletter/verify', (req, res) => {
  res.json({ data: { verified: true } });
});

app.post('/api/newsletter/unsubscribe', (req, res) => {
  res.json({ data: { unsubscribed: true } });
});

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';

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

// ============ PAYMENTS (Paystack) ============

app.post('/api/payments/subscription', requireAuth, async (req, res) => {
  const { plan, email } = req.body;
  if (!plan) return res.status(400).json({ error: 'Plan required' });
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(500).json({ error: 'Paystack not configured. Set PAYSTACK_SECRET_KEY.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    // Ensure a plan exists for this tier (create if needed)
    const planName = `AntiPerson ${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
    let planResp = await paystackRequest('GET', `/plan?name=${encodeURIComponent(planName)}`);
    let planCode;
    if (planResp.data && planResp.data.length > 0) {
      planCode = planResp.data[0].plan_code;
    } else {
      const amountMap = { monthly: 200000, yearly: 2000000 }; // NGN in kobo (₦2,000 / ₦20,000)
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

app.post('/api/payments/purchase', async (req, res) => {
  const { article_id, email } = req.body;
  if (!article_id || !email) return res.status(400).json({ error: 'Missing fields' });
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(500).json({ error: 'Paystack not configured. Set PAYSTACK_SECRET_KEY.' });
  }

  const article = db.prepare('SELECT * FROM articles WHERE id = ? AND is_premium = 1').get(article_id);
  if (!article) return res.status(404).json({ error: 'Premium article not found' });

  // Price per article: ₦1,000 in kobo (configurable could be added to settings later)
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
  const secret = PAYSTACK_SECRET_KEY;
  const hash = require('crypto').createHmac('sha512', secret).update(req.body.toString()).digest('hex');
  const signature = req.headers['x-paystack-signature'];

  if (hash !== signature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
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
        } {
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

    if (eventType === 'subscription.not_renewable' || eventType === 'subscription.disable') {
      const customerEmail = data.customer?.email;
      if (customerEmail) {
        db.prepare(`UPDATE users SET membership = 'free', subscription_status = 'canceled' WHERE email = ?`).run(customerEmail);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.get('/api/payments/verify/:reference', requireAuth, async (req, res) => {
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

// ============ ADMIN CMS ============

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function computeReadingTime(content) {
  const text = content.replace(/<[^>]*>/g, '');
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return Math.max(1, Math.ceil(words.length / wordsPerMinute));
}

// List all articles (admin - includes all statuses)
app.get('/api/admin/articles', requireAuth, requireAdmin, (req, res) => {
  const { status, search, page = 1, per_page = 20 } = req.query;
  const pageNum = parseInt(page);
  const perPage = parseInt(per_page);
  const offset = (pageNum - 1) * perPage;

  let sql = `SELECT a.*, c.name AS category_name, au.name AS author_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN authors au ON a.author_id = au.id`;
  const params = [];
  const conditions = [];

  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push(`a.id IN (SELECT rowid FROM articles_search WHERE articles_search MATCH ?)`);
    params.push(search);
  }

  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ` ORDER BY a.updated_at DESC LIMIT ? OFFSET ?`;
  params.push(perPage, offset);

  const countSql = `SELECT COUNT(*) AS cnt FROM articles a${conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''}`;
  const totalRow = db.prepare(countSql).get(params.slice(0, -2));
  const total = totalRow.cnt;

  const rows = db.prepare(sql).all(params);
  const articles = rows.map(r => ({
    id: r.id, title: r.title, subtitle: r.subtitle, slug: r.slug,
    excerpt: r.excerpt, featured_image: r.featured_image,
    author_name: r.author_name, category_name: r.category_name,
    tags: db.prepare('SELECT t.id, t.name, t.slug FROM tags t JOIN article_tags at ON at.tag_id = t.id WHERE at.article_id = ?').all(r.id),
    status: r.status, published_at: r.published_at, updated_at: r.updated_at,
    reading_time: r.reading_time, is_premium: !!r.is_premium,
    preview_length: r.preview_length, view_count: r.view_count,
  }));

  res.json({ data: articles, meta: { page: pageNum, per_page: perPage, total, total_pages: Math.ceil(total / perPage) } });
});

// Get single article (admin)
app.get('/api/admin/articles/:id', requireAuth, requireAdmin, (req, res) => {
  const row = db.prepare(`SELECT a.*, c.name AS category_name, au.name AS author_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN authors au ON a.author_id = au.id
    WHERE a.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Article not found' });

  const tags = db.prepare('SELECT t.id, t.name, t.slug FROM tags t JOIN article_tags at ON at.tag_id = t.id WHERE at.article_id = ?').all(row.id);

  res.json({ data: {
    id: row.id, title: row.title, subtitle: row.subtitle, slug: row.slug,
    content: row.content, excerpt: row.excerpt, featured_image: row.featured_image,
    author_id: row.author_id, author_name: row.author_name, category_id: row.category_id, category_name: row.category_name,
    tags, status: row.status, published_at: row.published_at, updated_at: row.updated_at,
    reading_time: row.reading_time, is_premium: !!row.is_premium,
    preview_length: row.preview_length, seo_title: row.seo_title, seo_description: row.seo_description,
    view_count: row.view_count,
  } });
});

// Create article
app.post('/api/admin/articles', requireAuth, requireAdmin, (req, res) => {
  const { title, subtitle, slug, content, excerpt, featured_image, author_id, category_id,
    status, published_at, reading_time, is_premium, preview_length, seo_title, seo_description, tags } = req.body;

  if (!title || !slug || !content) return res.status(400).json({ error: 'Missing required fields' });

  const id = Math.random().toString(36).slice(2);
  const now = new Date().toISOString();
  const rt = reading_time || computeReadingTime(content);
  const pubAt = status === 'published' ? (published_at || now) : null;

  try {
    db.prepare(`INSERT INTO articles (id, title, subtitle, slug, content, excerpt, featured_image, author_id, category_id,
      status, published_at, updated_at, reading_time, is_premium, preview_length, seo_title, seo_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, title, subtitle || null, slug, content, excerpt || null, featured_image || null,
        author_id || null, category_id || null, status || 'draft', pubAt, now, rt, is_premium ? 1 : 0,
        preview_length || null, seo_title || null, seo_description || null);

    if (tags && tags.length) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)');
      tags.forEach(tid => insertTag.run(id, tid));
    }

    // Update FTS
    db.prepare(`INSERT OR REPLACE INTO articles_search(rowid, title, subtitle, content, excerpt)
      VALUES ((SELECT rowid FROM articles WHERE id = ?), ?, ?, ?, ?)`).run(id, title, subtitle || '', content, excerpt || '');

    res.status(201).json({ data: { id } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// Update article
app.put('/api/admin/articles/:id', requireAuth, requireAdmin, (req, res) => {
  const { title, subtitle, slug, content, excerpt, featured_image, author_id, category_id,
    status, published_at, reading_time, is_premium, preview_length, seo_title, seo_description, tags } = req.body;

  const row = db.prepare('SELECT id FROM articles WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Article not found' });

  const now = new Date().toISOString();
  const rt = reading_time || computeReadingTime(content);
  let pubAt = null;
  const existing = db.prepare('SELECT published_at, status FROM articles WHERE id = ?').get(req.params.id);
  if (status === 'published') {
    pubAt = published_at || existing.published_at || now;
  }

  try {
    db.prepare(`UPDATE articles SET title = ?, subtitle = ?, slug = ?, content = ?, excerpt = ?,
      featured_image = ?, author_id = ?, category_id = ?, status = ?,
      published_at = ?, updated_at = ?, reading_time = ?, is_premium = ?,
      preview_length = ?, seo_title = ?, seo_description = ?
      WHERE id = ?`)
      .run(title, subtitle || null, slug, content, excerpt || null, featured_image || null,
        author_id || null, category_id || null, status || 'draft', pubAt, now, rt, is_premium ? 1 : 0,
        preview_length || null, seo_title || null, seo_description || null, req.params.id);

    db.prepare('DELETE FROM article_tags WHERE article_id = ?').run(req.params.id);
    if (tags && tags.length) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)');
      tags.forEach(tid => insertTag.run(req.params.id, tid));
    }

    db.prepare(`INSERT OR REPLACE INTO articles_search(rowid, title, subtitle, content, excerpt)
      VALUES ((SELECT rowid FROM articles WHERE id = ?), ?, ?, ?, ?)`)
      .run(req.params.id, title, subtitle || '', content, excerpt || '');

    res.json({ data: { ok: true } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// Delete article
app.delete('/api/admin/articles/:id', requireAuth, requireAdmin, (req, res) => {
  const row = db.prepare('SELECT id FROM articles WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Article not found' });

  db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  res.json({ data: { ok: true } });
});

// Categories CRUD
app.get('/api/admin/categories', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json({ data: rows });
});

app.post('/api/admin/categories', requireAuth, requireAdmin, (req, res) => {
  const { name, slug, description } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });
  const id = Math.random().toString(36).slice(2);
  try {
    db.prepare('INSERT INTO categories (id, name, slug, description) VALUES (?, ?, ?, ?)').run(id, name, slug, description || null);
    res.status(201).json({ data: { id } });
  } catch {
    res.status(409).json({ error: 'Category already exists' });
  }
});

app.put('/api/admin/categories/:id', requireAuth, requireAdmin, (req, res) => {
  const { name, slug, description } = req.body;
  const row = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Category not found' });
  try {
    db.prepare('UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?').run(name, slug, description || null, req.params.id);
    res.json({ data: { ok: true } });
  } catch {
    res.status(409).json({ error: 'Slug already exists' });
  }
});

app.delete('/api/admin/categories/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ data: { ok: true } });
});

// Tags CRUD
app.get('/api/admin/tags', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM tags ORDER BY name').all();
  res.json({ data: rows });
});

app.post('/api/admin/tags', requireAuth, requireAdmin, (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });
  const id = Math.random().toString(36).slice(2);
  try {
    db.prepare('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)').run(id, name, slug);
    res.status(201).json({ data: { id } });
  } catch {
    res.status(409).json({ error: 'Tag already exists' });
  }
});

app.put('/api/admin/tags/:id', requireAuth, requireAdmin, (req, res) => {
  const { name, slug } = req.body;
  const row = db.prepare('SELECT id FROM tags WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Tag not found' });
  try {
    db.prepare('UPDATE tags SET name = ?, slug = ? WHERE id = ?').run(name, slug, req.params.id);
    res.json({ data: { ok: true } });
  } catch {
    res.status(409).json({ error: 'Slug already exists' });
  }
});

app.delete('/api/admin/tags/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  res.json({ data: { ok: true } });
});

// ============ ANALYTICS ============

app.post('/api/analytics', (req, res) => {
  const { event_type, article_id, user_id, session_id, ip, user_agent, referrer } = req.body;
  if (!event_type) return res.status(400).json({ error: 'event_type required' });
  const id = Math.random().toString(36).slice(2);
  try {
    db.prepare(`INSERT INTO analytics_events (id, event_type, article_id, user_id, session_id, ip, user_agent, referrer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, event_type, article_id || null, user_id || null, session_id || null, ip || null, user_agent || null, referrer || null);
    res.json({ data: { ok: true } });
  } catch {
    res.status(500).json({ error: 'Failed to record event' });
  }
});

// Health
app.get('/api/health', (req, res) => res.json({ data: { status: 'ok' } }));

app.listen(PORT, () => {
  console.log(`AntiPerson API running on http://localhost:${PORT}`);
});
