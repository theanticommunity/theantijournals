import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/api';

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function AdminDashboard() {
  const [stats, setStats] = useState<{ articles: number; categories: number; tags: number } | null>(null);
  const [recent, setRecent] = useState<{ id: string; title: string; status: string; category_name?: string; updated_at?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const [articlesRes, catsRes, tagsRes] = await Promise.all([
        adminApi.articles.list({ per_page: 5 }),
        adminApi.categories.list(),
        adminApi.tags.list(),
      ]);
      setRecent(articlesRes.data.data);
      setStats({
        articles: articlesRes.data.meta?.total ?? 0,
        categories: catsRes.data.data.length,
        tags: tagsRes.data.data.length,
      });
    } catch {
      // Ignore errors on dashboard load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loadTimeout.current) clearTimeout(loadTimeout.current);
    loadTimeout.current = setTimeout(load, 150);
    return () => { if (loadTimeout.current) clearTimeout(loadTimeout.current); };
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="masthead mb-2">AntiPerson</div>
        <p className="text-secondary-grey text-sm">Loading admin dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif text-white mb-2">Dashboard</h2>
        <p className="text-secondary-grey text-sm">Manage your publication.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <StatCard label="Total Articles" value={stats?.articles ?? 0} />
        <StatCard label="Categories" value={stats?.categories ?? 0} />
        <StatCard label="Tags" value={stats?.tags ?? 0} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-serif text-white">Recent articles</h3>
          <Link to="/admin/articles" className="text-xs font-sans font-medium tracking-widest uppercase text-white hover:text-secondary-grey">
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-white/10">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Title</th>
                <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Status</th>
                <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Category</th>
                <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Updated</th>
                <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((a) => (
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
                  <td className="py-4 text-sm text-secondary-grey">{formatDate(a.updated_at)}</td>
                  <td className="py-4 text-sm text-right">
                    <Link to={`/admin/articles/${a.id}`} className="text-xs text-secondary-grey hover:text-white transition-colors">Edit</Link>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-secondary-grey text-sm">
                    No articles yet. Create your first publication.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/admin/articles/new" className="btn">New Article</Link>
        <Link to="/admin/categories" className="btn-outline">Categories</Link>
        <Link to="/admin/tags" className="btn-outline">Tags</Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-black/20 border border-white/10 p-6 rounded-none">
      <div className="text-3xl font-serif font-bold text-white mb-1">{value}</div>
      <div className="text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">{label}</div>
    </div>
  );
}

export default AdminDashboard;