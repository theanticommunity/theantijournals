# Deployment Checklist — Anti Journal

## Completed Locally

- [ ] Database migrations written (`supabase/migrations/001-004.sql`)
- [ ] Edge Functions written (`supabase/functions/*`)
- [ ] Frontend migrated from Firebase Auth to Supabase Auth
- [ ] API client updated to use Supabase client
- [ ] Pages updated for new content model (access_classification)
- [ ] TypeScript compiles (`tsc --noEmit`)
- [ ] ESLint passes (`eslint .`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Environment variables documented

## Requires External Configuration

- [ ] Supabase project created
- [ ] Supabase URL and anon key added to frontend `.env`
- [ ] Database migrations executed on Supabase
- [ ] Edge Functions deployed to Supabase
- [ ] Edge Function environment variables configured
- [ ] Paystack account created and API keys obtained
- [ ] Paystack webhook URL configured in dashboard
- [ ] Paystack webhook events subscribed
- [ ] Firebase Hosting project configured
- [ ] Custom domain configured (optional)

## Requires Credentials

- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard → API settings)
- [ ] `PAYSTACK_SECRET_KEY` (Paystack dashboard → API keys)
- [ ] `PAYSTACK_WEBHOOK_SECRET` (Paystack dashboard → Webhook settings)
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Supabase dashboard)

## Requires Production Deployment

- [ ] Frontend deployed to Firebase Hosting
- [ ] Edge Functions deployed to Supabase
- [ ] Database migrations run on production Supabase project
- [ ] Paystack live mode keys configured (not test keys)
- [ ] SSL/HTTPS verified (automatic on Firebase Hosting and Supabase)

## Requires Additional Development

- [ ] Anti Control Room application (separate project)
- [ ] Automated tests (unit, integration, E2E)
- [ ] CI/CD pipeline
- [ ] Payment refund handling
- [ ] Email templates for subscription confirmations
- [ ] Content import from existing SQLite database

## Pre-Launch Verification

- [ ] Anonymous readers can view free publications
- [ ] Anonymous readers cannot access paid/restricted content
- [ ] Authenticated readers can access entitled content
- [ ] Payment initialization works (test mode)
- [ ] Webhook processing works (test mode)
- [ ] Subscription activation works
- [ ] Subscription cancellation works
- [ ] Access is revoked when entitlement is revoked
