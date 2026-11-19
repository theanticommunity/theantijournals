# Data Flow — Anti Journal

## 1. Content Read Flow (Public/Free Publication)

```
Reader Browser
     |
     | 1. GET /articles/:slug (Supabase client, anon key)
     v
Supabase Edge / Postgres
     |
     | 2. RLS check: status='published' AND access_classification='free'
     |    OR user has entitlement
     v
Return publication data (content, metadata)
     |
     | 3. Render article page
     v
Reader Browser
```

**Details:**
- No authentication required
- RLS policy on `publications` table allows SELECT where `status = 'published'` and `access_classification = 'free'`
- If classification is paid/restricted and no entitlement, RLS returns no row → 404 on frontend

## 2. Content Read Flow (Authenticated / Entitled)

```
Reader Browser
     |
     | 1. GET /articles/:slug with Supabase Auth JWT
     v
Supabase
     |
     | 2. Verify JWT, extract user_id
     | 3. RLS check: publication accessible if:
     |    - access_classification = 'free', OR
     |    - EXISTS entitlement for this user targeting this publication
     |    - EXISTS entitlement for this user targeting a collection containing this publication
     |    - Active subscription AND classification IN ('free','paid_individual','subscriber_exclusive')
     v
Return publication data or 403/404
     |
     | 4. Render article (full content or paywall)
     v
Reader Browser
```

## 3. Authentication Flow (Signup/Login)

```
Reader Browser
     |
     | 1. supabase.auth.signUp({email, password}) or signInWithPassword
     v
Supabase Auth
     |
     | 2. Create/verify user in auth.users
     | 3. Send confirmation email (if email confirmations enabled)
     | 4. Return session (access_token, refresh_token, user)
     v
Reader Browser
     |
     | 5. Frontend creates profile row in public.profiles (id = auth.users.id)
     v
Supabase (anon key, RLS allows insert for own id)
     |
     | 6. Store session, redirect to / or /account
     v
Reader Browser
```

## 4. Payment Initialization Flow

```
Reader Browser (Authenticated)
     |
     | 1. POST /functions/v1/init-payment { product_type, product_id }
     |    Header: Authorization: Bearer <JWT>
     v
Edge Function: init-payment
     |
     | 2. Verify JWT, extract user_id
     | 3. Look up product in public.products (validate active, price)
     | 4. For subscription: look up subscription_plans, paystack_plan_code
     | 5. Call Paystack API: POST /transaction/initialize
     |    - email from profile
     |    - amount from product/plan
     |    - metadata: { user_id, product_type, product_id, type }
     | 6. Create payment row in public.payments (status='pending')
     | 7. Return { authorization_url, reference }
     v
Reader Browser
     |
     | 8. window.location.href = authorization_url
     v
Paystack Checkout (hosted)
     |
     | 9. Reader completes payment
     v
Paystack
     |
     | 10. Webhook POST to /functions/v1/paystack-webhook
     v
Edge Function: paystack-webhook
     |
     | 11. Verify Paystack-Signature HMAC-SHA512 with whsec_ secret
     | 12. Verify transaction with Paystack API (GET /transaction/verify/:reference)
     | 13. Check idempotency: payment with paystack_reference already exists?
     | 14. Update public.payments status = 'paid'
     | 15. INSERT into public.entitlements:
     |     - type based on product (publication_purchase, collection_purchase, subscription)
     |     - target_id, target_type
     | 16. For subscription: INSERT/UPDATE public.subscriptions
     | 17. Return HTTP 200 { received: true }
     v
Paystack
     |
     | 18. Redirect reader to callback_url (frontend success page)
     v
Reader Browser
     |
     | 19. Frontend checks payment status via GET /functions/v1/verify-payment/:reference
     | 20. Update UI (show purchased content, hide paywall)
     v
Reader Browser
```

## 5. Subscription Lifecycle Flow

### Activation

```
Webhook: charge.success (metadata.type='subscription')
     |
     | 1. Verify signature
     | 2. Extract user_id, plan, amount from metadata
     | 3. UPSERT public.subscriptions:
     |    - status='active', current_period_end = now + interval
     |    - paystack_subscription_code from data
     | 4. INSERT entitlement: type='subscription', target_type='plan', target_id=plan_id
     | 5. UPDATE entitlements for all publications accessible via this plan
     v
Reader gains access to subscriber-exclusive content
```

### Renewal

```
Webhook: charge.success (subscription renewal invoice)
     |
     | 1. Verify signature
     | 2. Update public.subscriptions.current_period_end
     | 3. entitlements remain active (no change needed)
     v
Access continues uninterrupted
```

### Cancellation

```
Webhook: subscription.disable OR subscription.not_renewable
     |
     | 1. Verify signature
     | 2. UPDATE public.subscriptions SET status='canceled', canceled_at=now
     | 3. entitlements of type='subscription' remain but access checks
     |    verify subscription.status='active' before granting
     | 4. Subscription-derived access expires at current_period_end
     v
Reader loses subscriber-exclusive access at period end
     |
     | 5. Reader retains access to independently purchased publications/collections
     v
```

### Failed Payment

```
Webhook: charge.failed OR invoice.payment_failed
     |
     | 1. Verify signature
     | 2. UPDATE public.payments SET status='failed'
     | 3. UPDATE public.subscriptions SET status='past_due'
     | 4. entitlements remain but access check sees status != 'active'
     v
Access gracefully degrades; retry prompts shown to reader
     v
```

## 6. Entitlement Access Check Flow (Server-Side)

```
Edge Function or RLS query
     |
     | Input: user_id, publication_id
     |
     | 1. Check publication.access_classification = 'free' → GRANT
     |
     | 2. Check entitlements:
     |    WHERE user_id = ?
     |    AND revoked_at IS NULL
     |    AND (expires_at IS NULL OR expires_at > NOW())
     |    AND (
     |      (type='publication_purchase' AND target_id = publication_id)
     |      OR (type='collection_purchase' AND target_id IN (
     |          SELECT collection_id FROM collection_items WHERE publication_id = ?
     |      ))
     |      OR (type='subscription' AND EXISTS (
     |          SELECT 1 FROM subscriptions s
     |          WHERE s.user_id = ? AND s.status = 'active'
     |          AND publication.access_classification IN ('free','paid_individual','subscriber_exclusive')
     |      ))
     |      OR (type='admin_assigned' AND target_id = publication_id)
     |      OR (type='promotional' AND target_id = publication_id)
     |    )
     |
     | 3. If any row matches → GRANT access
     | 4. Otherwise → DENY access (403 or paywall UI)
     v
Return access decision
```

## 7. Admin Access Assignment Flow (Anti Control Room)

```
Control Room Admin UI
     |
     | 1. POST /functions/v1/grant-access
     |    { user_id, type, target_type, target_id, expires_at }
     |    Header: Authorization: Bearer <Service Role JWT>
     v
Edge Function: grant-access
     |
     | 2. Verify service role, check admin role on caller profile
     | 3. INSERT INTO public.entitlements (...)
     | 4. INSERT INTO public.audit_log (actor_id, action, target_type, target_id, metadata)
     | 5. Return { success: true }
     v
Control Room Admin UI
     |
     | 6. Show confirmation
     v
Anti Journal Reader (subsequent request)
     |
     | 7. RLS check finds new entitlement → access granted
     v
Reader
```

## 8. Audit Logging Flow

```
Any Edge Function write operation
     |
     | 1. Extract actor_id from JWT (service role or user)
     | 2. Determine action (e.g. 'grant_access', 'revoke_access', 'create_publication')
     | 3. INSERT INTO public.audit_log:
     |    { actor_id, action, target_type, target_id, metadata, created_at }
     v
Supabase (audit_log table, append-only)
     |
     | 4. Anti Control Room can query audit_log for admin activity review
     v
Admin
```

## 9. Webhook Idempotency Flow

```
Paystack Webhook (duplicate charge.success)
     |
     | 1. Edge Function receives webhook
     | 2. Verify signature
     | 3. Parse reference from payload
     | 4. SELECT * FROM payments WHERE paystack_reference = ?
     | 5. If row exists AND status = 'paid' → return 200 (already processed)
     | 6. If row exists AND status = 'pending' → process normally
     | 7. If no row → create new payment row
     v
No duplicate entitlements or double-charging
     v
Return 200 to Paystack
```

## Data Flow Diagram (Text Summary)

```
┌─────────────┐      HTTPS/JWT        ┌──────────────────┐
│   Reader    │──────────────────────>│   Supabase       │
│   Browser   │                       │   (Anon Key)     │
└─────────────┘    RLS-protected      │  PostgreSQL      │
      ^                               │  + Auth          │
      |                               └────────┬─────────┘
      |                                        |
      | HTTPS (redirect)                       | HTTPS (webhook)
      |                                        v
      |                            ┌──────────────────┐
      |                            │ Edge Functions   │
      |                            │ (init-payment,   │
      |                            │  webhook, verify)│
      |                            └────────┬─────────┘
      |                                      |
      |                              Server-side HTTPS
      |                                      v
      |                            ┌──────────────────┐
      |                            │   Paystack API   │
      |                            │  (payments)      │
      |                            └──────────────────┘
      ^
      | Shared database (no direct API)
      |
┌─────────────┐
│Anti Control │
│    Room     │──────────────────────>│   Supabase       │
│   (Admin)   │   (Service Role Key)  │   (same DB)      │
└─────────────┘                       └──────────────────┘
```
