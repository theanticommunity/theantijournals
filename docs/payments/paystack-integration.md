# Paystack Integration — Anti Journal

## Overview

Paystack is the payment processor for Anti Journal. All Paystack interactions happen server-side (Edge Functions). The frontend never handles Paystack secret keys and never initializes transactions directly.

## Configuration

### Environment Variables (Edge Functions)

| Variable | Description | Example |
|----------|-------------|---------|
| `PAYSTACK_SECRET_KEY` | Paystack secret key (sk_live or sk_test) | `sk_live_xxx` |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key (pk_live or pk_test) | `pk_live_xxx` |
| `PAYSTACK_WEBHOOK_SECRET` | Webhook signing secret (whsec_) | `whsec_xxx` |
| `PAYSTACK_ENV` | `test` or `live` | `test` |
| `FRONTEND_URL` | Frontend domain for callbacks | `https://theantijournals.web.app` |

### Sandbox vs Live Mode

| Setting | Test Mode (`PAYSTACK_ENV=test`) | Live Mode (`PAYSTACK_ENV=live`) |
|---------|----------------------------------|----------------------------------|
| Secret key | `sk_test_...` | `sk_live_...` / `rk_live_...` |
| Public key | `pk_test_...` | `pk_live_...` |
| Webhook secret | `whsec_...` (test) | `whsec_...` (live) |
| API base | `https://api.paystack.co` | `https://api.paystack.co` |
| Webhook URL | Staging/test domain | Production domain |

Never mix test and live keys in the same environment.

## Integration Responsibilities

### Backend (Edge Functions) Handles

1. **Transaction initialization** — calls Paystack API with secret key
2. **Transaction verification** — confirms payment status with Paystack
3. **Webhook reception** — verifies `Paystack-Signature` header
4. **Payment recording** — writes to `public.payments`
5. **Entitlement granting** — writes to `public.entitlements`
6. **Subscription lifecycle** — processes renewal, cancellation, failure events

### Frontend Handles

1. **Product selection** — reader chooses publication/collection/plan
2. **Redirect** — browser sent to Paystack authorization URL
3. **Return handling** — reads callback URL params, verifies payment
4. **UI updates** — shows paywall or unlocked content

### Never Exposed to Frontend

- Paystack secret key
- Paystack webhook secret
- Any backend credentials

## Supported Payment Types

| Type | Description | Paystack Mechanism |
|------|-------------|-------------------|
| Individual publication | One-time purchase of single article | Transaction initialize |
| Collection | One-time purchase of publication bundle | Transaction initialize |
| Subscription | Recurring monthly/yearly access | Paystack Plans + Subscriptions |

## Payment Channels

Paystack supports multiple channels (card, bank transfer, USSD, mobile money, QR). Not all channels support recurring billing. The integration:

- Initializes transactions without specifying channel (lets Paystack present all available)
- Does not assume all channels support subscriptions
- For subscriptions, relies on Paystack's subscription API where supported
- Card payments are the primary supported channel for recurring billing

## API Endpoints (Edge Functions)

### `POST /functions/v1/init-payment`

**Request:**
```json
{
  "product_type": "publication" | "collection" | "subscription",
  "product_id": "uuid"
}
```

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Response:**
```json
{
  "data": {
    "authorization_url": "https://checkout.paystack.com/xxx",
    "reference": "txn_xxx"
  }
}
```

### `POST /functions/v1/paystack-webhook`

**Request:** Raw JSON body with `Paystack-Signature: t=...,v1=...` header

**Response:** `{"received": true}` (HTTP 200)

### `GET /functions/v1/verify-payment/:reference`

**Headers:** `Authorization: Bearer <supabase_jwt>`

**Response:**
```json
{
  "data": {
    "status": "success" | "failed" | "pending",
    "reference": "txn_xxx",
    "amount": 200000,
    "currency": "NGN",
    "paid": true
  }
}
```

## Error Handling

| HTTP Code | Condition |
|-----------|-----------|
| 400 | Missing required fields, invalid product |
| 401 | Missing/invalid JWT, invalid webhook signature |
| 403 | Insufficient permissions |
| 404 | Product not found |
| 409 | Duplicate payment reference (idempotency) |
| 422 | Validation error |
| 500 | Paystack API error, server error |

## Idempotency

- Paystack reference stored in `public.payments.paystack_reference` (unique constraint)
- Webhook checks for existing payment before creating new row
- Duplicate webhooks with same reference return HTTP 200 without re-processing
- Entitlement creation checks for existing active entitlement before inserting
