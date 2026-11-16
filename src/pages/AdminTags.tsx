import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import type { Tag } from '@/types/index';

type TagForm = { name: string; slug: string };

export function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TagForm>({ name: '', slug: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await adminApi.tags.list();
      setTags(res.data.data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setForm({ name: tag.name, slug: tag.slug });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: '', slug: '' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        await adminApi.tags.update(editingId, form);
      } else {
        await adminApi.tags.create(form);
      }
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tag');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this tag?')) return;
    try {
      await adminApi.tags.delete(id);
      await load();
    } catch {
      alert('Failed to delete tag');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="masthead mb-2">AntiPerson</div>
        <p className="text-secondary-grey text-sm">Loading tags…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-white mb-1">Tags</h2>
          <p className="text-secondary-grey text-sm">Tag your publications for discovery.</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm({ name: '', slug: '' }); }}
          className="btn"
        >
          New Tag
        </button>
      </div>

      {error && (
        <div className="p-4 text-xs text-red-400 bg-red-900/10 border border-red-500/20 rounded">
          {error}
        </div>
      )}

      {editingId ? (
        <TagEditForm
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
                <th className="pb-3 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 text-sm text-white">{t.name}</td>
                  <td className="py-4 text-sm font-mono text-secondary-grey">{t.slug}</td>
                  <td className="py-4 text-sm text-right">
                    <button
                      onClick={() => startEdit(t)}
                      className="mr-3 text-xs text-white hover:text-secondary-grey transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {tags.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-secondary-grey text-sm">
                    No tags yet.
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

function TagEditForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  saving,
}: {
  form: { name: string; slug: string };
  onChange: (k: string, v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-black/20 border border-white/10 p-6 space-y-4">
      <h3 className="text-xl font-serif text-white mb-2">
        {form.name ? 'Edit' : 'New'} Tag
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

export default AdminTags;