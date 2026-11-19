import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export function SEO({
  title,
  description,
  canonical,
  ogImage,
  type = 'website',
}: {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  type?: 'website' | 'article';
}) {
  const location = useLocation();
  const baseUrl = import.meta.env.BASE_URL || 'http://localhost:5173';
  const url = canonical || `${baseUrl}${location.pathname}`;

  return (
    <Helmet>
      <title>{title} — AntiJournals</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="AntiJournals" />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}

export function ArticleSEO({
  article,
}: {
  article: {
    title: string;
    subtitle?: string;
    seo_title?: string;
    seo_description?: string;
    slug: string;
    author_name: string;
    published_at?: string;
    updated_at?: string;
    featured_image?: string;
    category_name?: string;
    tags: { name: string }[];
  };
}) {
  const baseUrl = import.meta.env.BASE_URL || 'http://localhost:5173';
  const url = `${baseUrl}/articles/${article.slug}`;
  const title = article.seo_title || article.title;
  const description = article.seo_description || article.subtitle || '';

  return (
    <>
      <SEO title={title} description={description} canonical={url} ogImage={article.featured_image} type="article" />

      <Helmet>
        {/* Article structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: article.title,
              description: article.subtitle || '',
              image: article.featured_image || null,
              author: {
                '@type': 'Person',
                name: article.author_name,
              },
              publisher: {
                '@type': 'Organization',
                name: 'AntiJournals under AntiPerson',
                logo: {
                  '@type': 'ImageObject',
                  url: `${baseUrl}/favicon.svg`,
                },
              },
              datePublished: article.published_at,
              dateModified: article.updated_at || article.published_at,
              url,
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': url,
              },
              articleSection: article.category_name || null,
              keywords: article.tags.map((t) => t.name).filter(Boolean),
            }),
          }}
        />
        {/* Breadcrumb structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: `${baseUrl}/`,
                },
                article.category_name
                  ? {
                      '@type': 'ListItem',
                      position: 2,
                      name: article.category_name,
                      item: `${baseUrl}/archive?category=${encodeURIComponent(article.category_name.toLowerCase())}`,
                    }
                  : null,
                {
                  '@type': 'ListItem',
                  position: article.category_name ? 3 : 2,
                  name: article.title,
                  item: url,
                },
              ].filter(Boolean),
            }),
          }}
        />
      </Helmet>
    </>
  );
}
