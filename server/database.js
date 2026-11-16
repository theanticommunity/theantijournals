const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'antiperson.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('member', 'admin')),
      membership TEXT DEFAULT 'free' CHECK(membership IN ('free', 'premium')),
      subscription_status TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS authors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      bio TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      featured_image TEXT,
      author_id TEXT NOT NULL,
      category_id TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'published', 'archived', 'unpublished')),
      published_at TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reading_time INTEGER NOT NULL DEFAULT 0,
      is_premium INTEGER NOT NULL DEFAULT 0,
      preview_length INTEGER,
      seo_title TEXT,
      seo_description TEXT,
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES authors(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS article_tags (
      article_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (article_id, tag_id),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      verification_token TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      article_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      UNIQUE(user_id, article_id)
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      email TEXT NOT NULL,
      article_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'NGN',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'failed', 'refunded')),
      paystack_reference TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'NGN',
      interval TEXT NOT NULL CHECK(interval IN ('month', 'year')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'canceled', 'past_due', 'trialing')),
      paystack_customer_code TEXT,
      paystack_subscription_code TEXT,
      current_period_end TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      article_id TEXT,
      user_id TEXT,
      session_id TEXT,
      ip TEXT,
      user_agent TEXT,
      referrer TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS articles_search USING fts5(
      title, subtitle, content, excerpt,
      content=articles, content_rowid=rowid
    );
  `);

  // Add role column to existing databases if missing
  try {
    db.prepare('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "member"').run();
  } catch {
    // Column already exists
  }

  // Seed demo data if empty
  const count = db.prepare('SELECT COUNT(*) AS c FROM articles').get().c;
  if (count === 0) {
    const now = new Date().toISOString();
    const id = () => Math.random().toString(36).slice(2);

    const categories = [
      { id: id(), name: 'Essays', slug: 'essays', description: 'Long-form reflections on human experience.' },
      { id: id(), name: 'Observations', slug: 'observations', description: 'Brief notes on the ordinary and overlooked.' },
      { id: id(), name: 'Opinion', slug: 'opinion', description: 'Provocations and positions on contemporary life.' },
      { id: id(), name: 'Reflections', slug: 'reflections', description: 'Personal accounts of interior life.' },
    ];
    const insertCat = db.prepare('INSERT INTO categories (id, name, slug, description) VALUES (@id, @name, @slug, @description)');
    categories.forEach(c => insertCat.run(c));

    const tags = [
      { id: id(), name: 'Intimacy', slug: 'intimacy' },
      { id: id(), name: 'Language', slug: 'language' },
      { id: id(), name: 'Morality', slug: 'morality' },
      { id: id(), name: 'Relationships', slug: 'relationships' },
      { id: id(), name: 'Society', slug: 'society' },
      { id: id(), name: 'Politics', slug: 'politics' },
      { id: id(), name: 'Body', slug: 'body' },
      { id: id(), name: 'Memory', slug: 'memory' },
      { id: id(), name: 'Objects', slug: 'objects' },
      { id: id(), name: 'Meaning', slug: 'meaning' },
      { id: id(), name: 'Work', slug: 'work' },
    ];
    const insertTag = db.prepare('INSERT INTO tags (id, name, slug) VALUES (@id, @name, @slug)');
    tags.forEach(t => insertTag.run(t));

    const authorId = id();
    db.prepare('INSERT INTO authors (id, name, slug) VALUES (@id, @name, @slug)').run({
      id: authorId, name: 'AntiPerson Editors', slug: 'antiperson-editors',
    });

    const articles = [
      {
        id: id(), title: 'On the quiet violence of being understood',
        subtitle: 'A reflection on intimacy, translation, and the spaces between what we say and what is heard.',
        slug: 'quiet-violence-being-understood',
        content: '<p>We assume that being understood is a form of safety. But what if comprehension is its own kind of exposure — a surrender we did not consent to?</p><p>In conversation, we offer pieces of ourselves, hoping they will be received as intended. Yet understanding is not a passive act. It is an act of interpretation, and every interpretation carries the quiet violence of reconstruction.</p>',
        excerpt: 'We assume that being understood is a form of safety. But what if comprehension is its own kind of exposure?',
        author_id: authorId, category_id: categories[0].id,
        status: 'published', published_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        reading_time: 8, is_premium: 0, view_count: 1240,
        seo_title: 'On the quiet violence of being understood — AntiPerson',
        seo_description: 'A reflection on intimacy, translation, and the spaces between what we say and what is heard.',
      },
      {
        id: id(), title: 'The architecture of small betrayals',
        subtitle: 'How minor disappointments shape the contours of long-term relationships.',
        slug: 'architecture-small-betrayals',
        content: '<p>It is rarely the grand rupture that ends things. It is the accumulation of small, unremarkable moments — the ones we forget to mention.</p><p>A glance held too long. A promise deferred. A silence that settles like dust. These are the tectonic shifts of intimacy, invisible until the fault line appears.</p>',
        excerpt: 'It is rarely the grand rupture that ends things.',
        author_id: authorId, category_id: categories[1].id,
        status: 'published', published_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        reading_time: 6, is_premium: 1, preview_length: 200, view_count: 890,
        seo_title: 'The architecture of small betrayals — AntiPerson',
        seo_description: 'How minor disappointments shape the contours of long-term relationships.',
      },
      {
        id: id(), title: 'Notes on silence as a political act',
        subtitle: 'What it means to withhold speech in an age that demands constant commentary.',
        slug: 'notes-silence-political-act',
        content: '<p>We are told to speak up, to post, to declare. But there is dignity in restraint, power in the unuttered, and clarity in the pause.</p><p>Silence is not emptiness. It is a form of presence — one that refuses the demand for perpetual performance.</p>',
        excerpt: 'We are told to speak up, to post, to declare.',
        author_id: authorId, category_id: categories[2].id,
        status: 'published', published_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        reading_time: 5, is_premium: 0, view_count: 650,
        seo_title: 'Notes on silence as a political act — AntiPerson',
        seo_description: 'What it means to withhold speech in an age that demands constant commentary.',
      },
    ];
    const insertArt = db.prepare(`INSERT INTO articles (id, title, subtitle, slug, content, excerpt, author_id, category_id, status, published_at, reading_time, is_premium, preview_length, view_count, seo_title, seo_description)
      VALUES (@id, @title, @subtitle, @slug, @content, @excerpt, @author_id, @category_id, @status, @published_at, @reading_time, @is_premium, @preview_length, @view_count, @seo_title, @seo_description)`);
    const insertArtTag = db.prepare('INSERT INTO article_tags (article_id, tag_id) VALUES (@article_id, @tag_id)');
    articles.forEach((a, i) => {
      insertArt.run({ ...a, preview_length: a.preview_length ?? null });
      insertArtTag.run({ article_id: a.id, tag_id: tags[i % tags.length].id });
    });
  }
}

init();

module.exports = db;
