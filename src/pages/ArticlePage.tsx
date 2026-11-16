import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { articleApi, bookmarkApi } from '@/lib/api';
import { useAuth } from '@/context/useAuth';
import { useAnalytics } from '@/context/useAnalytics';
import type { Article } from '@/types/index';
import { ArticleSEO } from '@/components/SEO';

function parseTOC(content: string): { id: string; text: string; level: number }[] {
  const headingRegex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;
  let index = 0;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1], 10);
    const text = match[2].replace(/<[^>]*>/g, '');
    const id = `heading-${index++}`;
    headings.push({ id, text, level });
  }
  return headings;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

export function ArticlePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { track } = useAnalytics();
  const [article, setArticle] = useState<Article | null>(null);
  const [readingMode, setReadingMode] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('antiperson:reading-mode');
      return saved === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('antiperson:font-size') || 'medium';
    }
    return 'medium';
  });
  const [showTOC, setShowTOC] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const tocRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const headings = article ? parseTOC(article.content) : [];

  useEffect(() => {
    articleApi.get(slug!).then(({ data }) => {
      setArticle(data);
      setLoading(false);
      track('article_view', { article_id: data.id });
    }).catch(() => {
      setLoading(false);
    });
  }, [slug, track]);

  useEffect(() => {
    if (user) {
      bookmarkApi.check(slug!).then(({ data }) => {
        setIsBookmarked(data.data.bookmarked);
      }).catch(() => {});
    }
  }, [user, slug]);

  async function handleBookmark() {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (isBookmarked) {
        await bookmarkApi.remove(slug!);
      } else {
        await bookmarkApi.create(slug!);
      }
      setIsBookmarked(!isBookmarked);
    } catch {
      alert('Failed to update bookmark');
    }
  }

  const handleScroll = useCallback(() => {
    if (!contentRef.current || !tocRef.current) return;
    const contentTop = contentRef.current.offsetTop;
    const contentHeight = contentRef.current.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const progress = Math.min(1, Math.max(0, (scrollTop - contentTop + viewportHeight * 0.3) / (contentHeight - viewportHeight * 0.6)));
    setScrollProgress(progress);
  }, []);

  const readCompleteTrackedRef = useRef(false);

  useEffect(() => {
    if (scrollProgress >= 1 && !readCompleteTrackedRef.current && article) {
      readCompleteTrackedRef.current = true;
      track('read_complete', { article_id: article.id });
    }
  }, [scrollProgress, article, track]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const fontSizeStyles: Record<string, string> = {
    small: 'text-lg leading-relaxed',
    medium: 'text-xl leading-relaxed md:text-2xl',
    large: 'text-2xl leading-relaxed md:text-3xl',
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="masthead mb-2">AntiPerson</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-serif text-black">Publication not found</h1>
        <Link to="/archive" className="mt-4 btn">Return to archive</Link>
      </div>
    );
  }

  const isPremiumLocked = article.is_premium && !(user?.membership === 'premium');
  const previewContent = article.preview_length
    ? article.content.slice(0, article.preview_length) + '…'
    : article.content;

  return (
    <>
      <ArticleSEO article={article} />
      <article
        className={`relative max-w-3xl mx-auto px-6 py-12 md:py-24 min-h-svh bg-white transition-colors duration-300 ${readingMode === 'dark' ? 'bg-black text-white' : ''}`}
      >
        <div className="fixed top-0 left-0 h-1 bg-black w-full origin-left scale-x-0 transition-transform duration-300 ease-out" style={{ transform: `scaleX(${scrollProgress})` }} />
        <div className="absolute top-6 right-0 flex items-center gap-2 z-10">
          <button
            onClick={() => setReadingMode(readingMode === 'light' ? 'dark' : 'light')}
            className="p-2 text-secondary-grey hover:text-black dark:text-secondary-grey dark:hover:text-white transition-colors"
            aria-label="Toggle reading mode"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {readingMode === 'light' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              )}
            </svg>
          </button>
          <button
            onClick={() => {
              const sizes = ['small', 'medium', 'large'];
              const idx = sizes.indexOf(fontSize);
              setFontSize(sizes[(idx + 1) % sizes.length]);
              localStorage.setItem('antiperson:font-size', sizes[(idx + 1) % sizes.length]);
            }}
            className="p-2 text-secondary-grey hover:text-black dark:text-secondary-grey dark:hover:text-white transition-colors"
            aria-label="Adjust text size"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setShowTOC(!showTOC)}
            className="p-2 text-secondary-grey hover:text-black dark:text-secondary-grey dark:hover:text-white transition-colors"
            aria-label="Table of contents"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: article.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="p-2 text-secondary-grey hover:text-black dark:text-secondary-grey dark:hover:text-white transition-colors"
            aria-label="Share"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          {!user ? (
            <button
              onClick={() => navigate('/login')}
              className="p-2 text-secondary-grey hover:text-black dark:text-secondary-grey dark:hover:text-white transition-colors"
              aria-label="Bookmark (login required)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleBookmark}
              className={`p-2 transition-colors ${isBookmarked ? 'text-black dark:text-white' : 'text-secondary-grey hover:text-black dark:hover:text-white'}`}
              aria-label="Bookmark"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}
        </div>

        {showTOC && headings.length > 0 && (
          <div className="hidden md:block w-64 sticky top-24 pt-24">
            <nav className="text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-4">
              Contents
            </nav>
            <ul className="space-y-1">
              {headings.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className={`block px-2 py-1 rounded hover:bg-light-grey dark:hover:bg-secondary-grey/30 transition-colors text-xs font-sans ${h.level === 2 ? 'font-medium text-black dark:text-white' : 'text-secondary-grey dark:text-secondary-grey/60'}`}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <header className="mb-16">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {article.category_name && (
              <Link to={`/archive?category=${slugify(article.category_name)}`} className="tag">
                {article.category_name}
              </Link>
            )}
            {article.tags.map((t) => (
              <Link key={t.id} to={`/archive?tag=${t.slug}`} className="tag">
                {t.name}
              </Link>
            ))}
          </div>

          <span className="block text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey mb-2">
            {article.author_name}
          </span>
          <h1 className="text-balance text-4xl md:text-5xl font-serif text-black dark:text-white leading-tight mb-6">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="text-xl md:text-xl text-secondary-grey dark:text-secondary-grey/70 leading-relaxed mb-8 max-w-2xl">
              {article.subtitle}
            </p>
          )}

          <div className="flex items-center gap-4 text-[11px] font-sans font-medium tracking-widest uppercase text-secondary-grey border-t border-black/10 dark:border-white/10 pt-4">
            <span>{new Date(article.published_at!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            {article.updated_at && article.updated_at !== article.published_at && (
              <>
                <span>·</span>
                <span>Updated {new Date(article.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </>
            )}
            <span>·</span>
            <span>{article.reading_time} min read</span>
          </div>
        </header>

        <div ref={contentRef} className={`article-body relative z-10 ${fontSizeStyles[fontSize]} ${readingMode === 'dark' ? 'dark' : ''}`} dangerouslySetInnerHTML={{ __html: isPremiumLocked ? previewContent : article.content }} />

        {isPremiumLocked && (
          <div className="mt-16 pt-8 border-t border-black/10 dark:border-white/10">
            <div className="p-8 bg-light-grey dark:bg-secondary-grey/30">
              <h3 className="text-xl font-serif text-black dark:text-white mb-4">Subscribe to read the rest</h3>
              <p className="text-secondary-grey dark:text-secondary-grey/70 text-sm mb-6">
                Become a premium member to read this publication in full.
              </p>
              <Link to="/membership" className="btn">Join premium</Link>
            </div>
          </div>
        )}

        <section className="mt-20 border-t border-black/10 dark:border-white/10 pt-12">
          <h2 className="text-2xl font-serif text-black dark:text-white mb-8">Related publications</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[]}
          </div>
        </section>
      </article>
    </>
  );
}

export default ArticlePage;