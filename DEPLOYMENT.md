# AntiPerson — Deployment Guide

## Overview

AntiPerson is an independent digital publication with a React frontend (Vite) and a Node.js/Express backend (SQLite). Authentication is handled by Firebase Auth. Payments are processed by Paystack.

---

## 1. Prerequisites

- Node.js 18+
- Firebase project (Auth enabled)
- Paystack account (test or live keys)
- A domain name (for production)

---

## 2. Environment Variables

Create a `.env` file in both the root and `server/` directories.

### Root (frontend) — `.env`

```
VITE_API_BASE=http://localhost:4000/api
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Server — `server/.env`

```
PORT=4000
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:5173
FIREBASE_PROJECT_ID=your-project-id
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
PAYSTACK_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
```

---

## 3. Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** → **Email/Password**
3. Copy your web app config values into the root `.env`
4. In your Firebase project settings, add your production domain to **Authorized domains**

### Firebase Admin (backend)

The backend uses the Firebase Admin SDK to verify ID tokens. Set `FIREBASE_PROJECT_ID` in `server/.env`. The Admin SDK uses Application Default Credentials — on most platforms this works automatically. For local development, you may need to set `GOOGLE_APPLICATION_CREDENTIALS` to a service account key file.

---

## 4. Paystack Setup

1. Create a Paystack account at [Paystack Dashboard](https://dashboard.paystack.com/)
2. Get your **Secret Key** and **Public Key** from Settings → API Keys
3. Get your **Secret Key** (`sk_...`), **Public Key** (`pk_...`), and generate a **Webhook Signing Secret** (`whsec_...`) from Developers → API configuration
4. Add all three to `server/.env`
4. Configure your webhook URL:
   ```
   POST https://your-domain.com/api/payments/webhook
   ```
5. In the Paystack dashboard, subscribe to these webhook events:
   - `charge.success`
   - `subscription.not_renewable`
   - `subscription.disable`

**Webhook signature headers:** Paystack sends two possible signature headers. Your server verifies whichever is present:
- `Paystack-Signature: t=...,v1=...` — uses the `whsec_` webhook signing secret (new)
- `x-paystack-signature` — uses the `sk_` secret key (deprecated, fallback)

### Pricing (configurable in `server/index.js`)

- Monthly: ₦2,000 (200000 kobo)
- Yearly: ₦20,000 (2000000 kobo)
- Individual article purchase: ₦1,000 (100000 kobo)

Edit `server/index.js` to adjust amounts or currency.

---

## 5. Database

The backend uses **SQLite** (`server/antiperson.db`). No separate database server is required.

### Schema

The database is auto-initialized on first startup with tables for:
- `users` — Firebase UID, email, name, membership tier, subscription status
- `articles` — publications with draft/scheduled/published/archived/unpublished states
- `categories` — article categories
- `tags` — article tags
- `article_tags` — article-tag many-to-many
- `newsletter_subscribers` — email newsletter signups
- `bookmarks` — user saved articles
- `purchases` — individual article purchases
- `subscriptions` — user subscriptions
- `analytics_events` — page views, reads, conversions

### Migration from JWT auth

If you previously used JWT-based auth, the `users` table already exists. Firebase Auth replaces JWT login/register. User records are auto-created on first authenticated request to `/api/auth/me`.

---

## 6. Local Development

```bash
# Root directory
npm install

# Server directory
cd server
npm install

# Start backend (terminal 1)
cd server
npm start        # http://localhost:4000

# Start frontend (terminal 2)
npm run dev      # http://localhost:5173
```

The frontend proxies `/api` to `http://localhost:4000` via Vite config.

---

## 7. Production Build

```bash
# Frontend
npm run build    # outputs to dist/

# Server
cd server
npm start        # serves API on PORT (default 4000)
```

### Serving the frontend

The `dist/` folder contains static files. Serve them with any static host (Nginx, Apache, Vercel, Netlify, S3+CloudFront, etc.).

### Serving the backend

The backend is a standard Node.js process. Run it with a process manager (PM2, systemd, Docker, etc.):

```bash
# With PM2
cd server
npm install -g pm2
pm2 start index.js --name antiperson-api
```

---

## 8. API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List published articles (query: category, tag, search, sort, page, per_page) |
| GET | `/api/articles/:slug` | Get a single article |
| GET | `/api/categories` | List categories |
| GET | `/api/tags` | List tags |
| GET | `/api/search?q=...` | Full-text search |
| GET | `/api/health` | Health check |

### Auth (Firebase client-side)
- **Login**: `signInWithEmailAndPassword` via Firebase SDK
- **Register**: `createUserWithEmailAndPassword` via Firebase SDK
- **Logout**: `signOut` via Firebase SDK
- **GET** `/api/auth/me` — Get user profile (requires Firebase ID token)
- **PUT** `/api/auth/profile` — Update display name (requires Firebase ID token)

### Bookmarks (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookmarks` | List user's bookmarks |
| POST | `/api/bookmarks` | Bookmark an article (`{ article_id }`) |
| DELETE | `/api/bookmarks/:article_id` | Remove bookmark |
| GET | `/api/bookmarks/check/:article_id` | Check bookmark status |

### Membership (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/membership` | Get user's membership status |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/subscription` | Initialize subscription payment (requires auth) |
| POST | `/api/payments/purchase` | Initialize individual article purchase |
| POST | `/api/payments/webhook` | Paystack webhook (verify signature) |
| GET | `/api/payments/verify/:reference` | Verify a payment (requires auth) |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analytics` | Track an event |

### SEO
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/robots.txt` | Robots exclusion protocol |
| GET | `/sitemap.xml` | XML sitemap |

---

## 9. Analytics

Frontend tracks:
- `page_view` — on every route change
- `article_view` — when an article loads
- `read_complete` — when a reader scrolls to 100% of an article

Events are posted to `/api/analytics` and stored in SQLite.

---

## 10. Admin (separate project)

The administration dashboard (CMS) has been moved to a separate project at:

```
C:\Users\the.nomni\Documents\apsg\
```

The admin project manages articles, categories, tags, and users. It connects to the same backend API.

---

## 11. Security

- All API routes that modify data require a valid Firebase ID token in the `Authorization: Bearer <token>` header
- Paystack webhooks are verified using HMAC-SHA512 with `PAYSTACK_SECRET_KEY`
- SQLite file should not be publicly accessible
- Use HTTPS in production
- Set `NODE_ENV=production` for production builds

---

## 12. Troubleshooting

| Issue | Solution |
|-------|----------|
| Firebase auth not working | Check `VITE_FIREBASE_*` env vars and authorized domains |
| Paystack returns 401 | Verify `PAYSTACK_SECRET_KEY` is correct |
| Webhook not firing | Check webhook URL is publicly accessible and returns 200 |
| SQLite locked | Ensure only one backend process is running |
| CORS errors | Set `FRONTEND_URL` to your production domain |

---

## 13. File Structure

```
antiperson/
├── dist/                    # Built frontend
├── public/                  # Static assets (robots.txt, sitemap.xml)
├── src/
│   ├── components/          # Layout, Header, Footer, SEO
│   ├── context/             # AuthContext, AnalyticsContext
│   ├── firebase/            # Firebase config
│   ├── lib/                 # API client
│   ├── pages/               # Homepage, Archive, ArticlePage, About, Login, Register, Membership, Newsletter, Account
│   ├── types/               # TypeScript types
│   ├── App.tsx
│   └── index.css
├── server/
│   ├── index.js             # Express backend
│   ├── database.js          # SQLite schema & seed
│   ├── antiperson.db        # SQLite database
│   └── .env
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── tsconfig*.json
```
