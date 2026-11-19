# Testing — Anti Journal

## Test Scenarios

### Content

- [ ] Create a publication (via Admin/Control Room)
- [ ] Edit a publication (change title, content, access_classification)
- [ ] Publish a publication (status: draft → published)
- [ ] Unpublish a publication (status: published → unpublished)
- [ ] Change access classification (free → paid_individual → subscriber_exclusive)
- [ ] Display free content to anonymous readers
- [ ] Display restricted content only to entitled readers

### Collections

- [ ] Create a collection
- [ ] Add multiple publications to a collection
- [ ] Add the same publication to multiple collections
- [ ] Remove publications from a collection
- [ ] Purchase a collection
- [ ] Verify collection access grants access to all publications in it

### Payments

- [ ] Initialize a payment (init-payment Edge Function)
- [ ] Process a successful payment (charge.success webhook)
- [ ] Process a failed payment (charge.failed webhook)
- [ ] Reject invalid webhook signatures
- [ ] Handle duplicate webhook events (idempotency)
- [ ] Verify payment records in database
- [ ] Verify entitlements granted after payment

### Subscriptions

- [ ] Activate a subscription
- [ ] Handle a renewal (recurring charge.success)
- [ ] Handle cancellation (subscription.disable)
- [ ] Handle expiration (current_period_end passed)
- [ ] Handle failed recurring payments (charge.failed → past_due)
- [ ] Verify subscription-derived access changes appropriately
- [ ] Verify purchased content remains accessible after subscription cancellation

### Access Control

- [ ] Anonymous readers cannot access restricted content
- [ ] Authenticated readers only access entitled content
- [ ] Purchased content remains accessible after subscription cancellation
- [ ] Administrator-assigned access works independently of purchases
- [ ] Revoked access is enforced immediately
- [ ] Unauthorized users cannot perform administrative operations (403)

### Deployment

- [ ] Run production build (`npm run build`)
- [ ] Check environment configuration
- [ ] Check database migrations applied
- [ ] Check frontend/Edge Function communication
- [ ] Check RLS security rules
- [ ] Identify remaining deployment blockers

## Test Status

Automated tests have NOT been implemented. All test scenarios above are manual verification steps that must be executed before production deployment.
