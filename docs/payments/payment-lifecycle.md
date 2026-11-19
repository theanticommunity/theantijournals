# Payment Lifecycle — Anti Journal

## States

| State | Description |
|-------|-------------|
| `pending` | Payment initialized, awaiting customer action |
| `paid` | Payment confirmed successful |
| `failed` | Payment declined or failed |
| `refunded` | Payment refunded |

## Lifecycle Diagram

```
Customer selects product
        |
        v
Edge Function: init-payment
        |
        |---> Creates payment row (status='pending')
        |
        |---> Calls Paystack transaction/initialize
        |
        |---> Returns authorization_url
        |
        v
Customer redirected to Paystack Checkout
        |
        |---> Customer completes payment
        |
        v
Paystack sends webhook (charge.success or charge.failed)
        |
        v
Edge Function: paystack-webhook
        |
        |---> Verify Paystack-Signature (HMAC-SHA512)
        |---> Verify transaction with Paystack API
        |---> Check idempotency (existing reference?)
        |
        |---> If charge.success:
        |       Update payment status = 'paid'
        |       Grant entitlement(s)
        |
        |---> If charge.failed:
        |       Update payment status = 'failed'
        |
        v
Return HTTP 200 to Paystack
        |
        v
Customer redirected to frontend callback
        |
        v
Frontend verifies payment via GET /verify-payment/:reference
        |
        v
UI updates (unlock content or show failure)
```

## Payment Creation

When `init-payment` is called:

1. Validate JWT and extract `user_id`
2. Look up product in `public.products` — must be `is_active = true`
3. Determine amount:
   - Publication: product price
   - Collection: collection price
   - Subscription: subscription plan amount
4. Create row in `public.payments`:
   ```sql
   INSERT INTO payments (user_id, type, reference_id, paystack_reference, amount, currency, status)
   VALUES ($1, $2, $3, $4, $5, $6, 'pending')
   ```
5. Call Paystack `POST /transaction/initialize`:
   - `email`: user's profile email
   - `amount`: product price in kobo
   - `currency`: 'NGN'
   - `metadata`: `{ user_id, product_type, product_id, type }`
   - `callback_url`: `${FRONTEND_URL}/payment-success?reference=...`
6. Return `authorization_url` and `reference` to frontend

## Webhook Processing

### charge.success

1. Verify `Paystack-Signature` header
2. Parse event data: `reference`, `metadata`, `amount`, `currency`, `customer`
3. **Idempotency check:** `SELECT * FROM payments WHERE paystack_reference = reference`
   - If exists and `status = 'paid'`: return 200 (already processed)
   - If exists and `status = 'pending'`: proceed to update
   - If not exists: create new payment row
4. Determine entitlement from `metadata.type`:
   - `publication_purchase`: grant entitlement for `metadata.product_id` (type: publication)
   - `collection_purchase`: grant entitlement for `metadata.product_id` (type: collection)
   - `subscription`: activate subscription, grant subscription entitlement
5. Update `public.payments`: `status = 'paid'`
6. Insert into `public.entitlements`:
   - `user_id` from metadata
   - `type` based on purchase type
   - `target_type` / `target_id` from metadata
   - `expires_at`: NULL for purchases, subscription period end for subscriptions
7. Write audit log entry

### charge.failed

1. Verify signature
2. Find payment by `paystack_reference`
3. Update `status = 'failed'`
4. No entitlement granted
5. Return 200

## Frontend Payment Verification

After redirect from Paystack:

1. Frontend reads `reference` from callback URL
2. Calls `GET /functions/v1/verify-payment/:reference` with JWT
3. Edge Function calls Paystack `GET /transaction/verify/:reference`
4. Returns `paid: true/false`
5. Frontend updates UI accordingly

**Never grant access based solely on the frontend success redirect.** Backend verification via webhook is the source of truth.

## Payment History

Readers can view their payment history:
- `SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC`
- Exposed via Edge Function or direct Supabase query with RLS

## Refunds

Refunds are processed through the Paystack dashboard (or Anti Control Room in the future). When a refund occurs:
- Webhook `refund.processed` (if subscribed) or manual update
- Payment status = 'refunded'
- Associated entitlement `revoked_at = NOW()`

## Failed Payment Handling

- Reader is notified on frontend (payment page shows error)
- Subscription enters `past_due` status
- Access gracefully degrades at period end
- Retry flow: reader can re-initiate payment
