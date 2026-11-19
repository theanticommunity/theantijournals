# Schema Overview — Anti Journal

## Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles linked to Supabase Auth |
| `categories` | Publication categories |
| `tags` | Publication tags |
| `publications` | Articles/publications content |
| `publication_categories` | Publication ↔ Category join |
| `publication_tags` | Publication ↔ Tag join |
| `newsletter_subscribers` | Newsletter email signups |
| `bookmarks` | User saved publications |
| `analytics_events` | Page views, reads, conversions |
| `settings` | Key-value configuration |
| `collections` | Groupings of publications |
| `collection_items` | Collection ↔ Publication join |
| `products` | Purchasable items (publication, collection, subscription) |
| `subscription_plans` | Recurring subscription plans |
| `payments` | Payment transactions |
| `subscriptions` | User subscription records |
| `entitlements` | Unified access grants |
| `audit_log` | Administrative operation log |

## Key Design Principles

- UUID primary keys on all tables
- `created_at` and `updated_at` timestamps on all tables
- Foreign keys with `ON DELETE CASCADE` where appropriate
- Row Level Security (RLS) enabled on all tables
- Proper indexes on foreign keys and frequently queried columns
- No hardcoded pricing — all pricing in database tables

## Seeded Data

Initial seed data includes:
- 4 categories (Essays, Observations, Opinion, Reflections)
- 2 subscription plans (Monthly ₦2,000, Yearly ₦20,000)

Publications, collections, and products must be added via Admin/Control Room or direct SQL.
