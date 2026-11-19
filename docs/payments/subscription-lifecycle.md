# Subscription Lifecycle — Anti Journal

## States

| State | Description | Access Granted? |
|-------|-------------|-----------------|
| `active` | Subscription currently active | Yes |
| `canceled` | Subscription canceled (at period end or immediately) | No (after period end) |
| `past_due` | Payment failed, grace period | No (or limited grace) |
| `trialing` | Trial period active | Yes |
| `price_change_canceled` | Price change pending customer acceptance | No |

## Subscription Creation Flow

```
Reader selects plan (monthly/yearly)
        |
        v
init-payment Edge Function
        |
        |---> Look up subscription_plan (paystack_plan_code, amount, interval)
        |---> Create Paystack plan if missing (POST /plan)
        |---> Initialize transaction (POST /transaction/initialize)
        |---> Create payment row (status='pending')
        |---> Return authorization_url
        |
        v
Reader completes Paystack checkout
        |
        v
Webhook: charge.success (metadata.type='subscription')
        |
        |---> UPSERT subscriptions table:
        |       status='active', current_period_end = now + interval
        |       paystack_subscription_code from Paystack data
        |---> INSERT entitlement: type='subscription', target_type='plan'
        |---> Update payment status = 'paid'
        |
        v
Reader has subscriber-exclusive access
```

## Subscription Renewal Flow

```
Paystack recurring billing
        |
        v
Webhook: charge.success (subscription invoice payment)
        |
        |---> Update subscriptions.current_period_end
        |---> status remains 'active'
        |---> No new entitlement needed (existing one still valid)
        |
        v
Access continues uninterrupted
```

## Subscription Cancellation Flow

### Customer-initiated cancellation

```
Customer cancels via frontend/Control Room
        |
        v
Edge Function calls Paystack API to disable subscription
        |
        |---> UPDATE subscriptions SET cancel_at_period_end = true
        |
        v
Webhook: subscription.disable (when period ends)
        |
        |---> UPDATE subscriptions SET status='canceled', canceled_at=now
        |---> Access check: status != 'active' → deny subscriber-exclusive content
        |
        v
Reader retains access until current_period_end
        |
        |---> After period end: loses subscriber-exclusive access
        |---> Retains independently purchased publications/collections
```

### Payment failure cancellation

```
Webhook: charge.failed (recurring invoice)
        |
        |---> UPDATE subscriptions SET status='past_due'
        |
        |---> Webhook: subscription.not_renewable (after retry exhaustion)
        |
        |---> UPDATE subscriptions SET status='canceled'
        |
        v
Access to subscriber-exclusive content revoked
```

## Expiration Flow

```
Subscription.current_period_end reached
        |
        |---> If not renewed: access check fails (status check)
        |---> Reader sees paywall for subscriber-exclusive content
        |---> Independently purchased content remains accessible
```

## Access Check for Subscription-Derived Content

```
Query:
  SELECT 1 FROM entitlements e
  JOIN subscriptions s ON e.target_id = s.plan_id AND e.target_type = 'plan'
  WHERE e.user_id = ?
    AND e.revoked_at IS NULL
    AND (e.expires_at IS NULL OR e.expires_at > NOW())
    AND s.status = 'active'
    AND s.current_period_end > NOW()
```

If no row matches, subscription-derived access is denied.

## Independent Access Preservation

A reader who:
1. Purchased Collection A (entitlement type='collection_purchase')
2. Was assigned Collection B by admin (entitlement type='admin_assigned')
3. Subscribed to premium (entitlement type='subscription')
4. Cancels subscription

Result: retains access to Collection A and B; loses subscription-derived access only.

## Webhook Events Handled

| Event | Action |
|-------|--------|
| `charge.success` (subscription) | Activate/renew subscription, grant entitlement |
| `charge.failed` | Set subscription to `past_due` |
| `subscription.not_renewable` | Set subscription to `canceled`, revoke access |
| `subscription.disable` | Set subscription to `canceled`, revoke access |
| `invoice.payment_failed` | Set subscription to `past_due` |

## Subscription Plans (Configurable)

Plans are stored in `public.subscription_plans`, not hardcoded:

| Field | Example (Monthly) | Example (Yearly) |
|-------|-------------------|------------------|
| name | "Monthly" | "Yearly" |
| slug | "monthly" | "yearly" |
| amount | 200000 kobo (₦2,000) | 2000000 kobo (₦20,000) |
| interval | "month" | "year" |
| interval_count | 1 | 1 |
| paystack_plan_code | `PLN_xxx` | `PLN_yyy` |
| is_active | true | true |

Plans can be added, edited, or deactivated without code changes (managed via Anti Control Room).
