import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { authApi, bookmarkApi, membershipApi } from '@/lib/api';

type BookmarkItem = {
  id: string;
  article_id: string;
  title: string;
  slug: string;
  excerpt?: string;
  reading_time: number;
  is_premium: boolean;
  created_at: string;
};

export function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [membership, setMembership] = useState<{ membership: string; subscription_status: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'bookmarks' | 'membership'>('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    async function load() {
      try {
        const [bRes, mRes] = await Promise.all([
          bookmarkApi.list(),
          membershipApi.get(),
        ]);
        setBookmarks(bRes.data.data);
        setMembership(mRes.data.data);
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile(profile);
      setMessage({ text: 'Profile updated.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const currentPasswordEl = form.elements.namedItem('currentPassword') as HTMLInputElement | null;
    const newPasswordEl = form.elements.namedItem('newPassword') as HTMLInputElement | null;
    const currentPassword = currentPasswordEl?.value ?? '';
    const newPassword = newPasswordEl?.value ?? '';
    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setMessage({ text: 'Password changed.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Failed to change password.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleBookmark(articleId: string, currentlyBookmarked: boolean) {
    try {
      if (currentlyBookmarked) {
        await bookmarkApi.remove(articleId);
      } else {
        await bookmarkApi.create(articleId);
      }
      const res = await bookmarkApi.list();
      setBookmarks(res.data.data);
    } catch {
      alert('Failed to update bookmark');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="masthead mb-2">AntiPerson</div>
        <p className="text-secondary-grey text-sm">Loading account…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif text-white mb-2">Account</h2>
        <p className="text-secondary-grey text-sm">Manage your AntiPerson account.</p>
      </div>

      {message.text && (
        <div className={`p-4 text-xs rounded ${
          message.type === 'success' ? 'bg-green-900/10 border border-green-500/20 text-green-400' : 'bg-red-900/10 border border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-4 border-b border-white/10 pb-4">
        {(['profile', 'bookmarks', 'membership'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-sans font-medium tracking-widest uppercase py-2 border-b-2 ${
              activeTab === tab ? 'border-white text-white' : 'border-transparent text-secondary-grey hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-serif text-white mb-6">Profile</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-xl font-serif text-white mb-6">Change password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
                  Current password
                </label>
                <input
                  type="password"
                  required
                  name="currentPassword"
                  className="w-full px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
                  New password
                </label>
                <input
                  type="password"
                  required
                  name="newPassword"
                  className="w-full px-4 py-3 text-sm border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn"
              >
                {saving ? 'Saving…' : 'Change password'}
              </button>
            </form>

            <hr className="my-8 border-white/10" />

            <button
              onClick={() => { logout(); navigate('/'); }}
              className="w-full py-3 text-xs font-sans font-medium tracking-widest uppercase text-red-400 border border-red-400 hover:bg-red-400 hover:text-black transition-colors"
            >
              Delete account
            </button>
          </div>
        </div>
      )}

      {activeTab === 'bookmarks' && (
        <div>
          <h3 className="text-xl font-serif text-white mb-6">Saved publications</h3>
          {bookmarks.length === 0 ? (
            <p className="text-secondary-grey text-sm">
              You haven&apos;t bookmarked any publications yet.
            </p>
          ) : (
            <div className="space-y-4">
              {bookmarks.map((b) => (
                <div key={b.id} className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="flex-1">
                    <Link
                      to={`/articles/${b.slug}`}
                      className="text-sm font-serif text-white hover:text-secondary-grey transition-colors"
                    >
                      {b.title}
                    </Link>
                    <p className="text-[11px] font-sans tracking-widest uppercase text-secondary-grey mt-1">
                      {b.reading_time} min read · {b.is_premium ? 'Premium' : 'Free'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleBookmark(b.article_id, true)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'membership' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="border border-white/10 p-6">
            <h3 className="text-xl font-serif text-white mb-4">Membership</h3>
            <div className="mb-4">
              <span className={`px-3 py-1 text-xs font-sans font-medium rounded border ${
                membership?.membership === 'premium'
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white border-white/20'
              }`}>
                {membership?.membership ? membership.membership.charAt(0).toUpperCase() + membership.membership.slice(1) : '—'}
              </span>
            </div>
            <p className="text-secondary-grey text-sm mb-4">
              {membership?.membership === 'premium'
                ? 'You have access to premium publications.'
                : 'Free members can read free publications and subscribe to the newsletter.'}
            </p>
            <p className="text-secondary-grey text-sm">
              Subscription status: {membership?.subscription_status || '—'}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-serif text-white mb-6">Upgrade to premium</h3>
            <p className="text-secondary-grey text-sm mb-6">
              Premium membership gives you access to all premium publications, exclusive articles, and member-only content.
            </p>
            <Link to="/membership" className="btn">
              Subscribe to premium
            </Link>
          </div>
        </div>
      )}

      <div className="border-t border-white/10 pt-8">
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-2 text-xs font-sans font-medium tracking-widest uppercase text-white hover:text-secondary-grey transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}

export default AccountPage;
