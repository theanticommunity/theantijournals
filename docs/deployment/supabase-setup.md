# Supabase Setup — Anti Journal

## 1. Create Supabase Project

1. Go to https://supabase.com/ and create a new project
2. Note the project URL and anon key
3. Note the service role key (from Project Settings → API)

## 2. Run Database Migrations

Execute migration files in order using the Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_collections_and_products.sql
supabase/migrations/003_entitlements_and_audit.sql
supabase/migrations/004_rls_policies.sql
```

## 3. Deploy Edge Functions

Using Supabase CLI:

```bash
supabase functions deploy init-payment
supabase functions deploy paystack-webhook
supabase functions deploy verify-payment
supabase functions deploy grant-access
supabase functions deploy revoke-access
supabase functions deploy sync-subscription
```

Or deploy individually via the Supabase dashboard by copying each `index.ts` file.

## 4. Configure Edge Function Environment Variables

In the Supabase dashboard, go to Edge Functions settings and add:

| Variable | Value |
|----------|-------|
| `PAYSTACK_SECRET_KEY` | Your Paystack secret key |
| `PAYSTACK_WEBHOOK_SECRET` | Your Paystack webhook secret |
| `PAYSTACK_ENV` | `test` or `live` |
| `FRONTEND_URL` | Your frontend domain |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-provided.

## 5. Configure Paystack Webhook

In Paystack Dashboard → Developers → Webhooks:

- URL: `https://<your-project>.supabase.co/functions/v1/paystack-webhook`
- Events: `charge.success`, `charge.failed`, `subscription.not_renewable`, `subscription.disable`, `invoice.payment_failed`

## 6. Configure Authentication

In Supabase Dashboard → Authentication → Settings:

- Enable email confirmations (optional)
- Set site URL to your frontend domain
- Add redirect URLs (e.g., `https://theantijournals.web.app/`)

## 7. Seed Initial Data

Insert initial categories, tags, and subscription plans via SQL or the Supabase dashboard:

```sql
INSERT INTO categories (name, slug, description) VALUES
  ('Essays', 'essays', 'Long-form reflections on human experience.'),
  ('Observations', 'observations', 'Brief notes on the ordinary and overlooked.'),
  ('Opinion', 'opinion', 'Provocations and positions on contemporary life.');

INSERT INTO subscription_plans (name, slug, amount, currency, interval, interval_count, is_active) VALUES
  ('Monthly', 'monthly', 200000, 'NGN', 'month', 1, true),
  ('Yearly', 'yearly', 2000000, 'NGN', 'year', 1, true);
```
