import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/api';
import type { AdminArticle } from '@/types/index';

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function AdminArticles() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [meta, setMeta] = useState<{ page: number; per_page: number; total: number; total_pages: number }>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const loadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const STATUS_OPTIONS = ['all', 'draft', 'scheduled', 'published', 'archived', 'unpublished'];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.articles.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
        page,
        per_page: 20,
      });
      setArticles(res.data.data);
      setMeta(res.data.meta);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    if (loadTimeout.current) clearTimeout(loadTimeout.current);
    loadTimeout.current = setTimeout(load, 150);
    return () => { if (loadTimeout.current) clearTimeout(loadTimeout.current); };
  }, [load]);

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    setDeletingId(id);
    try {
      await adminApi.articles.delete(id);
      setArticles(articles.filter((a) => a.id !== id));
    } catch {
      alert('Failed to delete article');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-white mb-2">Articles</h2>
          <p className="text-secondary-grey text-sm">Manage your publications.</p>
        </div>
        <Link to="/admin/articles/new" className="btn">New Article</Link>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Status</span>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1 text-xs font-sans font-medium tracking-widest border rounded transition-colors ${
                statusFilter === s
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white border-white/20 hover:border-white/50'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search articles…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border-white/10">
          <thead>
            <tr className="border-b border-white/10">
              <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Title</th>
              <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Status</th>
              <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Category</th>
              <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Premium</th>
              <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey text-right">Updated</th>
              <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-secondary-grey text-sm">
                  Loading articles…
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-secondary-grey text-sm">
                  No articles found.
                </td>
              </tr>
            ) : (
              articles.map((a) => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 text-sm text-white">
                    <Link to={`/admin/articles/${a.id}`} className="hover:text-secondary-grey transition-colors">
                      {a.title}
                    </Link>
                  </td>
                  <td className="py-4 text-sm">
                    <span className={`px-2 py-1 text-xs font-sans font-medium rounded border ${
                      a.status === 'published' ? 'border-secondary-grey text-secondary-grey' : 'border-white/20 text-white/60'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-secondary-grey">{a.category_name || '—'}</td>
                  <td className="py-4 text-sm text-center">
                    {a.is_premium ? (
                      <span className="px-2 py-1 text-xs font-sans font-medium border border-secondary-grey text-secondary-grey rounded">
                        Premium
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-sans font-medium border border-white/20 text-white/60 rounded">
                        Free
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-sm text-secondary-grey text-right">{formatDate(a.updated_at)}</td>
                  <td className="py-4 text-sm text-right">
                    <Link
                      to={`/admin/articles/${a.id}`}
                      className="mr-3 text-xs text-white hover:text-secondary-grey transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      className={`text-xs font-medium transition-colors ${
                        deletingId === a.id
                          ? 'text-secondary-grey/50'
                          : 'text-red-400 hover:text-red-300'
                      }`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta.total_pages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="text-xs font-sans font-medium tracking-widest text-white opacity-50 disabled:opacity-20 hover:opacity-100 transition-opacity"
          >
            ← Previous
          </button>
          <span className="text-xs font-sans font-medium tracking-widest text-secondary-grey">
            Page {page} of {meta.total_pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === meta.total_pages}
            className="text-xs font-sans font-medium tracking-widest text-white opacity-50 disabled:opacity-20 hover:opacity-100 transition-opacity"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminArticles;