# Authentication — Anti Journal

## Overview

Anti Journal uses Supabase Auth for user authentication. Anti Control Room is a separate application with its own admin accounts in the same Supabase project.

## Supabase Auth Configuration

### Providers

| Provider | Enabled | Use Case |
|----------|---------|----------|
| Email/Password | Yes | Reader signup/login |
| OAuth (Google, etc.) | Optional | Future social login |
| Magic Link | Optional | Passwordless login |

### User Flow

1. Reader signs up with email/password
2. Supabase sends confirmation email (if email confirmations enabled)
3. Reader confirms email, can now sign in
4. On sign-in, Supabase returns JWT session
5. Frontend stores session, creates/updates `public.profiles` row
6. JWT included in all subsequent requests

### Profile Creation

When a user signs up:
- `auth.users` record created by Supabase Auth
- Frontend (or Edge Function) inserts into `public.profiles`:
  - `id = auth.users.id`
  - `email = auth.users.email`
  - `full_name` from signup form
  - `role = 'member'`
- Row Level Security allows insert only for `auth.uid()`

## Admin Authentication (Anti Control Room)

- Admin accounts also use Supabase Auth
- `public.profiles.role = 'admin'` distinguishes admin accounts
- Admin signs in via Control Room login page
- JWT includes user claims; RLS policies check `role = 'admin'`

## Token Usage

| Context | Token Source | Usage |
|---------|-------------|-------|
| Anti Journal frontend | `supabase.auth.getSession()` | Attached to Edge Function calls |
| Anti Journal Edge Function | `req.headers.authorization` | Verified by Supabase client |
| Anti Control Room frontend | `supabase.auth.getSession()` | Attached to admin API calls |
| Control Room backend | `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS for admin ops |
| Paystack webhook | HMAC signature | Not JWT-based |

## Session Management

- Supabase handles session persistence (localStorage/cookies)
- Token refresh automatic via Supabase client
- Sign-out clears session and profile state

## RLS Authentication

All RLS policies use `auth.uid()` and `auth.jwt()`:
- `auth.uid()` returns the authenticated user's UUID
- Anonymous requests have `auth.uid() = NULL`
- Policies can check `auth.jwt()->>'role'` or custom claims

## No Firebase Auth

The existing Firebase Auth implementation is being replaced:
- Firebase SDK removed from frontend
- Firebase Admin SDK removed from backend
- Supabase Auth handles all authentication
- Existing Firebase users would need to migrate (invite to new Supabase project or re-register)
