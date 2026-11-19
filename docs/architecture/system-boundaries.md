# System Boundaries — Anti Journal

## Internal Components (Anti Journal Project)

### Frontend (React + Vite + Firebase Hosting)

**In scope:**
- All reader-facing pages: Homepage, Archive, ArticlePage, About, Login, Register, Membership, Newsletter, Account
- Authentication UI (login/register forms using Supabase Auth)
- Content consumption UI (reading mode, font size, TOC, share)
- Payment initiation UI (membership page, individual purchase buttons)
- Bookmarks, newsletter subscription, profile management
- SEO meta tags, structured data, sitemap integration

**Out of scope:**
- Administrative dashboard, admin navigation, admin pages
- Content creation/editing UI (belongs to Anti Control Room)
- User management UI beyond own profile (belongs to Anti Control Room)

### Backend (Supabase)

**In scope:**
- PostgreSQL database with full schema
- Supabase Auth (user authentication)
- Edge Functions: payment initialization, webhook handling, payment verification, access grant/revoke (admin)
- Supabase Storage (cover images, assets)
- Row Level Security policies
- Database migrations

**Out of scope:**
- Express server (replaced by Supabase)
- Firebase Auth (replaced by Supabase Auth)
- Firebase Admin SDK (replaced by Supabase service role)

## External Dependencies

| Service | Purpose | Boundary |
|---------|---------|----------|
| Firebase Hosting | Frontend static hosting | Domain: `theantijournals.web.app` or custom domain |
| Supabase | Database, auth, edge functions, storage | Project URL and keys configured via env vars |
| Paystack | Payment processing | API keys, webhook URLs, sandbox/live mode |
| GitHub | Source control | Repository hosting, CI/CD |

## Cross-Application Boundaries

### Anti Journal ↔ Anti Control Room

Both applications share the same Supabase backend. They do **not** communicate with each other directly.

| Communication Path | Direction | Mechanism |
|-------------------|-----------|-----------|
| Anti Journal → Supabase | Reader reads/writes own data | Anon key + RLS |
| Anti Journal → Supabase Edge Functions | Payment init, webhook, verify | Anon key or service role (webhook) |
| Anti Control Room → Supabase | Admin manages content/users/payments | Service role key or anon key + admin RLS |
| Anti Control Room → Paystack | Admin views/refunds payments | Service role key (backend only) |
| Anti Journal ↔ Anti Control Room | None direct | Shared database only |

### Anti Journal ↔ Paystack

| Communication Path | Direction | Mechanism |
|-------------------|-----------|-----------|
| Anti Journal Edge Function → Paystack API | Initialize transactions, verify | Server-side secret key |
| Paystack → Anti Journal Edge Function | Webhook events | Webhook URL + signature verification |
| Anti Journal Frontend → Paystack Checkout | Redirect user to payment page | Authorization URL from Edge Function |

## Network Boundaries

- **Frontend → Supabase**: Direct HTTPS from browser using `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- **Frontend → Edge Functions**: HTTPS via Supabase project URL
- **Edge Functions → Paystack**: Server-side HTTPS from Supabase edge network
- **Paystack → Edge Functions**: Inbound HTTPS webhook (must be publicly accessible)
- **Anti Control Room → Supabase**: Direct HTTPS (same as frontend but with service role for admin ops)

## Security Boundaries

### Secrets Never Exposed to Frontend

- Paystack secret key (`sk_...` or `rk_...`)
- Paystack webhook secret (`whsec_...`)
- Supabase service role key
- Any backend database credentials

### Secrets Safe in Frontend (Client-Side Only)

- Supabase anon key (public by design, RLS enforces security)
- Firebase hosting config (public)
- Paystack public key (`pk_...`) — only needed if frontend directly initializes (not the case here; backend initializes)

### Authentication Boundaries

| Actor | Auth Mechanism | Trust Level |
|-------|---------------|-------------|
| Anonymous reader | None (anon key) | Public data only |
| Authenticated reader | Supabase Auth JWT | Own data + entitled content |
| Admin (Control Room) | Supabase Auth JWT + role check | Admin operations via service role |
| Paystack webhook | HMAC-SHA512 signature | Trusted only after signature verification |

## Deployment Boundaries

| Component | Deployment Target | Persistence |
|-----------|------------------|-------------|
| Frontend build | Firebase Hosting (`dist/`) | Immutable, CDN-cached |
| Database | Supabase PostgreSQL | Persistent, managed |
| Auth | Supabase Auth | Persistent, managed |
| Edge Functions | Supabase Edge network | Stateless, per-invocation |
| Storage | Supabase Storage | Persistent, managed |
| Paystack | External SaaS | External |

## Data Boundaries

### Data Owned by Anti Journal

- Publications, collections, categories, tags
- Products, subscription plans
- Payments, subscriptions, entitlements
- Reader profiles, bookmarks
- Analytics events

### Data Shared with Anti Control Room

- All of the above (shared database)
- Control Room adds: audit log, admin profiles, admin-specific settings

### Data NOT Shared

- Anti Journal frontend build artifacts
- Anti Control Room frontend build artifacts
- Paystack account credentials (separate per application deployment)

## API Boundaries

### Supabase Client API (Frontend)

- `supabase.from('table').select()` — RLS-enforced reads
- `supabase.from('table').insert()` — RLS-enforced writes
- `supabase.auth.signInWithPassword()` — authentication
- `supabase.auth.getUser()` — session management
- `supabase.functions.invoke()` — Edge Function calls

### Edge Function API (Internal)

HTTP JSON API invoked by frontend:
- `POST /functions/v1/init-payment`
- `POST /functions/v1/paystack-webhook`
- `GET /functions/v1/verify-payment/:reference`
- `POST /functions/v1/grant-access` (admin)
- `POST /functions/v1/revoke-access` (admin)

### Paystack API (Server-Side Only)

- `POST https://api.paystack.co/transaction/initialize`
- `GET https://api.paystack.co/transaction/verify/:reference`
- `POST https://api.paystack.co/plan`
- `GET https://api.paystack.co/plan`

## Environment Boundaries

| Environment | Supabase Project | Paystack Mode | Frontend URL |
|-------------|-----------------|---------------|--------------|
| Development | Supabase project (dev) | Test | `http://localhost:5173` |
| Staging | Supabase project (staging) | Test | Staging domain |
| Production | Supabase project (prod) | Live | Production domain |

Each environment has independent Supabase project, database, and Paystack credentials.

## Limitations of Boundaries

- **No direct backend-to-backend communication** between Anti Journal and Anti Control Room (shared DB only)
- **No webhook from Anti Journal to Anti Control Room** (Control Room polls database or subscribes to Supabase Realtime if needed)
- **Edge Functions are stateless** — cannot maintain long-running connections
- **SQLite file not used** — replaced by managed PostgreSQL
- **Firebase Auth not used** — replaced by Supabase Auth
