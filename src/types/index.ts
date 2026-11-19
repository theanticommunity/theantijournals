export type Article = {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  description?: string;
  excerpt?: string;
  cover_image?: string;
  content: string;
  author_id: string;
  author_name?: string;
  author_email?: string;
  author_full_name?: string;
  category_name?: string;
  categories?: { id: string; name: string; slug: string }[];
  tags?: Tag[];
  status: 'draft' | 'scheduled' | 'published' | 'archived' | 'unpublished';
  access_classification?: 'free' | 'paid_individual' | 'subscriber_exclusive' | 'restricted';
  published_at?: string;
  last_modified_at: string;
  reading_time: number;
  view_count: number;
  seo_title?: string;
  seo_description?: string;
  is_premium?: boolean;
  preview_length?: number;
  featured_image?: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

export type Author = {
  id: string;
  name: string;
  slug: string;
  bio?: string;
};

export type User = {
  id: string;
  email: string;
  full_name?: string;
  role: 'member' | 'admin';
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  role: 'member' | 'admin';
  created_at: string;
  updated_at: string;
};

export type Collection = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  cover_image?: string;
  status: 'draft' | 'published' | 'unpublished';
  price: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type CollectionItem = {
  collection_id: string;
  publication_id: string;
  position: number;
  added_at: string;
  publications?: Article;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  interval_count: number;
  paystack_plan_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Entitlement = {
  id: string;
  user_id: string;
  type: 'publication_purchase' | 'collection_purchase' | 'subscription' | 'admin_assigned' | 'promotional';
  target_type: 'publication' | 'collection' | 'plan';
  target_id: string;
  granted_by?: string;
  expires_at?: string;
  created_at: string;
  revoked_at?: string;
  revoked_by?: string;
};

export type Payment = {
  id: string;
  user_id?: string;
  type: 'publication' | 'collection' | 'subscription';
  reference_id: string;
  paystack_reference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  verified: boolean;
  created_at: string;
};

export type PaginationMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type ApiResponse<T> = {
  data: T;
  meta?: PaginationMeta;
  error?: string;
};

export type ArticleFilters = {
  category?: string;
  tag?: string;
  author?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'popular';
  access_classification?: 'free' | 'paid_individual' | 'subscriber_exclusive' | 'restricted';
  page?: number;
  per_page?: number;
};

export type Bookmark = {
  id: string;
  user_id: string;
  publication_id: string;
  created_at: string;
};
