# Content Model — Anti Journal

## Publication Model

### Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | UUID | No | Primary key |
| title | text | No | Publication title |
| slug | text | No | Unique URL slug |
| author_id | UUID | No | References `public.profiles.id` |
| description | text | Yes | Excerpt/blurb |
| cover_image | text | Yes | Supabase Storage path or URL |
| content | text | No | Main body (HTML) |
| published_at | timestamptz | Yes | Publication date |
| last_modified_at | timestamptz | No | Auto-updated on change |
| status | text | No | draft, scheduled, published, archived, unpublished |
| access_classification | text | No | free, paid_individual, subscriber_exclusive, restricted |
| categories | UUID[] | Yes | References `public.categories.id` |
| tags | UUID[] | Yes | References `public.tags.id` |
| seo_title | text | Yes | SEO title override |
| seo_description | text | Yes | SEO description override |
| reading_time | integer | No | Default 0 (minutes) |
| view_count | integer | No | Default 0 |

### Access Classification

| Classification | Public Access | Purchase Required | Subscription Required | Admin Assignment |
|---------------|--------------|-------------------|----------------------|------------------|
| `free` | Yes | No | No | No |
| `paid_individual` | No | Yes | Yes (alternative) | Yes (alternative) |
| `subscriber_exclusive` | No | No | Yes | Yes (alternative) |
| `restricted` | No | No | No | Yes (only) |
| `draft` | No | No | No | Admin only |
| `scheduled` | No (until date) | Per classification | Per classification | Per classification |

### Status Lifecycle

```
draft → scheduled → published → archived/unpublished
       ↑           ↓
       └───────────┘ (scheduled auto-publishes at published_at)
```

- `draft`: Not visible to public; admin can edit
- `scheduled`: Not visible until `published_at`; then behaves per `access_classification`
- `published`: Visible per access classification rules
- `archived`: Removed from public view but retained
- `unpublished`: Removed from public view, can be republished

### Content Flexibility

Access classification can be changed without duplicating content. Example:
- Article starts as `subscriber_exclusive`
- Later changed to `free` — all readers can now access it
- Existing entitlements for that article remain but are no longer required

## Categories

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | UUID | No | Primary key |
| name | text | No | Category name |
| slug | text | No | Unique URL slug |
| description | text | Yes | Category description |
| created_at | timestamptz | No | |

## Tags

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | UUID | No | Primary key |
| name | text | No | Tag name |
| slug | text | No | Unique URL slug |
| created_at | timestamptz | No | |

## Publication-Category Relationship

Many-to-many via `public.publication_categories`:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| publication_id | UUID | No | References publications |
| category_id | UUID | No | References categories |

## Publication-Tag Relationship

Many-to-many via `public.publication_tags`:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| publication_id | UUID | No | References publications |
| tag_id | UUID | No | References tags |

## Authors

Author information lives in `public.profiles` (Supabase Auth-linked):

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | UUID | No | References `auth.users.id` |
| email | text | No | From auth.users |
| full_name | text | Yes | Display name |
| avatar_url | text | Yes | Supabase Storage path |
| bio | text | Yes | Author biography |
| role | text | No | 'member' or 'admin' |
| created_at | timestamptz | No | |

## Preserved Functionality

From the existing implementation, the following content capabilities are preserved:

- Article listing with pagination, filtering (category, tag, search), sorting
- Single article display with full content
- SEO metadata (seo_title, seo_description, Open Graph, JSON-LD)
- Reading time, view count
- Featured/cover image
- Author attribution
- Premium preview (`preview_length` concept — now handled by access classification + entitlement)

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| publications | `slug` (unique) | URL lookup |
| publications | `status` | Published filtering |
| publications | `access_classification` | Access filtering |
| publications | `published_at` | Sorting by date |
| publications | `author_id` | Author lookup |
| publication_categories | `(publication_id, category_id)` | Many-to-many lookup |
| publication_tags | `(publication_id, tag_id)` | Many-to-many lookup |
| categories | `slug` (unique) | URL lookup |
| tags | `slug` (unique) | URL lookup |
