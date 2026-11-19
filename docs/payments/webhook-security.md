# Webhook Security — Anti Journal

## Overview

Paystack webhooks notify the backend of payment events. Webhook security is critical: an unverified webhook could allow unauthorized entitlement grants or payment fraud.

## Signature Verification

Paystack sends webhooks with one of two signature headers:

### 1. `Paystack-Signature` (New — whsec_ secret)

Format: `t=<timestamp>,v1=<hmac_hex>`

Verification algorithm:
1. Parse the header into `t` (timestamp) and `v1` (signature) components
2. Reject if timestamp is missing or more than 300 seconds from server time
3. Construct payload: `timestamp + "." + raw_body`
4. Compute HMAC-SHA512 using `PAYSTACK_WEBHOOK_SECRET` (`whsec_...`)
5. Constant-time compare against each `v1` signature
6. Accept if any signature matches

### 2. `x-paystack-signature` (Deprecated — sk_ secret)

Format: Raw HMAC-SHA512 hex digest

Verification algorithm:
1. Compute HMAC-SHA512 using `PAYSTACK_SECRET_KEY` (`sk_...` or `rk_...`)
2. Compare against header value
3. Accept if match

**Fallback:** If `Paystack-Signature` is absent or fails, fall back to `x-paystack-signature`. If both fail, reject with HTTP 401.

## Implementation Reference

The current implementation in `server/index.js` (function `verifyPaystackSignature`) implements the `Paystack-Signature` verification correctly:
- Parses `t=` and `v1=` from comma-separated header
- Validates timestamp within 300-second tolerance
- Computes HMAC-SHA512 of `timestamp.rawBody` using webhook secret
- Uses `crypto.timingSafeEqual` for constant-time comparison
- Validates signature is 128 hex characters (SHA-512 output)

The legacy fallback uses `crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody).digest('hex')` and compares against `x-paystack-signature`.

## Webhook Endpoint Configuration

| Setting | Value |
|---------|-------|
| URL | `https://<backend-domain>/functions/v1/paystack-webhook` |
| Method | POST |
| Content-Type | `application/json` |
| Secret header | `Paystack-Signature` (whsec_) |

## Subscribed Events

| Event | Description |
|-------|-------------|
| `charge.success` | Payment successful (one-time or subscription) |
| `charge.failed` | Payment failed |
| `subscription.not_renewable` | Subscription can no longer renew |
| `subscription.disable` | Subscription disabled |
| `invoice.payment_failed` | Recurring invoice payment failed |

## Idempotency and Duplicate Protection

Each webhook is processed idempotently:

1. Parse `reference` from webhook data
2. `SELECT * FROM payments WHERE paystack_reference = reference`
3. If row exists with `status = 'paid'`: return HTTP 200 immediately (already processed)
4. If row exists with `status = 'pending'`: proceed to update
5. If no row exists: create new payment row

This prevents:
- Double entitlement grants
- Duplicate payment records
- Incorrect analytics from repeated webhooks

## Request Body Handling

The webhook endpoint must read the **raw request body** before JSON parsing, because signature verification is computed over the raw bytes, not the parsed JSON object.

```
Raw body → HMAC verification → JSON parse → event processing
```

If the body is parsed before verification, the signature will not match (whitespace/encoding differences).

## Response Requirements

| Condition | Response |
|-----------|----------|
| Valid signature, processed successfully | HTTP 200 `{"received": true}` |
| Invalid signature | HTTP 401 `{"error": "Invalid signature"}` |
| Invalid JSON | HTTP 400 `{"error": "Invalid JSON"}` |
| Processing error | HTTP 500 `{"error": "Webhook processing failed"}` |

**Always return HTTP 200 after successful processing** — Paystack retries failed webhooks, and returning non-200 causes duplicate delivery attempts.

## Security Checklist

- [ ] `PAYSTACK_WEBHOOK_SECRET` set in Edge Function env vars (not frontend)
- [ ] `PAYSTACK_SECRET_KEY` set for legacy fallback
- [ ] Raw body used for signature verification (not parsed JSON)
- [ ] Timestamp tolerance checked (300 seconds)
- [ ] Constant-time comparison used (`timingSafeEqual`)
- [ ] Idempotency check on `paystack_reference`
- [ ] HTTP 200 always returned after processing
- [ ] Webhook URL publicly accessible (no IP allowlisting blocking Paystack)
- [ ] Webhook events subscribed in Paystack dashboard

## Testing Webhook Security

In test mode (`PAYSTACK_ENV=test`):
1. Use Paystack's test webhook simulator in dashboard
2. Send test event with known signature
3. Verify Edge Function returns 200 and processes correctly
4. Send tampered payload → verify 401 response
5. Send duplicate webhook → verify idempotent processing (no duplicate entitlements)
