# Access Control — Anti Journal

## Row Level Security (RLS)

RLS is enabled on all 16 tables. Policies are defined in `supabase/migrations/004_rls_policies.sql`.

## Policy Summary

| Table | Public Read | Authenticated Read | Authenticated Write | Admin Write |
|-------|------------|-------------------|---------------------|-------------|
| profiles | No | Own profile | Own profile | All |
| categories | Yes | Yes | No | All |
| tags | Yes | Yes | No | All |
| publications | Free/published only | Entitled content | No | All |
| publication_categories | Yes | Yes | No | All |
| publication_tags | Yes | Yes | No | All |
| newsletter_subscribers | Yes (own email) | Yes | Yes (insert) | All |
| bookmarks | No | Own bookmarks | Own bookmarks | All |
| analytics_events | No | No | Yes (insert) | All |
| settings | Yes | Yes | No | All |
| collections | Published only | Published only | No | All |
| collection_items | Yes | Yes | No | All |
| products | Active only | Active only | No | All |
| subscription_plans | Active only | Active only | No | All |
| payments | No | Own payments | No | All |
| subscriptions | No | Own subscriptions | No | All |
| entitlements | No | Own entitlements | No | All |
| audit_log | No | No | No | All |

## Access Classification Logic

A reader can access a publication if ANY condition is true:

1. `access_classification = 'free'` AND `status = 'published'` (public)
2. Active entitlement of type `publication_purchase` targeting this publication
3. Active entitlement of type `collection_purchase` targeting a collection containing this publication
4. Active subscription (`status = 'active'`, `current_period_end > NOW()`) AND classification in `('free', 'paid_individual', 'subscriber_exclusive')`
5. Active entitlement of type `admin_assigned` targeting this publication or containing collection
6. Active entitlement of type `promotional` targeting this publication or containing collection

## Entitlement Lifecycle

- **Granted**: INSERT with `revoked_at = NULL`, optional `expires_at`
- **Revoked**: UPDATE `revoked_at = NOW()`, `revoked_by = admin_id`
- **Expired**: `expires_at` is in the past (checked in access query)
- **Active**: `revoked_at IS NULL` AND (`expires_at IS NULL` OR `expires_at > NOW()`)

## Admin Authorization

Admin operations require `profiles.role = 'admin'`. This is enforced:
- Via RLS policies on write operations
- Via Edge Function checks (`isAdmin()` function)
- Service role key bypasses RLS (backend only)

## Security Boundaries

- Frontend uses `SUPABASE_ANON_KEY` — RLS enforces all security
- Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS for trusted operations
- Paystack webhooks verified via HMAC-SHA512 signature — not JWT-based
- No privileged credentials exposed to frontend
