# Relationships — Anti Journal

## Entity Relationships

```
profiles 1───∞ publications (author)
profiles 1───∞ bookmarks
profiles 1───∞ subscriptions
profiles 1───∞ payments
profiles 1───∞ entitlements
profiles 1───∞ audit_log (actor)

categories 1───∞ publication_categories ∞───1 publications
tags 1───∞ publication_tags ∞───1 publications

publications 1───∞ publication_categories
publications 1───∞ publication_tags
publications 1───∞ bookmarks
publications 1───∞ analytics_events
publications 1───∞ collection_items
publications 1───∞ products (type='publication')

collections 1───∞ collection_items
collections 1───∞ products (type='collection')

subscription_plans 1───∞ subscriptions
subscription_plans 1───∞ products (type='subscription')

products 1───∞ payments (via reference_id)

payments 1───∞ entitlements (via metadata)
subscriptions 1───∞ entitlements (type='subscription')
```

## Cardinality

| Relationship | Type | Constraint |
|-------------|------|------------|
| Author → Publications | 1:N | `author_id` FK, ON DELETE CASCADE |
| Category → Publication_Categories | 1:N | `category_id` FK, ON DELETE CASCADE |
| Tag → Publication_Tags | 1:N | `tag_id` FK, ON DELETE CASCADE |
| Publication → Publication_Categories | 1:N | `publication_id` FK, ON DELETE CASCADE |
| Publication → Publication_Tags | 1:N | `publication_id` FK, ON DELETE CASCADE |
| Publication → Bookmarks | 1:N | `publication_id` FK, ON DELETE CASCADE |
| Profile → Bookmarks | 1:N | `user_id` FK, ON DELETE CASCADE |
| Collection → Collection_Items | 1:N | `collection_id` FK, ON DELETE CASCADE |
| Publication → Collection_Items | 1:N | `publication_id` FK, ON DELETE CASCADE |
| Subscription Plan → Subscriptions | 1:N | `plan_id` FK, ON DELETE CASCADE |
| Profile → Subscriptions | 1:N | `user_id` FK, ON DELETE CASCADE |
| Profile → Entitlements | 1:N | `user_id` FK, ON DELETE CASCADE |
| Profile → Payments | 1:N | `user_id` FK, ON DELETE SET NULL |

## Unique Constraints

- `categories.slug` — unique
- `tags.slug` — unique
- `publications.slug` — unique
- `collections.slug` — unique
- `subscription_plans.slug` — unique
- `publication_categories (publication_id, category_id)` — composite PK
- `publication_tags (publication_id, tag_id)` — composite PK
- `collection_items (collection_id, publication_id)` — composite PK
- `bookmarks (user_id, publication_id)` — unique
- `products.paystack_reference` — unique (on payments table)
- `newsletter_subscribers.email` — unique

## Indexes

Indexes exist on all foreign keys, slugs, status fields, and frequently filtered columns (see migration files for details).
