export type Article = {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  author_id: string;
  author_name: string;
  category_id?: string;
  category_name?: string;
  tags: Tag[];
  status: 'draft' | 'scheduled' | 'published' | 'archived' | 'unpublished';
  published_at?: string;
  updated_at: string;
  reading_time: number;
  is_premium: boolean;
  preview_length?: number;
  seo_title?: string;
  seo_description?: string;
  view_count: number;
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
  name: string;
  role: 'member' | 'admin';
  membership: 'free' | 'premium';
  subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing';
  created_at: string;
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
  premium?: boolean;
  page?: number;
  per_page?: number;
};

export type Bookmark = {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
};

export type AdminArticle = Omit<Article, 'tags'> & {
  tags: Tag[];
  author_id?: string;
};

export type AdminListResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type AdminItemResponse<T> = {
  data: T;
};
