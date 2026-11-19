# Rollback Procedure — Anti Journal

## Frontend Rollback

1. Identify the previous working Firebase Hosting release
2. Roll back via Firebase CLI: `firebase hosting:rollout --target <previous-version>`
3. Or rebuild and redeploy the previous commit

## Database Rollback

Supabase migrations are not automatically reversible. To roll back:

1. Export current data (if needed)
2. Execute DOWN migrations (if written) or manually drop tables
3. Restore from backup if available

**Recommended:** Test migrations on a staging project before applying to production.

## Edge Function Rollback

1. Identify the previous working function version
2. Redeploy the previous version via Supabase CLI or dashboard
3. Verify webhook endpoint still returns 200

## Paystack Rollback

No rollback needed for Paystack configuration changes (webhook URL, events).
If a webhook URL change causes issues, revert to the previous URL immediately.

## Emergency Contacts

- Supabase: https://supabase.com/support
- Paystack: https://paystack.com/support
- Firebase: https://firebase.google.com/support
