# Troubleshooting — Anti Journal

## Common Issues

### Frontend

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Supabase auth not working | Missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` | Check `.env` file |
| Articles not loading | RLS policy blocking access | Check `public.profiles` row exists for user |
| Payment initialization fails | Missing `PAYSTACK_SECRET_KEY` in Edge Function env | Check Edge Function config |
| Webhook returns 401 | Invalid `PAYSTACK_WEBHOOK_SECRET` | Verify webhook secret in Paystack dashboard |
| 403 on admin operations | User profile role not set to 'admin' | Update `public.profiles.role` |
| Content not visible | `access_classification` not 'free' and no entitlement | Check entitlements table |

### Backend (Edge Functions)

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Function returns 500 | Missing environment variables | Check Edge Function env vars |
| Webhook not firing | Webhook URL not publicly accessible | Verify Supabase function URL |
| Payment not recorded | Idempotency check skipping | Check `payments` table for existing reference |
| Entitlement not granted | Webhook signature verification failing | Verify `PAYSTACK_WEBHOOK_SECRET` |

### Database

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| RLS blocking reads | Policy too restrictive | Review `004_rls_policies.sql` |
| Foreign key violation | Referenced row doesn't exist | Check parent table insert order |
| Duplicate key | Unique constraint violation | Check idempotency before insert |

### Paystack

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Webhook signature invalid | Wrong secret key | Check `whsec_` vs `sk_` key |
| Payment fails | Insufficient funds or card declined | Ask customer to retry |
| Subscription not renewing | Card expired or insufficient funds | Paystack handles retry logic |

## Debug Steps

1. Check browser console for frontend errors
2. Check Supabase Edge Function logs in dashboard
3. Check Supabase database query logs
4. Check Paystack dashboard for transaction logs
5. Verify environment variables are set correctly

## Support

- Supabase: https://supabase.com/docs
- Paystack: https://paystack.com/docs
- Firebase Hosting: https://firebase.google.com/docs/hosting
