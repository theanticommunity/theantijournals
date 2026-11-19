# Content Access — Anti Journal

## Overview

Access to content is determined by a **unified entitlement system**. Access sources are independent and additive. Access is enforced **server-side** (via Row Level Security and/or Edge Functions), never solely through frontend visibility.

## Access Sources

| Source | Entitlement Type | Target | Independent? |
|--------|-----------------|--------|--------------|
| Public access | None (free classification) | Publication | Yes (baseline) |
| Individual purchase | `publication_purchase` | Publication | Yes |
| Collection purchase | `collection_purchase` | Collection | Yes |
| Active subscription | `subscription` | Plan | Yes |
| Admin-assigned | `admin_assigned` | Publication or Collection | Yes |
| Promotional/complimentary | `promotional` | Publication or Collection | Yes |

## Entitlements Table

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References `auth.users.id` |
| type | text | `publication_purchase`, `collection_purchase`, `subscription`, `admin_assigned`, `promotional` |
| target_type | text | `publication`, `collection`, `plan` |
| target_id | UUID | Referenced entity ID |
| granted_by | UUID | Admin user ID (for admin_assigned) |
| expires_at | timestamptz | NULL = permanent |
| created_at | timestamptz | |
| revoked_at | timestamptz | NULL = active |
| revoked_by | UUID | Admin who revoked |

## Access Resolution Algorithm

A user can access a publication if ANY condition is true:

```
1. publication.access_classification = 'free' AND publication.status = 'published'
   → GRANT (public access)

2. EXISTS active entitlement for this user:
   type = 'publication_purchase'
   target_id = publication.id
   revoked_at IS NULL
   AND (expires_at IS NULL OR expires_at > NOW())
   → GRANT (individual purchase)

3. EXISTS active entitlement for this user:
   type = 'collection_purchase'
   target_id IN (SELECT collection_id FROM collection_items WHERE publication_id = publication.id)
   revoked_at IS NULL
   AND (expires_at IS NULL OR expires_at > NOW())
   → GRANT (collection purchase)

4. EXISTS active subscription entitlement:
   type = 'subscription'
   target_type = 'plan'
   revoked_at IS NULL
   AND (expires_at IS NULL OR expires_at > NOW())
   AND EXISTS subscription s WHERE:
     s.user_id = user.id
     s.plan_id = entitlement.target_id
     s.status = 'active'
     s.current_period_end > NOW()
   AND publication.access_classification IN ('free', 'paid_individual', 'subscriber_exclusive')
   → GRANT (subscription-derived)

5. EXISTS active entitlement:
   type = 'admin_assigned'
   target_id = publication.id OR target_id IN (collections containing publication)
   revoked_at IS NULL
   AND (expires_at IS NULL OR expires_at > NOW())
   → GRANT (admin-assigned)

6. EXISTS active entitlement:
   type = 'promotional'
   target_id = publication.id OR target_id IN (collections containing publication)
   revoked_at IS NULL
   AND (expires_at IS NULL OR expires_at > NOW())
   → GRANT (promotional)
```

If none match: **DENY access** (show paywall or 403).

## Subscription Access Expiration

Subscription-derived access is not permanent. The access check verifies:
- `subscriptions.status = 'active'`
- `subscriptions.current_period_end > NOW()`

When a subscription is canceled or past_due:
- Subscription-derived entitlement still exists in the table
- But access check fails because subscription status != 'active'
- Reader loses access to subscriber-exclusive content
- Reader **retains** access to independently purchased publications and admin-assigned content

## Access Change Examples

### Example 1: Subscriber-exclusive → Free

1. Article A is `access_classification = 'subscriber_exclusive'`
2. Admin changes to `access_classification = 'free'`
3. All readers can now access Article A (condition 1 matches)
4. Existing subscription entitlements for Article A remain but are no longer required

### Example 2: Subscription cancellation

1. Reader has active subscription → can access subscriber-exclusive articles
2. Subscription is canceled (status = 'canceled')
3. On next access attempt, condition 4 fails (status != 'active')
4. Reader loses access to subscriber-exclusive content
5. Reader retains access to articles purchased individually (condition 2) or assigned by admin (condition 5)

### Example 3: Collection purchase + subscription cancellation

1. Reader purchases Collection A (entitlement: collection_purchase, target=Collection A)
2. Reader subscribes to premium (entitlement: subscription, target=Plan)
3. Reader cancels subscription
4. Reader **still** has access to all publications in Collection A (condition 3)
5. Reader loses access to subscriber-exclusive articles NOT in Collection A

## Enforcement Locations

### Row Level Security (Database)

RLS policies on `publications` table:
- `SELECT` allowed if `status = 'published'` AND (free OR user has entitlement)
- Implemented via SQL policy checking `public.entitlements` and `public.subscriptions`

### Edge Functions

Payment and access grant/revoke functions enforce:
- Authentication (JWT verification)
- Authorization (admin role for grant/revoke)
- Business logic (idempotency, validation)

### Frontend

Frontend checks access to:
- Show/hide paywall UI
- Show/hide "Subscribe to read" messages
- Navigation decisions

**Frontend checks are UX only; backend enforces the actual access control.**

## RLS Policy Example (Conceptual)

```sql
CREATE POLICY "Published and accessible" ON publications
FOR SELECT USING (
  status = 'published' AND (
    access_classification = 'free'
    OR EXISTS (
      SELECT 1 FROM entitlements e
      WHERE e.user_id = auth.uid()
        AND e.revoked_at IS NULL
        AND (e.expires_at IS NULL OR e.expires_at > NOW())
        AND (
          (e.type = 'publication_purchase' AND e.target_id = id)
          OR (e.type = 'collection_purchase' AND e.target_id IN (
            SELECT collection_id FROM collection_items WHERE publication_id = id
          ))
          OR (e.type = 'admin_assigned' AND e.target_id = id)
          OR (e.type = 'promotional' AND e.target_id = id)
        )
    )
    OR EXISTS (
      SELECT 1 FROM entitlements e
      JOIN subscriptions s ON s.user_id = auth.uid() AND s.plan_id = e.target_id
      WHERE e.user_id = auth.uid()
        AND e.type = 'subscription'
        AND e.revoked_at IS NULL
        AND s.status = 'active'
        AND s.current_period_end > NOW()
        AND access_classification IN ('free', 'paid_individual', 'subscriber_exclusive')
    )
  )
);
```

## Revocation

Access can be revoked at any time:

1. `UPDATE entitlements SET revoked_at = NOW(), revoked_by = ? WHERE id = ?`
2. Subsequent access checks fail (revoked_at is not NULL)
3. Takes effect immediately on next request

## Admin-Assigned Access

Anti Control Room (future) can grant access:
- `INSERT INTO entitlements (user_id, type, target_type, target_id, granted_by, expires_at)`
- `type = 'admin_assigned'`
- Works independently of purchases and subscriptions
- Can be time-limited (`expires_at`) or permanent
- Can be revoked at any time
