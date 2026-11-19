# Anti Control Room Integration Contract — Anti Journal

## Overview

Anti Control Room is a separate application that shares the same Supabase backend as Anti Journal. Anti Journal contains **no administrative UI** — all administrative operations are performed by Anti Control Room through direct database access and/or Edge Functions.

The two applications are independent: neither depends on the other's frontend. They communicate only through the shared database and Edge Functions.

## Architecture Separation

```
Anti Journal (Reader)              Anti Control Room (Admin)
----------------                   -------------------------
React frontend                     Separate React frontend
Firebase Hosting                   Independent hosting
Supabase anon key                  Supabase service role key
Reads entitled content             Writes content, users, entitlements
                                   Manages payments, subscriptions

Shared: Supabase PostgreSQL database (public schema)
Shared: Supabase Auth (separate user accounts or role-distinguished)
Shared: Supabase Edge Functions
```

## 1. Authentication Requirements

### Anti Control Room Users

- Control Room has its own user accounts in `auth.users`
- Admin flag stored in `public.profiles.role = 'admin'`
- Authentication via Supabase Auth (email/password, OAuth, etc.)
- Session: standard Supabase JWT

### Service Role Key

For operations that bypass RLS (admin writes), the Control Room backend uses:
- `SUPABASE_SERVICE_ROLE_KEY` — must **never** be embedded in the Control Room frontend
- Used only in server-side code or Edge Functions

### No Shared Secret in Frontend

- No shared secret is embedded in either application's frontend
- The Control Room frontend uses `SUPABASE_ANON_KEY` (public by design)
- Admin authorization is enforced by RLS policies checking `profiles.role = 'admin'`

## 2. Administrative Authorization

### Role Model

| Role | Description | Tables Accessible |
|------|-------------|-------------------|
| `member` | Regular reader | Own profile, bookmarks, payments |
| `admin` | Anti Control Room staff | All tables (via RLS policies) |

### RLS Admin Policies (Conceptual)

```sql
-- Admin can read/write publications
CREATE POLICY "Admin manage publications" ON publications
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admin can manage entitlements
CREATE POLICY "Admin manage entitlements" ON entitlements
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### Edge Function Authorization

Edge Functions that perform admin operations verify:
1. Valid JWT
2. Caller's `profiles.role = 'admin'`
3. Or service role key used directly (bypasses JWT, for backend-to-backend)

## 3. Required Database Permissions

### Tables and Required Access

| Table | Control Room Access | Anti Journal Access |
|-------|--------------------|---------------------|
| publications | Full CRUD | Read (RLS-filtered) |
| collections | Full CRUD | Read (RLS-filtered) |
| collection_items | Full CRUD | Read (RLS-filtered) |
| categories | Full CRUD | Read |
| tags | Full CRUD | Read |
| products | Full CRUD | Read |
| subscription_plans | Full CRUD | Read |
| subscriptions | Read + status update | Read (own) |
| payments | Read | Read (own) |
| entitlements | Full CRUD | Read (own) |
| profiles | Read + role update | Read + update own |
| audit_log | Read | No access |

## 4. Available Backend Operations

### Edge Functions

| Function | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `init-payment` | POST | Initialize Paystack transaction | Authenticated user |
| `paystack-webhook` | POST | Process Paystack webhooks | Webhook signature |
| `verify-payment` | GET | Verify payment reference | Authenticated user |
| `grant-access` | POST | Grant entitlement to user | Service role / admin |
| `revoke-access` | POST | Revoke entitlement | Service role / admin |
| `sync-subscription` | POST | Sync subscription status from Paystack | Service role / admin |

### Direct Database Access (Control Room Backend Only)

Control Room can query/modify any table directly using the service role key:
- Create/update publications, collections, categories, tags
- Manage products, pricing, subscription plans
- View reader profiles, payments, subscriptions
- Grant/revoke entitlements
- Read audit log

## 5. Required API Endpoints / Edge Functions

### `POST /functions/v1/grant-access`

**Request body:**
```json
{
  "user_id": "uuid",
  "type": "admin_assigned",
  "target_type": "publication" | "collection",
  "target_id": "uuid",
  "expires_at": "2026-12-31T23:59:59Z" (optional)
}
```

**Response:**
```json
{ "data": { "entitlement_id": "uuid", "created": true } }
```

### `POST /functions/v1/revoke-access`

**Request body:**
```json
{
  "entitlement_id": "uuid"
}
```

**Response:**
```json
{ "data": { "revoked": true } }
```

### `POST /functions/v1/sync-subscription`

**Request body:**
```json
{
  "paystack_subscription_code": "sub_xxx"
}
```

**Response:**
```json
{ "data": { "status": "active", "current_period_end": "2026-12-01T00:00:00Z" } }
```

## 6. Request and Response Structures

All Edge Functions use standard JSON:

**Success:**
```json
{ "data": { ... }, "error": null }
```

**Error:**
```json
{ "data": null, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

### Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient role (not admin) |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate or already processed |
| `VALIDATION_ERROR` | 422 | Invalid input |
| `PAYSTACK_ERROR` | 502 | Paystack API failure |
| `INTERNAL_ERROR` | 500 | Server error |

## 7. Access Assignment and Revocation Procedures

### Grant Access

1. Control Room admin selects user and target (publication/collection/plan)
2. Calls `grant-access` Edge Function with service role or admin JWT
3. Edge Function validates admin authorization
4. Inserts row into `public.entitlements`:
   - `type = 'admin_assigned'` (or `promotional`)
   - `target_type`, `target_id`
   - `granted_by = auth.uid()`
   - `expires_at` if time-limited
5. Writes audit log entry
6. Returns confirmation

### Revoke Access

1. Control Room admin identifies entitlement to revoke
2. Calls `revoke-access` Edge Function
3. Edge Function sets `revoked_at = NOW()`, `revoked_by = auth.uid()`
4. Writes audit log entry
5. Access is immediately denied on subsequent Anti Journal requests

## 8. Audit Logging

All administrative operations write to `public.audit_log`:

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| actor_id | UUID | Admin who performed the action |
| action | text | e.g. 'grant_access', 'revoke_access', 'create_publication' |
| target_type | text | e.g. 'entitlement', 'publication', 'subscription' |
| target_id | UUID | Affected resource |
| metadata | jsonb | Additional context |
| created_at | timestamptz | |

Anti Control Room can query `audit_log` for administrative activity review.

## 9. Environment Configuration

Control Room requires:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon key (frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backend only — never in frontend) |

No Paystack keys needed in Control Room unless it directly processes refunds.

## 10. Independence Guarantee

- Anti Control Room does **not** import or reference any Anti Journal frontend code
- Anti Control Room does **not** call any Anti Journal-specific endpoints
- Anti Control Room uses the same Supabase project but operates independently
- Changes to Anti Journal UI do not affect Control Room
- Changes to Control Room UI do not affect Anti Journal

The only coupling is the shared database schema, which is versioned via migrations.
