# Target Architecture — Anti Journal

## Overview

Anti Journal is a reader-facing digital publication platform. The target architecture migrates from Firebase Auth + Express + SQLite to Supabase (PostgreSQL + Auth + Edge Functions + Storage), keeping Firebase Hosting for the frontend and Paystack for payments.

Anti Control Room is a separate application that will share the same Supabase backend. No administrative UI is built into Anti Journal.

---

## Target Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 | Reader-facing UI |
| Frontend hosting | Firebase Hosting | Static site hosting (`dist/`) |
| Backend / BaaS | Supabase | PostgreSQL, Auth, Edge Functions, Storage |
| Database | Supabase PostgreSQL | Relational data, RLS, migrations |
| Authentication | Supabase Auth | User signup/login/session management |
| Backend logic | Supabase Edge Functions | Deno-based serverless functions |
| File storage | Supabase Storage | Cover images, assets |
| Payments | Paystack | Payment processing (server-side) |
| Source control | GitHub | Version control, CI |

---

## Content Management

### Access Classifications

Each publication has an `access_classification` field (not coupled to a single monetization model):

| Classification | Access Rule |
|---------------|-------------|
| `free` | Public, no authentication required |
| `paid_individual` | Purchased individually OR active subscription OR admin-assigned |
| `subscriber_exclusive` | Active subscription OR admin-assigned (not purchasable individually) |
| `restricted` | Admin-assigned only (not purchasable, not subscription-accessible) |
| `draft` | Not visible to public; admin only |
| `scheduled` | Not visible until `published_at`; then behaves per its access classification |

### Publication Fields

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| title | text | Publication title |
| slug | text | Unique URL slug |
| author_id | UUID | References profiles |
| description | text | Excerpt/blurb |
| cover_image | text | Storage path or URL |
| content | text | Main body (HTML) |
| published_at | timestamptz | Publication date |
| last_modified_at | timestamptz | Auto-updated |
| categories | UUID[] | References categories |
| tags | UUID[] | References tags |
| status | text | draft, scheduled, published, archived, unpublished |
| access_classification | text | free, paid_individual, subscriber_exclusive, restricted |
| seo_title | text | SEO override |
| seo_description | text | SEO override |
| reading_time | integer | Minutes |
| view_count | integer | View counter |

Access classification can be changed without duplicating content.

---

## Collections

### Model

Collections group publications into purchasable/discoverable packages.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| title | text | Collection title |
| slug | text | Unique URL slug |
| description | text | Collection description |
| cover_image | text | Storage path or URL |
| status | text | draft, published, unpublished |
| price | integer | Price in kobo (0 = free) |
| currency | text | Default 'NGN' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Collection-Publication Relationship

Join table `collection_items`:

| Field | Type | Description |
|-------|------|-------------|
| collection_id | UUID | References collections |
| publication_id | UUID | References publications |
| position | integer | Display order |
| added_at | timestamptz | |

- A publication can belong to multiple collections (no duplication of publication records)
- Position enables reordering
- Composite primary key (collection_id, publication_id)

---

## Commerce and Products

### Separation of Concerns

- **Publication**: Content
- **Collection**: Group of publications
- **Product**: Purchasable item (links to publication or collection)

### Products Table

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| type | text | 'publication', 'collection', 'subscription' |
| reference_id | UUID | References publication or collection |
| name | text | Display name |
| description | text | Product description |
| price | integer | Price in kobo (0 = free) |
| currency | text | Default 'NGN' |
| is_active | boolean | Whether purchasable |
| created_at | timestamptz | |

For subscription plans, `type = 'subscription'` and `reference_id` references `subscription_plans`.

---

## Subscription Management

### Subscription Plans

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | text | Plan name (e.g. 'Monthly', 'Yearly') |
| slug | text | Unique slug |
| amount | integer | Price in kobo |
| currency | text | Default 'NGN' |
| interval | text | 'month' or 'year' |
| interval_count | integer | Billing interval multiplier |
| paystack_plan_code | text | Paystack plan code |
| is_active | boolean | Whether available for purchase |
| created_at | timestamptz | |

### Subscriptions

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| plan_id | UUID | References subscription_plans |
| status | text | active, canceled, past_due, trialing, price_change_canceled |
| current_period_start | timestamptz | |
| current_period_end | timestamptz | |
| cancel_at_period_end | boolean | |
| canceled_at | timestamptz | |
| paystack_customer_code | text | |
| paystack_subscription_code | text | |
| paystack_invoice_id | text | Latest invoice |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Payment Records

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users (nullable for guest purchases) |
| type | text | 'publication', 'collection', 'subscription' |
| reference_id | UUID | Purchased item |
| paystack_reference | text | Paystack transaction reference |
| amount | integer | Amount in kobo |
| currency | text | |
| status | text | pending, paid, failed, refunded |
| created_at | timestamptz | |

---

## Unified Entitlement System

### Entitlements Table

Each row is an independent access grant. Access sources are additive and independent.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| type | text | 'publication_purchase', 'collection_purchase', 'subscription', 'admin_assigned', 'promotional' |
| target_type | text | 'publication', 'collection', 'plan' |
| target_id | UUID | Referenced entity |
| granted_by | UUID | Admin who granted (for admin_assigned) |
| expires_at | timestamptz | NULL = permanent |
| created_at | timestamptz | |
| revoked_at | timestamptz | NULL = active |
| revoked_by | UUID | |

### Access Resolution

A user can access a publication if ANY of the following is true:

1. Publication `access_classification = 'free'` (public)
2. Active entitlement of type `publication_purchase` targeting this publication, not revoked, not expired
3. Active entitlement of type `collection_purchase` targeting a collection that contains this publication
4. Active subscription entitlement AND publication `access_classification IN ('free', 'paid_individual', 'subscriber_exclusive')`
5. Active entitlement of type `admin_assigned` targeting this publication or a containing collection
6. Active entitlement of type `promotional` targeting this publication or a containing collection

Access checks must be enforced **server-side** (database RLS or Edge Function), not solely frontend visibility.

Subscription-derived access expires when the subscription status changes to non-active.

---

## Supabase Responsibilities

| Responsibility | Implementation |
|---------------|----------------|
| Relational database | PostgreSQL with proper FKs, indexes, constraints |
| Authentication | Supabase Auth (email/password, magic link, OAuth) |
| User profiles | `public.profiles` table linked to `auth.users` |
| Content metadata | `public.publications` table |
| Collections | `public.collections`, `public.collection_items` |
| Products and pricing | `public.products`, `public.subscription_plans` |
| Orders and purchases | `public.payments` table |
| Subscription records | `public.subscriptions` table |
| Entitlements | `public.entitlements` table |
| Backend business logic | Supabase Edge Functions |
| Secure file storage | Supabase Storage (cover images) |
| Row Level Security | RLS policies on all tables |

### RLS Policy Principles

- **Public**: Read access to published/free publications and collections
- **Authenticated**: Read access to entitled content (checked via entitlements table)
- **Write**: Only service role (Edge Functions) or authenticated users for own data (bookmarks, profile)
- **Admin**: Service role key only — never exposed to frontend

---

## Paystack Responsibilities

| Responsibility | Implementation |
|---------------|----------------|
| Payment initialization | Edge Function calls Paystack API with secret key |
| Transaction verification | Edge Function verifies with Paystack API |
| Webhook handling | Edge Function verifies signature, processes events |
| Secret key | Never exposed to frontend; stored in Edge Function env vars |
| Webhook secret | `whsec_` secret for `Paystack-Signature` header verification |

### Payment Flow

1. Reader selects product on frontend
2. Frontend calls Edge Function to initialize payment
3. Edge Function validates product and price from database
4. Edge Function initializes Paystack transaction using server-side secret key
5. Reader completes payment via Paystack checkout
6. Paystack sends webhook to Edge Function
7. Edge Function verifies `Paystack-Signature` header with `whsec_` secret
8. Edge Function verifies transaction with Paystack API
9. Edge Function records payment in `public.payments`
10. Edge Function grants entitlement(s) in `public.entitlements`

### Webhook Security

- HMAC-SHA512 verification of `Paystack-Signature: t=...,v1=...` header
- Timestamp tolerance: 300 seconds
- Idempotent processing: check `paystack_reference` before creating payment
- Duplicate webhook protection: same reference processed once
- Failed payment handling: `charge.failed`, `subscription.not_renewable`, `subscription.disable`

### Supported Payment Types

- Individual publication purchase (one-time)
- Collection purchase (one-time)
- Recurring subscriptions (Paystack subscription plans, where channel supports)

### Sandbox Mode

- `PAYSTACK_ENV=test` uses `sk_test_`/`pk_test_` keys and Paystack mock endpoints
- `PAYSTACK_ENV=live` uses live keys
- Webhook URLs differ for test vs live

---

## Anti Control Room Compatibility

Anti Control Room is a separate project. Anti Journal does NOT contain any admin UI, admin navigation, or admin pages.

### Integration Contract

The Control Room communicates with the shared Supabase backend directly (database) and/or via Edge Functions.

#### Authentication Requirements

- Control Room authenticates via Supabase Auth (separate user accounts from Anti Journal readers, or same auth system with role distinction)
- Admin role stored in `public.profiles.role = 'admin'`

#### Administrative Authorization

- Service role key used by Edge Functions for privileged operations
- Client-side (Control Room frontend) uses `anon` key with RLS
- RLS policies restrict write operations to `role = 'admin'` profiles

#### Required Database Permissions

| Operation | Table | Required Role |
|-----------|-------|---------------|
| Manage publications | publications | admin |
| Manage collections | collections, collection_items | admin |
| Manage categories/tags | categories, tags | admin |
| Manage products/pricing | products, subscription_plans | admin |
| Manage subscriptions | subscriptions | admin |
| Manage payments | payments | admin (read) |
| Manage entitlements | entitlements | admin (grant/revoke) |
| Manage readers | profiles | admin (read) |

#### Available Backend Operations (Edge Functions)

| Function | Method | Purpose | Auth |
|----------|--------|---------|------|
| `init-payment` | POST | Initialize Paystack transaction | Authenticated user |
| `paystack-webhook` | POST | Receive and process Paystack webhooks | Webhook signature |
| `verify-payment` | GET | Verify a payment reference | Authenticated user |
| `grant-access` | POST | Admin: grant entitlement | Service role / admin |
| `revoke-access` | POST | Admin: revoke entitlement | Service role / admin |
| `sync-subscription` | POST | Admin: sync subscription status from Paystack | Service role / admin |

#### Request/Response Structures

Standard JSON: `{ data: {...}, error: null }` or `{ data: null, error: { code, message } }`

#### Error Handling

- HTTP 401: Unauthorized (missing/invalid token)
- HTTP 403: Forbidden (insufficient role)
- HTTP 404: Not found
- HTTP 409: Conflict (duplicate, already paid)
- HTTP 422: Validation error
- HTTP 500: Server error

#### Access Assignment and Revocation

Admin assigns access via `entitlements` table:
- INSERT row with `type = 'admin_assigned'`, `target_type`, `target_id`, `granted_by`, optional `expires_at`
- Revoke: UPDATE `revoked_at = NOW()`, `revoked_by = admin_id`

Access checks query `entitlements` where `revoked_at IS NULL` AND (`expires_at IS NULL` OR `expires_at > NOW()`).

#### Audit Logging

`public.audit_log` table:

| Field | Type |
|-------|------|
| id | UUID |
| actor_id | UUID |
| action | text |
| target_type | text |
| target_id | UUID |
| metadata | jsonb |
| created_at | timestamptz |

Edge Functions write audit entries for all admin operations.

#### Environment Configuration

Control Room needs:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (for frontend)
- `SUPABASE_SERVICE_ROLE_KEY` (for backend/admin operations only)

No shared secret embedded in Control Room frontend.

---

## System Boundaries

```
+---------------------+      HTTPS      +--------------------------+
|  Anti Journal       |<==============>|  Supabase                |
|  (React + Vite)     |                |  (PostgreSQL + Auth      |
|  Firebase Hosting   |                |   Edge Functions +       |
|                     |                |   Storage)               |
+---------------------+                +--------------------------+
        |                                      |
        | HTTPS (Paystack API)                 | HTTPS (webhook)
        v                                      v
+---------------------+      HTTPS      +--------------------------+
|  Paystack           |<==============>|  Edge Function:          |
|  (payments)         |   server-side  |  paystack-webhook        |
+---------------------+                +--------------------------+

Anti Control Room (separate project) connects directly to Supabase database
and/or Edge Functions using service role key. No dependency on Anti Journal frontend.
```

---

## Data Flow

### Content Read (Public)

1. Browser requests publication page
2. Frontend queries Supabase (anon key) for publication metadata
3. RLS policy returns data if `status = 'published'` and access classification allows public, OR user has entitlement
4. Frontend renders content or paywall UI

### Content Read (Authenticated)

1. Browser sends JWT (Supabase Auth) with request
2. Edge Function or RLS checks entitlements table for user
3. Access granted/denied server-side
4. Content returned or 403

### Payment Flow

1. Frontend calls `init-payment` Edge Function with product ID
2. Edge Function validates product, calls Paystack API
3. Returns authorization URL to frontend
4. Frontend redirects user to Paystack
5. Paystack webhooks `paystack-webhook` Edge Function
6. Edge Function verifies signature, records payment, grants entitlement

### Admin Access Assignment (Control Room)

1. Control Room admin UI calls `grant-access` Edge Function with service role
2. Edge Function validates admin authorization
3. Inserts entitlement row, writes audit log
4. Anti Journal enforces access via RLS on subsequent reads
