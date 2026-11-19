# Current Architecture — Anti Journal (Reader-Facing)

## Overview

Anti Journal is a reader-facing digital publication platform. The current implementation consists of a React frontend and a Node.js/Express backend. Administration is handled by a separate project (Anti Control Room) located at `C:\Users\the.nomni\Documents\apsg\`, which is NOT part of this codebase.

---

## Existing Technologies and Dependencies

### Frontend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | React | ^19.2.4 | UI library |
| DOM | React DOM | ^19.2.4 | Rendering |
| Build tool | Vite | ^8.0.4 | Dev server, bundling |
| Plugin | @vitejs/plugin-react | ^6.0.1 | React JSX transform |
| Routing | react-router-dom | ^7.18.5 | Client-side routing |
| Styling | Tailwind CSS | ^4.3.5 | Utility-first CSS |
| SEO | react-helmet-async | ^3.1.0 | Document head management |
| Auth | Firebase SDK (web) | — | Client-side authentication |
| Language | TypeScript | ~6.0.2 | Type safety |
| Linting | ESLint | ^9.39.4 | Code linting |

Frontend dependencies (from `package.json`):
- `react`, `react-dom`, `react-helmet-async`, `react-router-dom`
- Dev: `@eslint/js`, `@tailwindcss/postcss`, `@tailwindcss/typography`, `@types/*`, `@vitejs/plugin-react`, `autoprefixer`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `postcss`, `tailwindcss`, `typescript`, `typescript-eslint`, `vite`

### Backend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Runtime | Node.js | — | Server runtime |
| Framework | Express | ^5.3.0 | HTTP server, routing |
| Database | better-sqlite3 | ^13.2.0 | SQLite synchronous driver |
| Auth | firebase-admin | ^14.5.1 | Firebase ID token verification |
| Password | bcryptjs | ^3.0.3 | Password hashing (installed but unused) |
| Cookies | cookie-parser | ^1.4.7 | Cookie parsing (installed but unused) |
| CORS | cors | ^2.8.6 | Cross-origin requests |
| Env | dotenv | ^18.0.10 | Environment variable loading |
| JWT | jsonwebtoken | ^9.0.3 | JWT (installed but unused) |
| SQLite | sqlite3 | ^6.0.1 | SQLite async driver (installed but unused) |

Backend dependencies (from `server/package.json`):
- `bcryptjs`, `better-sqlite3`, `cookie-parser`, `cors`, `dotenv`, `express`, `firebase-admin`, `jsonwebtoken`, `sqlite3`

### Database

- **Engine**: SQLite (single file: `server/antiperson.db`)
- **Driver**: `better-sqlite3` (synchronous)
- **Mode**: WAL journal mode, foreign keys ON
- **Initialization**: Auto-creates tables and seeds demo data on first startup
- **Full-text search**: FTS5 virtual table (`articles_search`)
- **No migrations**: Schema changes are made inline in `init()` with `ALTER TABLE` fallbacks

### Hosting / Deployment

- **Frontend**: Firebase Hosting (build output: `dist/`, deployed to `https://theantijournals.web.app`)
- **Backend**: Not deployed. Recommended on Render/Northflank/Railway with persistent disk
- **Source control**: GitHub
- **Firebase project**: `theantijournals` (`.firebaserc`)
- **Firebase Hosting config**: `firebase.json` — serves `dist/`, SPA fallback to `/index.html`
- **Firestore rules**: `firestore.rules` — permissive rules expiring 2026-12-16 (Firestore is NOT used by the app)

---

## Routing and Navigation

Defined in `src/App.tsx` using `react-router-dom` `BrowserRouter`:

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/` | `Homepage` | No |
| `/archive` | `Archive` | No |
| `/articles/:slug` | `ArticlePage` | No (premium content gated server-side) |
| `/about` | `AboutPage` | No |
| `/login` | `LoginPage` | No |
| `/register` | `RegisterPage` | No |
| `/membership` | `MembershipPage` | No (redirects to login for paid actions) |
| `/newsletter` | `NewsletterPage` | No |
| `/account` | `AccountPage` | Yes (implicitly — user checks) |

Layout wrapper (`Layout`) provides Header, Footer, SEO, and page-view analytics tracking on route changes.

---

## Existing Pages, Components and Layouts

### Components (`src/components/`)

| File | Purpose |
|------|---------|
| `Layout.tsx` | Root layout: SEO, Header, main outlet, Footer, page-view tracking |
| `Header.tsx` | Site masthead, navigation links, auth-aware login/register/account/logout, mobile menu |
| `Footer.tsx` | Site footer with publication/account/connect links |
| `SEO.tsx` | Meta tags, Open Graph, Twitter cards, JSON-LD Article + Breadcrumb structured data |

### Pages (`src/pages/`)

| File | Purpose |
|------|---------|
| `Homepage.tsx` | Featured article, recent, popular, categories, newsletter signup |
| `Archive.tsx` | Article listing with search, category filter, tag filter, sort, pagination |
| `ArticlePage.tsx` | Single article view, reading mode, font size, TOC, bookmarks, share, premium preview lock |
| `AboutPage.tsx` | Publication mission, editorial direction, membership tiers |
| `LoginPage.tsx` | Firebase email/password login |
| `RegisterPage.tsx` | Firebase email/password registration |
| `MembershipPage.tsx` | Free vs Premium tier display, Paystack subscription initiation |
| `NewsletterPage.tsx` | Newsletter subscription form |
| `AccountPage.tsx` | Profile, bookmarks, membership management, sign out |

### Contexts (`src/context/`)

| File | Purpose |
|------|---------|
| `AuthContext.tsx` | Firebase Auth provider: user state, login, register, logout, refresh |
| `AuthContext.ts` | TypeScript types for AuthContext |
| `useAuth.ts` | Hook to consume AuthContext |
| `AnalyticsContext.tsx` | Analytics provider: track events, session ID |
| `AnalyticsContext.ts` | TypeScript types for AnalyticsContext |
| `useAnalytics.ts` | Hook to consume AnalyticsContext |

### Firebase (`src/firebase/`)

| File | Purpose |
|------|---------|
| `config.ts` | Firebase app initialization from `VITE_FIREBASE_*` env vars |

### Lib (`src/lib/`)

| File | Purpose |
|------|---------|
| `api.ts` | Fetch-based API client with automatic Firebase ID token attachment |
| `demoData.ts` | Hardcoded demo articles/categories/authors (NOT used by the running app — pages call the API) |

### Types (`src/types/`)

| File | Purpose |
|------|---------|
| `index.ts` | TypeScript types: Article, Tag, Category, Author, User, NewsletterSubscriber, PaginationMeta, ApiResponse, ArticleFilters, Bookmark |

---

## Existing Content Presentation System

Content is fetched from the backend API and rendered client-side:

1. **Article listing** (`/api/articles`): paginated, filterable by category/tag/search, sortable by newest/oldest/popular, filterable by premium flag
2. **Single article** (`/api/articles/:slug`): full content, metadata, tags, author, category
3. **Premium gating**: Frontend checks `article.is_premium` and `membership.membership === 'premium'` to decide whether to show full content or preview
4. **Preview**: Articles with `preview_length` show truncated content (`content.slice(0, preview_length)`)
5. **Search**: FTS5-backed full-text search on title, subtitle, content, excerpt
6. **SEO**: Per-article meta tags, Open Graph, JSON-LD Article and BreadcrumbList structured data

---

## Current Content Structure and Data Models

Database schema (`server/database.js`):

### Tables

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `users` | id (Firebase UID), email, name, role, membership, subscription_status | User accounts |
| `categories` | id, name, slug, description | Article categories |
| `tags` | id, name, slug | Article tags |
| `authors` | id, name, slug, bio | Article authors |
| `articles` | id, title, subtitle, slug, content, excerpt, featured_image, author_id, category_id, status, published_at, updated_at, reading_time, is_premium, preview_length, seo_title, seo_description, view_count | Publications |
| `article_tags` | article_id, tag_id | Many-to-many article-tag |
| `newsletter_subscribers` | id, email, verified, verification_token | Newsletter signups |
| `bookmarks` | id, user_id, article_id | User saved articles |
| `purchases` | id, user_id, email, article_id, amount, currency, status, paystack_reference | Individual article purchases |
| `subscriptions` | id, user_id, plan, amount, currency, interval, status, paystack_customer_code, paystack_subscription_code, current_period_end | User subscriptions |
| `analytics_events` | id, event_type, article_id, user_id, session_id, ip, user_agent, referrer | Analytics events |
| `settings` | key, value | Key-value settings |

### Article Access Model (Current)

- `status`: draft, scheduled, published, archived, unpublished
- `is_premium`: boolean (0/1) — premium flag
- `preview_length`: integer — characters to show for preview
- Access check: `is_premium === 1` AND user membership !== 'premium' → show preview only

### Limitations of Current Content Model

- **Single monetization dimension**: `is_premium` boolean cannot represent free / paid individual / subscriber-exclusive / restricted / draft / scheduled as independent classifications
- **No collections**: No table for groupings of publications
- **No products**: No product entity separating content from purchasable items
- **No subscription plans**: Plans are inline strings ('monthly', 'yearly') with hardcoded amounts in `server/index.js`
- **No entitlement system**: Access is checked via simple `is_premium` + `membership === 'premium'` comparison, not through independent access sources
- **Access classification not changeable without content duplication**: To move an article from subscriber-exclusive to free, you'd change `is_premium` but there's no history or separate access classification field

---

## Existing Authentication Implementation

### Frontend (`src/firebase/config.ts`, `src/context/AuthContext.tsx`)

- Firebase Auth with email/password provider
- `onAuthStateChanged` for session persistence
- `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`, `updateProfile`
- ID tokens retrieved via `user.getIdToken()` for API requests

### Backend (`server/index.js`)

- `firebase-admin` SDK initialized with `FIREBASE_PROJECT_ID`
- `requireAuth` middleware verifies Firebase ID tokens from `Authorization: Bearer <token>` header
- Auto-creates user record in SQLite `users` table on first `/api/auth/me` request
- Routes requiring auth: `/api/auth/me`, `/api/auth/profile`, `/api/bookmarks/*`, `/api/membership`, `/api/payments/subscription`, `/api/payments/verify/:reference`
- Routes NOT requiring auth: `/api/articles`, `/api/articles/:slug`, `/api/categories`, `/api/tags`, `/api/search`, `/api/newsletter/*`, `/api/payments/purchase`, `/api/payments/webhook`, `/api/analytics`, `/api/health`

### Auth Gaps

- No admin role enforcement on backend (role column exists but is never checked)
- No email verification enforcement
- No password reset flows (delegated to Firebase)
- No multi-factor authentication
- No session management beyond Firebase client-side

---

## Current Backend Connections and Integrations

### Firebase Auth

- Frontend: Firebase client SDK handles signup/login/logout
- Backend: Firebase Admin verifies ID tokens on protected routes
- Project ID: `theantijournals` (from `server/.env`)

### Paystack

- Live mode keys: `PAYSTACK_SECRET_KEY` (`rk_live_...`), `PAYSTACK_PUBLIC_KEY` (`pk_live_...`)
- Webhook secret: `PAYSTACK_WEBHOOK_SECRET` (`whsec_...`)
- Endpoints:
  - `POST /api/payments/subscription` — initialize subscription transaction
  - `POST /api/payments/purchase` — initialize individual article purchase
  - `POST /api/payments/webhook` — receive Paystack webhooks (signature verified)
  - `GET /api/payments/verify/:reference` — client-side payment verification
- Webhook events handled: `charge.success`, `subscription.not_renewable`, `subscription.disable`
- Dual signature verification: `Paystack-Signature` (whsec_) + `x-paystack-signature` (sk_ fallback)

### Analytics

- Frontend tracks: `page_view`, `article_view`, `read_complete`
- Backend: `POST /api/analytics` stores events in SQLite

### Sitemap / SEO

- `GET /sitemap.xml` — generates sitemap from published articles
- `GET /robots.txt` — allows all

---

## Existing Payment-Related Functionality

### Subscription Flow

1. User selects plan (monthly/yearly) on `/membership`
2. Frontend calls `POST /api/payments/subscription` with `{ plan, email }`
3. Backend ensures Paystack plan exists (creates if missing), initializes transaction
4. User redirected to Paystack authorization URL
5. Paystack webhook `charge.success` activates subscription, updates `users.membership = 'premium'`
6. Webhook `subscription.not_renewable` / `subscription.disable` sets membership to 'free'

### Individual Purchase Flow

1. User attempts to access premium article
2. Frontend calls `POST /api/payments/purchase` with `{ article_id, email }`
3. Backend initializes Paystack transaction, records pending purchase
4. User redirected to Paystack
5. Webhook `charge.success` marks purchase as 'paid'

### Issues with Current Payment Implementation

- **Hardcoded pricing**: Amounts hardcoded in `server/index.js` (₦2,000/month, ₦20,000/year, ₦1,000/article)
- **No product/catalog abstraction**: Prices not stored in database
- **No idempotency**: Duplicate webhook events could double-process (partial protection via `status !== 'paid'` check)
- **No failed payment handling**: Only `charge.success` handled; `charge.failed` ignored
- **No subscription renewal tracking**: `current_period_end` set but not used for access checks
- **No payment history**: No endpoint to list user's payments
- **Purchase doesn't grant durable access**: `purchases` table records payment but no entitlement table links purchases to article access
- **Frontend trusts redirect**: `window.location.href = authorization_url` — no client-side verification of payment success before granting UI access (rely on webhook backend)

---

## Current Hosting and Deployment Configuration

### Frontend Deployment

- Host: Firebase Hosting
- Build: `npm run build` → `dist/`
- Config: `firebase.json` (public: `dist`, SPA rewrites)
- Project: `theantijournals`
- Domain: `https://theantijournals.web.app`

### Backend Deployment

- **Not deployed**
- Local: `cd server && npm start` (no start script defined; would need `node index.js`)
- Recommended: Render/Northflank/Railway with persistent disk for SQLite file
- No `start` script in `server/package.json` (only `test`)

### Environment Variables

#### Frontend (`.env` — not committed, referenced in DEPLOYMENT.md)

```
VITE_API_BASE=http://localhost:4000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

#### Backend (`server/.env` — exists, contains live Paystack keys)

```
PORT=4000
FRONTEND_URL=https://theantijournals.web.app
BASE_URL=https://theantijournals.web.app
FIREBASE_PROJECT_ID=theantijournals
PAYSTACK_SECRET_KEY=rk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_WEBHOOK_SECRET=whsec_...
```

---

## Environment Variables and Configuration Management

- Frontend: Vite env vars (`VITE_*` prefix), accessed via `import.meta.env`
- Backend: `dotenv` loads `server/.env`, accessed via `process.env`
- No centralized config management
- No environment-specific configs (dev/staging/production)
- `server/.env` contains live production Paystack keys — **should not be committed** (not in `.gitignore` currently)
- `.gitignore` does NOT exclude `.env` files

---

## Existing Security Mechanisms

| Mechanism | Status |
|-----------|--------|
| Firebase ID token verification on protected routes | Implemented |
| CORS restricted to `FRONTEND_URL` | Implemented |
| Paystack webhook signature verification | Implemented (dual header support) |
| Role-based access control | Column exists, never enforced |
| Row-level security | Not applicable (SQLite) |
| API rate limiting | Not implemented |
| Input validation | Minimal |
| SQL injection protection | Parameterized queries via `better-sqlite3` |
| HTTPS enforcement | Not implemented (reliant on hosting provider) |
| Secret management | `.env` files, not in `.gitignore` |

---

## Existing Tests, Build Processes and Development Tooling

### Testing

- **No automated tests exist**
- `server/package.json` has `"test": "echo \"Error: no test specified\" && exit 1"`
- Frontend has no test configuration
- No E2E, integration, or unit tests

### Build Processes

- Frontend: `npm run build` runs `tsc -b && vite build`
- Backend: No build step (plain Node.js)
- TypeScript: `tsc -b` for type checking

### Development Tooling

- Vite dev server on port 5173 with `/api` proxy to `http://localhost:4000`
- ESLint with React hooks and refresh plugins
- TypeScript project references (`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`)

---

## Technical Debt

1. **No database migrations** — schema changes applied inline in `init()` with `ALTER TABLE` fallbacks
2. **Unused dependencies** — `bcryptjs`, `cookie-parser`, `jsonwebtoken`, `sqlite3` installed but unused
3. **Hardcoded business logic** — pricing, plan names, intervals hardcoded in `server/index.js`
4. **No input validation** beyond basic null checks
5. **No error logging infrastructure** beyond `console.error`
6. **No API versioning**
7. **No pagination on some endpoints** (categories, tags)
8. **Demo data seeding mixed with schema init** — `init()` seeds data if empty, no way to re-seed
9. **`.env` not in `.gitignore`** — credentials could be accidentally committed
10. **No start script** in `server/package.json`

---

## Potential Architectural Conflicts (Current vs Intended)

| Area | Current | Intended | Conflict |
|------|---------|----------|----------|
| Database | SQLite (single file) | PostgreSQL (Supabase) | Full migration required |
| Auth | Firebase Auth | Supabase Auth | Provider switch, token verification changes |
| Backend | Express on external host | Supabase Edge Functions | Runtime change, function deployment |
| Content access | `is_premium` boolean | Multi-tier access classification | Schema expansion needed |
| Collections | None | Required | New tables needed |
| Products | None | Required | New tables needed |
| Entitlements | Simple boolean check | Unified multi-source system | New tables and logic needed |
| Hosting | Firebase Hosting + external backend | Firebase Hosting + Supabase | Backend hosting changes |
| Payments | Express routes | Edge Functions or external backend | Integration pattern change |

---

## Deployment Blockers

1. **Backend not deployed** — no production backend URL configured
2. **SQLite file-based database** — not suitable for serverless/Edge Function deployment; requires persistent disk
3. **No `start` script** in `server/package.json` — cannot deploy via standard process managers
4. **`.env` contains live Paystack keys** — not excluded from git, security risk
5. **No migration system** — schema changes are destructive/undocumented
6. **No automated tests** — cannot verify changes before deployment
7. **Firestore configured but unused** — `firestore.rules` and `firestore.indexes.json` exist but Firestore is not part of the stack
8. **No CORS preflight handling for production domain** beyond `FRONTEND_URL` env var
9. **No health check endpoint with database connectivity verification** — `/api/health` returns static OK

---

## What Already Works

- Firebase Auth login/register/logout
- Article listing with pagination, filtering, search
- Single article display with SEO metadata
- Premium content preview gating (frontend + backend)
- Bookmarks (add/remove/check)
- Newsletter subscription
- Profile update
- Membership status check
- Paystack subscription initialization
- Paystack individual article purchase initialization
- Paystack webhook processing (charge.success, subscription.disable/not_renewable)
- Payment verification endpoint
- Analytics event tracking
- Sitemap and robots.txt
- Category and tag listing

---

## What Is Partially Implemented

- **Subscription lifecycle**: Activation works, but renewal, cancellation, expiration, and failed payment handling are incomplete
- **Access control**: Simple `is_premium` boolean works for basic gating, but no multi-source entitlement system
- **Payment processing**: Initialization and webhook recording work, but no idempotency guarantees, no failed payment handling, no payment history listing

---

## What Is Missing

- Collections (create, edit, publish, add/remove publications, reorder, pricing)
- Products (associate with publications, collections, subscription plans)
- Subscription plans (configurable pricing, multiple plans)
- Entitlement system (independent access sources)
- Administrator-assigned access
- Complimentary/promotional access
- Access classification beyond free/premium (paid individual, subscriber-exclusive, restricted, draft, scheduled)
- Collection purchase flow
- Admin authorization model for Anti Control Room
- Database migrations
- Automated tests
- Deployment pipeline