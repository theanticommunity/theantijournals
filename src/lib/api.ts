const API_BASE = import.meta.env.VITE_API_BASE || '/api';

class ApiClient {
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = new URL(`${API_BASE}${path}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        url.searchParams.set(key, String(value));
      });
    }
    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  }
}

export const api = new ApiClient();

async function getIdToken(): Promise<string> {
  const { auth } = await import('@/firebase/config');
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

// Article endpoints
export const articleApi = {
  list: (filters?: Record<string, string | number | boolean>) => api.get('/articles', filters),
  get: (slug: string) => api.get(`/articles/${encodeURIComponent(slug)}`),
};

// Category endpoints
export const categoryApi = {
  list: () => api.get('/categories'),
};

// Tag endpoints
export const tagApi = {
  list: () => api.get('/tags'),
};

// Search endpoint
export const searchApi = {
  search: (q: string) => api.get('/search', { q }),
};

// Auth endpoints
export const authApi = {
  me: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${await getIdToken()}` },
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },
  updateProfile: async (body: { full_name: string }) => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getIdToken()}`,
      },
      body: JSON.stringify({ name: body.full_name }),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },
  deleteAccount: async () => {
    const res = await fetch(`${API_BASE}/auth/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${await getIdToken()}` },
    });
    if (!res.ok) throw new Error('Failed to delete account');
    return res.json();
  },
};

// Bookmark endpoints
export const bookmarkApi = {
  list: async () => {
    const res = await fetch(`${API_BASE}/bookmarks`, {
      headers: { Authorization: `Bearer ${await getIdToken()}` },
    });
    if (!res.ok) throw new Error('Failed to load bookmarks');
    return res.json();
  },
  create: async (article_id: string) => {
    const res = await fetch(`${API_BASE}/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getIdToken()}`,
      },
      body: JSON.stringify({ article_id }),
    });
    if (!res.ok) throw new Error('Failed to bookmark');
    return res.json();
  },
  remove: async (article_id: string) => {
    const res = await fetch(`${API_BASE}/bookmarks/${encodeURIComponent(article_id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${await getIdToken()}` },
    });
    if (!res.ok) throw new Error('Failed to remove bookmark');
    return res.json();
  },
  check: async (article_id: string) => {
    const res = await fetch(`${API_BASE}/bookmarks/check/${encodeURIComponent(article_id)}`, {
      headers: { Authorization: `Bearer ${await getIdToken()}` },
    });
    if (!res.ok) throw new Error('Failed to check bookmark');
    return res.json();
  },
};

// Membership endpoint
export const membershipApi = {
  get: async () => {
    const res = await fetch(`${API_BASE}/membership`, {
      headers: { Authorization: `Bearer ${await getIdToken()}` },
    });
    if (!res.ok) throw new Error('Failed to load membership');
    return res.json();
  },
};

// Newsletter endpoints
export const newsletterApi = {
  subscribe: (body: { email: string }) => api.request('/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  verify: (body: { token: string }) => api.request('/newsletter/verify', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  unsubscribe: (body: { email: string }) => api.request('/newsletter/unsubscribe', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
};

// Payments endpoints
export const paymentApi = {
  createSubscription: async (body: { plan: string; email: string }) => {
    const res = await fetch(`${API_BASE}/payments/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getIdToken()}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Subscription initialization failed');
    return res.json();
  },
  createPurchase: async (body: { article_id: string; email: string }) => {
    const res = await fetch(`${API_BASE}/payments/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Purchase initialization failed');
    return res.json();
  },
  verify: async (reference: string) => {
    const res = await fetch(`${API_BASE}/payments/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${await getIdToken()}` },
    });
    if (!res.ok) throw new Error('Verification failed');
    return res.json();
  },
  history: async () => {
    const res = await fetch(`${API_BASE}/payments/history`, {
      headers: { Authorization: `Bearer ${await getIdToken()}` },
    });
    if (!res.ok) throw new Error('Failed to load payment history');
    return res.json();
  },
};

// Analytics endpoint
export const analyticsApi = {
  track: async (body: { event_type: string; article_id?: string; user_id?: string; session_id?: string }) => {
    const res = await fetch(`${API_BASE}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to record event');
    return res.json();
  },
};
