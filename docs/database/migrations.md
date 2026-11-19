# Migrations — Anti Journal

## Migration Files

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Core tables: profiles, categories, tags, publications, bookmarks, newsletter, analytics, settings |
| `002_collections_and_products.sql` | Collections, collection_items, products, subscription_plans, payments, subscriptions |
| `003_entitlements_and_audit.sql` | Entitlements (unified access), audit_log |
| `004_rls_policies.sql` | Row Level Security policies on all tables |

## Execution Order

Migrations must be applied in numerical order:

```
1. 001_initial_schema.sql
2. 002_collections_and_products.sql
3. 003_entitlements_and_audit.sql
4. 004_rls_policies.sql
```

## Applying Migrations

Using Supabase SQL Editor (dashboard):
1. Open the SQL Editor in your Supabase project
2. Paste and run each migration file in order
3. Verify no errors

Using Supabase CLI:
```bash
supabase db push
```

## Migration Safety

- All migrations use `CREATE TABLE` (not `CREATE TABLE IF NOT EXISTS`) — designed for fresh application
- Re-running migrations will fail on existing tables
- For production, back up the database before applying migrations
- Test migrations on a staging project first

## Future Migrations

New migrations should be named sequentially (e.g., `005_feature_name.sql`) and added to the `supabase/migrations/` directory. Each migration should be:
- Idempotent where possible (use `IF NOT EXISTS`, `ON CONFLICT`)
- Backward compatible
- Tested on staging before production

## Rollback

Migrations do not include DOWN scripts. To roll back:
1. Export data if needed
2. Manually drop tables or restore from backup
3. Re-apply corrected migrations
