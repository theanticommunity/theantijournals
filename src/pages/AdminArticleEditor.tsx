import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { adminApi, categoryApi, tagApi } from '@/lib/api';
import type { Category, Tag } from '@/types/index';

export function AdminArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '', subtitle: '', slug: '', content: '', excerpt: '',
    featured_image: '', author_id: '', category_id: '', status: 'draft',
    published_at: '', reading_time: '', is_premium: false, preview_length: '',
    seo_title: '', seo_description: '', tags: [] as string[],
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    adminApi.articles.get(id!).then(({ data }) => {
      if (cancelled) return;
      const a = data.data;
      setForm({
        title: a.title || '', subtitle: a.subtitle || '', slug: a.slug || '',
        content: a.content || '', excerpt: a.excerpt || '',
        featured_image: a.featured_image || '', author_id: a.author_id || '',
        category_id: a.category_id || '', status: a.status || 'draft',
        published_at: a.published_at || '', reading_time: a.reading_time ? String(a.reading_time) : '',
        is_premium: !!a.is_premium, preview_length: a.preview_length ? String(a.preview_length) : '',
        seo_title: a.seo_title || '', seo_description: a.seo_description || '',
        tags: (a.tags || []).map((t: { id: string }) => t.id),
      });
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [id, isNew]);

  useEffect(() => {
    let cancelled = false;
    categoryApi.list().then(({ data }) => { if (!cancelled) setCategories(data); });
    tagApi.list().then(({ data }) => { if (!cancelled) setTags(data); });
    return () => { cancelled = true; };
  }, []);

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleTag(tagId: string) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((t) => t !== tagId)
        : [...prev.tags, tagId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const body = {
        title: form.title, subtitle: form.subtitle, slug: form.slug,
        content: form.content, excerpt: form.excerpt,
        featured_image: form.featured_image || undefined,
        author_id: form.author_id || undefined,
        category_id: form.category_id || undefined,
        status: form.status,
        published_at: form.published_at || undefined,
        reading_time: form.reading_time ? parseInt(form.reading_time) : undefined,
        is_premium: form.is_premium,
        preview_length: form.preview_length ? parseInt(form.preview_length) : undefined,
        seo_title: form.seo_title || undefined,
        seo_description: form.seo_description || undefined,
        tags: form.tags,
      };

      if (isNew) {
        await adminApi.articles.create(body);
      } else {
        await adminApi.articles.update(id!, body);
      }
      navigate('/admin/articles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="masthead mb-2">AntiPerson</div>
        <p className="text-secondary-grey text-sm">Loading editor…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-white mb-1">
            {isNew ? 'New Article' : 'Edit Article'}
          </h2>
          <p className="text-secondary-grey text-sm">
            {isNew ? 'Create a new publication.' : 'Edit an existing publication.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn"
          >
            {saving ? 'Saving…' : 'Publish / Save'}
          </button>
          <Link to="/admin/articles" className="btn-outline">Cancel</Link>
        </div>
      </div>

      {error && (
        <div className="p-4 text-xs text-red-400 bg-red-900/10 border border-red-500/20 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
              Title
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white placeholder-white/30"
              placeholder="Article title"
            />
          </div>

          <div>
            <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
              Subtitle / Intro
            </label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              className="w-full px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white placeholder-white/30"
              placeholder="Subtitle"
            />
          </div>

          <div>
            <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
              Slug
            </label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              className="w-full px-4 py-3 text-sm font-mono border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white placeholder-white/30"
              placeholder="article-slug"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
              Body content (HTML)
            </label>
            <textarea
              required
              value={form.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className="w-full min-h-[400px] px-4 py-3 text-sm font-mono border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white placeholder-white/30"
              placeholder="Write your article content here…"
            />
          </div>

          <div>
            <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
              Excerpt
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => handleChange('excerpt', e.target.value)}
              className="w-full min-h-[100px] px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white placeholder-white/30"
              placeholder="Brief excerpt for listings"
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>

          <div className="space-y-4">
            <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey">
              Category
            </label>
            <select
              value={form.category_id}
              onChange={(e) => handleChange('category_id', e.target.value)}
              className="w-full px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  className={`px-3 py-1 text-xs font-sans font-medium tracking-widest border rounded transition-colors ${
                    form.tags.includes(t.id)
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-white border-white/20 hover:border-white/50'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.is_premium}
                onChange={(e) => handleChange('is_premium', e.target.checked)}
                className="w-4 h-4 border-white/20 text-white bg-black/20 border border-white/20 rounded focus:ring-1 focus:ring-white"
              />
              <label className="text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey cursor-pointer">
                Premium content
              </label>
            </div>
            {form.is_premium && (
              <>
                <div>
                  <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
                    Preview length (chars)
                  </label>
                  <input
                    type="number"
                    value={form.preview_length}
                    onChange={(e) => handleChange('preview_length', e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
              Featured image URL
            </label>
            <input
              type="text"
              value={form.featured_image}
              onChange={(e) => handleChange('featured_image', e.target.value)}
              className="w-full px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white placeholder-white/30"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
              SEO title
            </label>
            <input
              type="text"
              value={form.seo_title}
              onChange={(e) => handleChange('seo_title', e.target.value)}
              className="w-full px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white placeholder-white/30"
              placeholder="SEO title"
            />
            <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2 mt-4">
              SEO description
            </label>
            <textarea
              value={form.seo_description}
              onChange={(e) => handleChange('seo_description', e.target.value)}
              className="w-full min-h-[80px] px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white placeholder-white/30"
              placeholder="SEO description"
            />
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminArticleEditor;