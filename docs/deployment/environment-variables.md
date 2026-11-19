# Environment Variables — Anti Journal

## Frontend (.env at project root)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key | `eyJhbGci...` | Yes |
| `VITE_API_BASE` | API base URL (legacy, not used) | `/api` | No |

## Supabase Edge Functions (set in Supabase dashboard)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` | Yes (auto-set) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (SECRET) | `eyJhbGci...` | Yes |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (sk_live or sk_test) | `sk_live_xxx` or `sk_test_xxx` | Yes |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | `pk_live_xxx` or `pk_test_xxx` | No (frontend may need) |
| `PAYSTACK_WEBHOOK_SECRET` | Paystack webhook signing secret | `whsec_xxx` | Yes |
| `PAYSTACK_ENV` | `test` or `live` | `test` | Yes |
| `FRONTEND_URL` | Frontend domain for payment callbacks | `https://theantijournals.web.app` | Yes |

## Security Notes

- Never commit `.env` files to version control
- `SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY` must never be exposed to the frontend
- `PAYSTACK_WEBHOOK_SECRET` must never be exposed to the frontend
- The `SUPABASE_ANON_KEY` is safe to expose (RLS enforces security)

## .gitignore

Ensure `.env` files are in `.gitignore`:
```
.env
.env.local
.env.*.local
```

## Paystack Dashboard Configuration

1. Create a Paystack account at https://dashboard.paystack.com/
2. Get API keys from Settings → API Keys
3. Generate webhook signing secret from Developers → API configuration
4. Configure webhook URL: `https://<supabase-project>.supabase.co/functions/v1/paystack-webhook`
5. Subscribe to webhook events: `charge.success`, `charge.failed`, `subscription.not_renewable`, `subscription.disable`, `invoice.payment_failed`

## Supabase Project Setup

1. Create a project at https://supabase.com/
2. Run migrations in order: `001_initial_schema.sql` → `002_collections_and_products.sql` → `003_entitlements_and_audit.sql` → `004_rls_policies.sql`
3. Deploy Edge Functions using Supabase CLI or dashboard
4. Configure environment variables in Edge Function settings
5. Enable email authentication in Auth settings (optional)
