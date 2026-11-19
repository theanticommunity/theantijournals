# API Reference — Anti Journal

## Overview

Anti Journal exposes functionality through:
1. **Supabase client API** (direct database access with RLS) — used by frontend
2. **Supabase Edge Functions** — server-side business logic (payments, access management)
3. **Paystack webhook** — inbound payment notifications

## Base URL

Supabase project URL: `https://<project-ref>.supabase.co`

Edge Functions: `https://<project-ref>.supabase.co/functions/v1/<function-name>`

## Authentication Headers

| Header | Value | When |
|--------|-------|------|
| `Authorization` | `Bearer <supabase_jwt>` | User-authenticated requests |
| `apikey` | `SUPABASE_ANON_KEY` | All Supabase client requests |
| `Paystack-Signature` | `t=...,v1=...` | Webhook requests from Paystack |

## Edge Functions

### POST /functions/v1/init-payment

Initialize a Paystack payment transaction.

**Headers:**
- `Authorization: Bearer <jwt>`
- `apikey: <anon_key>`

**Request Body:**
```json
{
  "product_type": "publication" | "collection" | "subscription",
  "product_id": "uuid"
}
```

**Response (200):**
```json
{
  "data": {
    "authorization_url": "https://checkout.paystack.com/xxx",
    "reference": "txn_xxx"
  },
  "error": null
}
```

**Errors:**
- 401: Unauthorized (missing/invalid JWT)
- 404: Product not found or inactive
- 422: Invalid product_type
- 500: Paystack API error

---

### POST /functions/v1/paystack-webhook

Receive and process Paystack webhook events.

**Headers:**
- `Paystack-Signature: t=...,v1=...`
- `Content-Type: application/json`

**Request Body:** Raw JSON from Paystack

**Response (200):**
```json
{ "received": true }
```

**Errors:**
- 401: Invalid signature
- 400: Invalid JSON
- 500: Processing error

**Handled Events:**
- `charge.success`
- `charge.failed`
- `subscription.not_renewable`
- `subscription.disable`
- `invoice.payment_failed`

---

### GET /functions/v1/verify-payment/:reference

Verify a Paystack payment transaction.

**Headers:**
- `Authorization: Bearer <jwt>`
- `apikey: <anon_key>`

**Path Parameter:**
- `reference`: Paystack transaction reference

**Response (200):**
```json
{
  "data": {
    "status": "success" | "failed" | "pending",
    "reference": "txn_xxx",
    "amount": 200000,
    "currency": "NGN",
    "paid": true
  },
  "error": null
}
```

---

### POST /functions/v1/grant-access

Grant entitlement to a user (admin operation).

**Headers:**
- `Authorization: Bearer <admin_jwt>`
- `apikey: <anon_key>`

**Request Body:**
```json
{
  "user_id": "uuid",
  "type": "admin_assigned" | "promotional",
  "target_type": "publication" | "collection",
  "target_id": "uuid",
  "expires_at": "2026-12-31T23:59:59Z" (optional)
}
```

**Response (200):**
```json
{ "data": { "entitlement_id": "uuid" }, "error": null }
```

**Errors:**
- 401: Unauthorized
- 403: Forbidden (not admin)
- 404: User not found

---

### POST /functions/v1/revoke-access

Revoke an entitlement (admin operation).

**Headers:**
- `Authorization: Bearer <admin_jwt>`
- `apikey: <anon_key>`

**Request Body:**
```json
{
  "entitlement_id": "uuid"
}
```

**Response (200):**
```json
{ "data": { "revoked": true }, "error": null }
```

---

### POST /functions/v1/sync-subscription

Sync subscription status from Paystack (admin operation).

**Headers:**
- `Authorization: Bearer <admin_jwt>`
- `apikey: <anon_key>`

**Request Body:**
```json
{
  "paystack_subscription_code": "sub_xxx"
}
```

**Response (200):**
```json
{ "data": { "status": "active", "current_period_end": "2026-12-01T00:00:00Z" }, "error": null }
```

## Supabase Client API (Frontend)

### Publications

```
GET /rest/v1/publications?select=*&status=eq.published&access_classification=eq.free
GET /rest/v1/publications?slug=eq.article-slug
```

### Categories

```
GET /rest/v1/categories?select=*&order=name.asc
```

### Tags

```
GET /rest/v1/tags?select=*&order=name.asc
```

### Entitlements (own)

```
GET /rest/v1/entitlements?user_id=eq.<auth.uid()>&revoked_at=is.null
```

### Profiles (own)

```
GET /rest/v1/profiles?id=eq.<auth.uid()>
```

All client API requests are subject to Row Level Security policies.

## Error Response Format

All API errors follow this format:

```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable description"
  }
}
```

## Rate Limiting

- Supabase has default rate limits on Edge Functions
- Paystack API has its own rate limits
- No application-level rate limiting implemented yet

## Versioning

No API versioning currently. Breaking changes require coordination between Anti Journal and Anti Control Room deployments.
