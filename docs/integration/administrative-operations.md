# Administrative Operations — Anti Journal

## Overview

Anti Control Room performs all administrative operations. Anti Journal contains no admin UI. This document describes the operations Control Room can perform against the shared backend.

## Content Operations

### Create Publication

- INSERT into `public.publications`
- Set `status = 'draft'` by default
- Set `access_classification` (free, paid_individual, subscriber_exclusive, restricted)
- Associate categories and tags via join tables
- Upload cover image to Supabase Storage

### Edit Publication

- UPDATE `public.publications` fields
- Change `access_classification` without duplicating content
- Update categories/tags via join tables

### Publish/Unpublish

- Publish: SET `status = 'published'`, `published_at = NOW()` (if not already set)
- Unpublish: SET `status = 'unpublished'`
- Archive: SET `status = 'archived'`

### Schedule Publication

- SET `status = 'scheduled'`, `published_at = <future date>`
- At scheduled time, publication becomes visible per its `access_classification`

### Delete Publication

- Soft delete: SET `status = 'archived'` (recommended)
- Hard delete: DELETE from `public.publications` (cascades to join tables)

## Collection Operations

### Create Collection

- INSERT into `public.collections`
- Set `status`, `price`, `currency`
- Create corresponding `public.products` row (`type = 'collection'`)

### Edit Collection

- UPDATE title, description, cover_image, price, status

### Publish/Unpublish Collection

- SET `status = 'published'` or `'unpublished'`

### Add/Remove Publications

- Add: INSERT into `public.collection_items` with `position`
- Remove: DELETE from `public.collection_items`
- Reorder: UPDATE `position` values

## Category and Tag Operations

### Categories

- Create, edit, delete categories
- Categories can exist without publications

### Tags

- Create, edit, delete tags
- Tags can exist without publications

## Product and Pricing Operations

### Products

- Create product linked to publication, collection, or subscription plan
- Set price in kobo
- Set `is_active` flag

### Subscription Plans

- Create plan: name, slug, amount, interval, interval_count
- Create corresponding Paystack plan (via Edge Function or Control Room backend)
- Store `paystack_plan_code` in `public.subscription_plans`
- Activate/deactivate plans

## Reader Operations

### View Readers

- Query `public.profiles` with pagination
- Filter by role, membership status

### View Subscriptions

- Query `public.subscriptions`
- Filter by status (active, canceled, past_due)

### View Payments

- Query `public.payments`
- Filter by user, status, type

## Entitlement Operations

### Grant Access

- INSERT into `public.entitlements`
- `type = 'admin_assigned'` or `'promotional'`
- `target_type = 'publication'` or `'collection'`
- `target_id`
- Optional `expires_at`
- `granted_by = admin_user_id`

### Revoke Access

- UPDATE `public.entitlements` SET `revoked_at = NOW()`, `revoked_by = admin_user_id`

## Subscription Operations

### View Subscription Status

- Query `public.subscriptions` for user

### Cancel Subscription

- Call Paystack API to disable subscription
- UPDATE `public.subscriptions` SET `status = 'canceled'`, `canceled_at = NOW()`

### Sync Subscription

- Call `sync-subscription` Edge Function with Paystack subscription code
- Updates `status`, `current_period_end` from Paystack

## Analytics Operations

- Query `public.analytics_events` (if migrated)
- View page views, article views, conversions

## Audit Log Operations

- Query `public.audit_log` for admin activity
- Filter by actor, action, date range

## Operation Authorization

| Operation | Required Role | Enforcement |
|-----------|--------------|-------------|
| Create/edit publication | admin | RLS or Edge Function |
| Publish/unpublish | admin | RLS or Edge Function |
| Create/edit collection | admin | RLS or Edge Function |
| Manage products/pricing | admin | RLS or Edge Function |
| Manage subscription plans | admin | RLS or Edge Function |
| Grant/revoke access | admin | Edge Function + RLS |
| View readers/subscriptions/payments | admin | RLS |
| View audit log | admin | RLS |

## No Direct Backend Access

Control Room does **not** have direct access to:
- Paystack secret key (unless separately configured for refunds)
- Supabase service role key in frontend
- Anti Journal frontend source code

All privileged operations go through Edge Functions or direct database queries with service role key (backend-only).
