import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articleApi, categoryApi, newsletterApi } from '@/lib/api';
import type { Article } from '@/types/index';

function ReadingTime({ minutes }: { minutes: number }) {
  return <span className="text-[10px] font-sans font-medium tracking-widest uppercase text-secondary-grey">{minutes} min read</span>;
}

export function Homepage() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [featured, setFeatured] = useState<Article | null>(null);
  const [recent, setRecent] = useState<Article[]>([]);
  const [popular, setPopular] = useState<Article[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    articleApi.list({ sort: 'newest', per_page: 6 }).then((res: any) => {
      const data = res.data || [];
      if (mounted) {
        setFeatured(data[0] || null);
        setRecent(data.slice(1, 4));
      }
    });
    articleApi.list({ sort: 'popular', per_page: 4 }).then((res: any) => {
      if (mounted) setPopular(res.data || []);
    });
    categoryApi.list().then((res: any) => {
      if (mounted) setCategories(res.data || []);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    try {
      await newsletterApi.subscribe({ email: newsletterEmail });
      setNewsletterStatus('success');
    } catch {
      setNewsletterStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="masthead mb-2">AntiJournals</div>
      </div>
    );
  }

  const editorsSelection = recent;

  return (
    <div className="bg-white">
      <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="masthead mb-1">AntiJournals</div>
            <div className="masthead-sub">Independent publication</div>
          </div>

          {featured && (
            <article className="relative">
              <div className="absolute inset-0 bg-secondary-grey/5"></div>
              <h1 className="text-balance mb-6">{featured.title}</h1>
              <p className="text-xl md:text-2xl text-secondary-grey leading-relaxed mb-8 max-w-2xl">
                {featured.subtitle || ''}
              </p>
              <div className="flex items-center gap-4 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">
                <span>{featured.author_name}</span>
                <span>·</span>
                <ReadingTime minutes={featured.reading_time} />
                <span>·</span>
                <time>{new Date(featured.published_at!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
              </div>
              <Link
                to={`/articles/${featured.slug}`}
                className="mt-8 inline-block btn"
              >
                Read publication
              </Link>
            </article>
          )}
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-serif text-black mb-2">Recently published</h2>
              <p className="text-secondary-grey text-sm">New writing from AntiJournals</p>
            </div>
            <Link
              to="/archive"
              className="text-xs font-sans font-medium tracking-widest uppercase text-black hover:text-secondary-grey transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recent.map((article) => (
              <article key={article.id} className="article-card group">
                <div className="mb-4">
                  <h3 className="text-xl font-serif text-black leading-tight group-hover:text-secondary-grey transition-colors mb-2">
                    {article.title}
                  </h3>
                    <p className="text-secondary-grey text-sm leading-relaxed line-clamp-3">
                      {article.excerpt || ''}
                    </p>
                </div>
                <div className="pt-4 border-t border-black/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-sans font-medium tracking-widest uppercase text-secondary-grey">
                      <span>{new Date(article.published_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span>·</span>
                      <ReadingTime minutes={article.reading_time} />
                    </div>
                    <Link
                      to={`/articles/${article.slug}`}
                      className="text-[10px] font-sans font-medium tracking-widest uppercase text-black underline decoration-1/40 underline-offset-2 hover:decoration-black/80"
                    >
                      Read
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-light-grey px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-serif text-black mb-2">Editor&apos;s selection</h2>
            <p className="text-secondary-grey text-sm">Writing the editors return to.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {editorsSelection.map((article) => (
              <article key={article.id} className="group">
                <div className="mb-4">
                  <h3 className="text-lg font-serif text-black leading-tight group-hover:text-secondary-grey transition-colors mb-2">
                    {article.title}
                  </h3>
                  <p className="text-secondary-grey text-sm leading-relaxed line-clamp-2">
                    {article.excerpt || ''}
                  </p>
                </div>
                <div className="pt-4 border-t border-black/10">
                  <span className="text-[10px] font-sans font-medium tracking-widest uppercase text-secondary-grey">
                    {article.reading_time} min read
                  </span>
                  <Link
                    to={`/articles/${article.slug}`}
                    className="text-[10px] font-sans font-medium tracking-widest uppercase text-black underline decoration-1/40 underline-offset-2 hover:decoration-black/80"
                  >
                    Read
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-serif text-black mb-2">Most read</h2>
            <p className="text-secondary-grey text-sm">What readers are engaging with now.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {popular.map((article) => (
              <article key={article.id} className="article-card group flex items-center gap-6">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-black text-white text-xs font-sans font-bold">
                  {popular.indexOf(article) + 1}
                </div>
                <div>
                  <h3 className="text-lg font-serif text-black leading-tight group-hover:text-secondary-grey transition-colors mb-1">
                    {article.title}
                  </h3>
                  <p className="text-secondary-grey text-sm">{new Date(article.published_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {article.reading_time} min read</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-light-grey px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-serif text-black mb-2">Categories</h2>
            <p className="text-secondary-grey text-sm">Explore by subject.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/archive?category=${cat.slug}`}
                className="group p-6 border border-black/10 hover:border-black/50 transition-colors"
              >
                <h3 className="text-lg font-serif text-black group-hover:text-secondary-grey transition-colors mb-1">
                  {cat.name}
                </h3>
                <p className="text-[10px] font-sans font-medium tracking-widest uppercase text-secondary-grey">
                  Explore
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-serif text-black mb-4">Subscribe to the newsletter</h2>
          <p className="text-secondary-grey text-sm mb-8">
            Occasional updates on new publications. Free, no paywall.
          </p>
          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="you@example.com"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1 px-4 py-3 text-sm border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 text-xs font-sans font-medium tracking-widest uppercase text-white bg-black hover:bg-secondary-grey transition-colors"
            >
              Subscribe
            </button>
          </form>
          {newsletterStatus === 'success' && (
            <p className="mt-4 text-xs text-secondary-grey">
              Thank you for subscribing. Please check your inbox to confirm.
            </p>
          )}
          {newsletterStatus === 'error' && (
            <p className="mt-4 text-xs text-red-600">
              Subscription failed. Please try again.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Homepage;
