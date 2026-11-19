# Collections Model — Anti Journal

## Collections Table

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | UUID | No | Primary key |
| title | text | No | Collection title |
| slug | text | No | Unique URL slug |
| description | text | Yes | Collection description |
| cover_image | text | Yes | Supabase Storage path or URL |
| status | text | No | draft, published, unpublished |
| price | integer | No | Default 0 (price in kobo, 0 = free) |
| currency | text | No | Default 'NGN' |
| created_at | timestamptz | No | |
| updated_at | timestamptz | No | |

### Collection Status

| Status | Description |
|--------|-------------|
| `draft` | Not visible to public; admin can edit |
| `published` | Visible to public per pricing |
| `unpublished` | Removed from public view |

## Collection-Publication Relationship

### `collection_items` Join Table

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| collection_id | UUID | No | References `collections.id` |
| publication_id | UUID | No | References `publications.id` |
| position | integer | No | Display order within collection |
| added_at | timestamptz | No | |

### Key Rules

- **Composite primary key:** `(collection_id, publication_id)`
- **No duplication:** A publication record exists once; it can appear in multiple collections via separate join rows
- **Position enables reordering:** Collections can order their contents independently
- **Cascade delete:** Removing a collection deletes its `collection_items` rows but not the publications
- **Removing a publication from a collection:** Deletes the join row only; publication remains in other collections

## Collection Pricing

| Price | Meaning |
|-------|---------|
| `0` | Free collection (anyone can access) |
| `>0` | Paid collection (purchase required) |

Price is stored in kobo (e.g., 50000 = ₦500).

## Collection Access

Access to a collection means access to **all publications in that collection**:

| Collection Price | Access Condition |
|------------------|------------------|
| Free (`0`) | Public access (no entitlement needed) |
| Paid (`>0`) | Entitlement: type=`collection_purchase`, target=`collection_id`, not revoked, not expired |
| Paid + Subscription | Active subscription may grant access if plan includes collection |

## Collection Products

Each collection has a corresponding row in `public.products`:
- `type = 'collection'`
- `reference_id = collection.id`
- `price` matches collection price

## Operations Supported

| Operation | Description |
|-----------|-------------|
| Create collection | INSERT into `collections`, create corresponding `products` row |
| Edit collection | UPDATE `collections` |
| Publish collection | SET `status = 'published'` |
| Unpublish collection | SET `status = 'unpublished'` |
| Add publication | INSERT into `collection_items` |
| Remove publication | DELETE from `collection_items` |
| Reorder contents | UPDATE `position` values |
| Display cover + description | Read from `collections` |
| Configure pricing | UPDATE `price` on `collections` + `products` |
| Free or paid | Set `price` to 0 or >0 |
| Grant collection access | INSERT entitlement type=`collection_purchase` |

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| collections | `slug` (unique) | URL lookup |
| collections | `status` | Published filtering |
| collection_items | `(collection_id, publication_id)` (PK) | Lookup by both |
| collection_items | `publication_id` | Find collections containing a publication |
| collection_items | `position` | Ordering within collection |

## Relationship to Publications

- A publication can belong to **zero, one, or many collections**
- A collection contains **zero or many publications**
- No publication record is duplicated when added to multiple collections
- Collection access is independent of individual publication access:
  - Buying a collection grants access to all its publications
  - Buying an individual publication does NOT grant access to collections containing it
