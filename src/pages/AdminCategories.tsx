import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import type { Category } from '@/types/index';

type CategoryForm = { name: string; slug: string; description: string };

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await adminApi.categories.list();
      setCategories(res.data.data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: '', slug: '', description: '' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        await adminApi.categories.update(editingId, form);
      } else {
        await adminApi.categories.create(form);
      }
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this category?')) return;
    try {
      await adminApi.categories.delete(id);
      await load();
    } catch {
      alert('Failed to delete category');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="masthead mb-2">AntiPerson</div>
        <p className="text-secondary-grey text-sm">Loading categories…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-white mb-1">Categories</h2>
          <p className="text-secondary-grey text-sm">Organise your publications by subject.</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm({ name: '', slug: '', description: '' }); }}
          className="btn"
        >
          New Category
        </button>
      </div>

      {error && (
        <div className="p-4 text-xs text-red-400 bg-red-900/10 border border-red-500/20 rounded">
          {error}
        </div>
      )}

      {editingId ? (
        <CategoryEditForm
          form={form}
          onChange={(k, v) => setForm((prev) => ({ ...prev, [k]: v }))}
          onSubmit={handleSubmit}
          onCancel={cancelEdit}
          saving={saving}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-white/10">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Name</th>
                <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Slug</th>
                <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Description</th>
                <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 text-sm text-white">{c.name}</td>
                  <td className="py-4 text-sm font-mono text-secondary-grey">{c.slug}</td>
                  <td className="py-4 text-sm text-secondary-grey">{c.description || '—'}</td>
                  <td className="py-4 text-sm text-right">
                    <button
                      onClick={() => startEdit(c)}
                      className="mr-3 text-xs text-white hover:text-secondary-grey transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-secondary-grey text-sm">
                    No categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CategoryEditForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  saving,
}: {
  form: { name: string; slug: string; description: string };
  onChange: (k: string, v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-black/20 border border-white/10 p-6 space-y-4">
      <h3 className="text-xl font-serif text-white mb-2">
        {form.name ? 'Edit' : 'New'} Category
      </h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
            Name
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white"
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
            onChange={(e) => onChange('slug', e.target.value)}
            className="w-full px-4 py-3 text-sm font-mono border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white"
          />
        </div>
        <div>
          <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
            className="w-full min-h-[80px] px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onCancel} className="btn-outline">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminCategories;