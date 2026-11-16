import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { articleApi, categoryApi } from '@/lib/api';
import type { Article } from '@/types/index';

function ReadingTime({ minutes }: { minutes: number }) {
  return <span className="text-[10px] font-sans font-medium tracking-widest uppercase text-secondary-grey">{minutes} min read</span>;
}

export function Archive() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'popular'>((searchParams.get('sort') as 'newest' | 'oldest' | 'popular') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [articles, setArticles] = useState<Article[]>([]);
  const [meta, setMeta] = useState<{ page: number; per_page: number; total: number; total_pages: number }>({ page: 1, per_page: 12, total: 0, total_pages: 1 });
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const PER_PAGE = 12;

  useEffect(() => {
    articleApi.list({
      category, search: query || undefined, sort,
      page, per_page: PER_PAGE, premium: false,
    }).then(({ data, meta }) => {
      setArticles(data);
      if (meta) setMeta(meta);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [query, category, sort, page]);

  useEffect(() => {
    categoryApi.list().then(({ data }) => setCategories(data));
  }, []);

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
    setPage(1);
  };

  return (
    <div className="bg-white">
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 items-end mb-12">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-serif text-black mb-2">Archive</h1>
              <p className="text-secondary-grey text-sm">
                Explore the complete AntiPerson publication archive.
              </p>
            </div>

            <div className="flex-1 lg:w-1/3">
              <form className="relative">
                <input
                  type="text"
                  placeholder="Search publications…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
                <button
                  type="button"
                  onClick={() => updateQuery('q', query)}
                  className="absolute right-2 top-2 px-3 py-2 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey hover:text-black"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-10">
            <button
              onClick={() => { setCategory(''); updateQuery('category', ''); }}
              className={`px-3 py-1 text-xs font-sans font-medium tracking-widest border rounded-full text-black transition-colors ${
                !category ? 'bg-black text-white' : 'bg-white border-black'
              }`}
            >
              All categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.slug); updateQuery('category', cat.slug); }}
                className={`px-3 py-1 text-xs font-sans font-medium tracking-widest border rounded-full text-black transition-colors ${
                  category === cat.slug ? 'bg-black text-white' : 'bg-white border-black'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 mb-10">
            <span className="text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Sort by</span>
            {(['newest', 'oldest', 'popular'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSort(s); updateQuery('sort', s); }}
                className={`text-xs font-sans font-medium tracking-widest transition-colors ${
                  sort === s ? 'text-black' : 'text-secondary-grey'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="mb-8">
            <p className="text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">
              {meta.total} publications
            </p>
          </div>

          {loading ? (
            <div className="min-h-[300px] flex items-center justify-center">
              <p className="text-secondary-grey text-sm">Loading publications…</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <article key={article.id} className="group">
                  <div className="mb-4">
                    <h3 className="text-xl font-serif text-black leading-tight group-hover:text-secondary-grey transition-colors mb-2">
                      {article.title}
                    </h3>
                    {article.subtitle && (
                      <p className="text-secondary-grey text-sm leading-relaxed line-clamp-2 mb-3">
                        {article.subtitle}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {article.tags.slice(0, 2).map((t) => (
                        <Link
                          key={t.id}
                          to={`/archive?tag=${t.slug}`}
                          className="tag"
                        >
                          {t.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-black/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-sans font-medium tracking-widest uppercase text-secondary-grey">
                        <span>{new Date(article.published_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span>·</span>
                        <span>{article.author_name}</span>
                        <span>·</span>
                        <ReadingTime minutes={article.reading_time} />
                      </div>
                      {article.is_premium && (
                        <span className="text-[10px] font-sans font-bold tracking-widest uppercase text-secondary-grey border border-light-grey px-2 py-0.5">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {meta.total_pages > 1 && !loading && (
            <div className="mt-12 flex items-center justify-between">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="text-xs font-sans font-medium tracking-widest text-black opacity-50 disabled:opacity-20 hover:opacity-100 transition-opacity"
              >
                ← Previous
              </button>
              <span className="text-xs font-sans font-medium tracking-widest text-secondary-grey">
                Page {page} of {meta.total_pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === meta.total_pages}
                className="text-xs font-sans font-medium tracking-widest text-black opacity-50 disabled:opacity-20 hover:opacity-100 transition-opacity"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Archive;