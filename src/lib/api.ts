import type {
  Article, ArticleFilters, ApiResponse, User, Category, Tag,
  AdminArticle, AdminListResponse, AdminItemResponse,
} from '@/types/index';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string, params?: ArticleFilters | Record<string, string | number>) {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params as Record<string, string | number | boolean>).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url = `${endpoint}?${searchParams.toString()}`;
    }
    return this.request<T>(url);
  }

  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

// Article endpoints
export const articleApi = {
  list: (filters?: ArticleFilters) => api.get<Article[]>('/articles', filters),
  get: (slug: string) => api.get<Article>(`/articles/${slug}`),
  create: (body: unknown) => api.post<Article>('/admin/articles', body),
  update: (id: string, body: unknown) => api.put<Article>(`/admin/articles/${id}`, body),
  delete: (id: string) => api.delete(`/admin/articles/${id}`),
};

// Category endpoints
export const categoryApi = {
  list: () => api.get<Category[]>('/categories'),
};

// Tag endpoints
export const tagApi = {
  list: () => api.get<Tag[]>('/tags'),
};

// Auth endpoints
export const authApi = {
  register: (body: { email: string; password: string; name: string }) =>
    api.post<User>('/auth/register', body),
  login: (body: { email: string; password: string }) =>
    api.post<User>('/auth/login', body),
  logout: () => api.post('/auth/logout', {}),
  me: () => api.get<User>('/auth/me'),
  resetPassword: (body: { email: string }) =>
    api.post('/auth/password-reset', body),
  updateProfile: (body: { name: string; email: string }) =>
    api.put<User>('/auth/profile', body),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.post<{ data: { ok: boolean } }>('/auth/change-password', body),
};

// Bookmark endpoints
export const bookmarkApi = {
  list: () => api.get<{ data: { id: string; article_id: string; title: string; slug: string; excerpt?: string; reading_time: number; is_premium: boolean; created_at: string }[] }>('/bookmarks'),
  create: (article_id: string) => api.post<{ data: { id: string } }>('/bookmarks', { article_id }),
  remove: (article_id: string) => api.delete<{ data: { ok: boolean } }>(`/bookmarks/${article_id}`),
  check: (article_id: string) => api.get<{ data: { bookmarked: boolean } }>(`/bookmarks/check/${article_id}`),
};

// Membership endpoint
export const membershipApi = {
  get: () => api.get<{ data: { membership: string; subscription_status: string | null } }>('/membership'),
};

// Analytics endpoint
export const analyticsApi = {
  track: (body: { event_type: string; article_id?: string; user_id?: string; session_id?: string; ip?: string; user_agent?: string; referrer?: string }) =>
    api.post('/analytics', body),
};

// Newsletter endpoints
export const newsletterApi = {
  subscribe: (body: { email: string }) => api.post('/newsletter/subscribe', body),
  verify: (body: { token: string }) => api.post('/newsletter/verify', body),
  unsubscribe: (body: { token: string }) => api.post('/newsletter/unsubscribe', body),
};

// Search
export const searchApi = {
  search: (q: string) => api.get<Article[]>('/search', { q }),
};

// Payments
export const paymentApi = {
  createSubscription: (body: { plan: string; email: string }) =>
    api.post<{ data: { authorization_url: string; reference: string } }>('/payments/subscription', body),
  createPurchase: (body: { article_id: string; email: string }) =>
    api.post<{ data: { authorization_url: string; reference: string } }>('/payments/purchase', body),
  verify: (reference: string) =>
    api.get<{ data: { status: string; reference: string; metadata: Record<string, unknown>; amount: number; paid: boolean } }>(`/payments/verify/${reference}`),
};

// Admin endpoints
export const adminApi = {
  articles: {
    list: (params?: { status?: string; search?: string; page?: number; per_page?: number }) =>
      api.get<AdminListResponse<AdminArticle>>('/admin/articles', params),
    get: (id: string) => api.get<AdminItemResponse<AdminArticle>>(`/admin/articles/${id}`),
    create: (body: unknown) => api.post<AdminItemResponse<{ id: string }>>('/admin/articles', body),
    update: (id: string, body: unknown) => api.put<AdminItemResponse<{ ok: boolean }>>(`/admin/articles/${id}`, body),
    delete: (id: string) => api.delete<AdminItemResponse<{ ok: boolean }>>(`/admin/articles/${id}`),
  },
  categories: {
    list: () => api.get<AdminListResponse<Category>>('/admin/categories'),
    create: (body: unknown) => api.post<AdminItemResponse<{ id: string }>>('/admin/categories', body),
    update: (id: string, body: unknown) => api.put<AdminItemResponse<{ ok: boolean }>>(`/admin/categories/${id}`, body),
    delete: (id: string) => api.delete<AdminItemResponse<{ ok: boolean }>>(`/admin/categories/${id}`),
  },
  tags: {
    list: () => api.get<AdminListResponse<Tag>>('/admin/tags'),
    create: (body: unknown) => api.post<AdminItemResponse<{ id: string }>>('/admin/tags', body),
    update: (id: string, body: unknown) => api.put<AdminItemResponse<{ ok: boolean }>>(`/admin/tags/${id}`, body),
    delete: (id: string) => api.delete<AdminItemResponse<{ ok: boolean }>>(`/admin/tags/${id}`),
  },
};
