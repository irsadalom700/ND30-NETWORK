/**
 * ND30 LIVE - Multilingual SEO, RSS, and Sitemap Generator
 * Provides hreflang, OpenGraph, JSON-LD NewsArticle structured data,
 * Language-specific XML Sitemaps, Google News Sitemaps, and RSS 2.0 Feeds.
 */

const { db } = require('../database/db');

/**
 * Generate hreflang tags for article page linking available translations
 */
function generateHreflangTags(articleId, currentLang, baseUrl = 'http://localhost:3000') {
  const translations = db.prepare(`
    SELECT t.lang_code, t.slug, t.subcategory_slug, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.article_id = ? AND t.status = 'published'
  `).all(articleId);

  let tags = [];
  let defaultUrl = '';

  for (const trans of translations) {
    const catSlug = trans.category_slug || 'news';
    const subSlug = trans.subcategory_slug ? `/${trans.subcategory_slug}` : '';
    const fullUrl = `${baseUrl}/${trans.lang_code}/${catSlug}${subSlug}/${trans.slug}`;

    tags.push(`<link rel="alternate" hreflang="${trans.lang_code}" href="${fullUrl}" />`);

    if (trans.lang_code === 'en' || !defaultUrl) {
      defaultUrl = fullUrl;
    }
  }

  if (defaultUrl) {
    tags.push(`<link rel="alternate" hreflang="x-default" href="${defaultUrl}" />`);
  }

  return tags.join('\n  ');
}

/**
 * Generate JSON-LD NewsArticle Structured Data
 */
function generateNewsArticleJsonLd(translation, baseUrl = 'http://localhost:3000') {
  const catSlug = translation.category_slug || 'news';
  const subSlug = translation.subcategory_slug ? `/${translation.subcategory_slug}` : '';
  const articleUrl = `${baseUrl}/${translation.lang_code}/${catSlug}${subSlug}/${translation.slug}`;
  const imageUrl = translation.featured_image ? (translation.featured_image.startsWith('http') ? translation.featured_image : `${baseUrl}${translation.featured_image}`) : `${baseUrl}/uploads/nd30_news_banner.jpg`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': articleUrl
    },
    'headline': translation.title,
    'description': translation.summary || translation.seo_description || '',
    'image': [imageUrl],
    'datePublished': translation.published_at || translation.created_at,
    'dateModified': translation.updated_at || translation.published_at || translation.created_at,
    'inLanguage': translation.lang_code,
    'author': {
      '@type': 'Person',
      'name': translation.author_name || 'ND30 Desk'
    },
    'publisher': {
      '@type': 'NewsMediaOrganization',
      'name': 'ND30 LIVE',
      'url': baseUrl,
      'logo': {
        '@type': 'ImageObject',
        'url': `${baseUrl}/images/nd30_live_logo.png`,
        'width': 600,
        'height': 338
      }
    }
  };

  return JSON.stringify(structuredData, null, 2);
}

/**
 * Generate BreadcrumbList JSON-LD
 */
function generateBreadcrumbJsonLd(items, baseUrl = 'http://localhost:3000') {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': `${baseUrl}${item.url}`
    }))
  };

  return JSON.stringify(structuredData, null, 2);
}

/**
 * Generate XML Sitemap Index
 */
function generateMasterSitemapXml(baseUrl = 'http://localhost:3000') {
  const now = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/as/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/hi/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/en/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/news-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
}

/**
 * Generate Language-Specific XML Sitemap
 */
function generateLanguageSitemapXml(langCode, baseUrl = 'http://localhost:3000') {
  const articles = db.prepare(`
    SELECT t.slug, t.subcategory_slug, t.updated_at, t.published_at, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.lang_code = ? AND t.status = 'published'
    ORDER BY t.published_at DESC
  `).all(langCode);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Language Homepage -->
  <url>
    <loc>${baseUrl}/${langCode}/</loc>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>`;

  for (const art of articles) {
    const catSlug = art.category_slug || 'news';
    const subSlug = art.subcategory_slug ? `/${art.subcategory_slug}` : '';
    const fullUrl = `${baseUrl}/${langCode}/${catSlug}${subSlug}/${art.slug}`;
    const lastMod = (art.updated_at || art.published_at || new Date().toISOString()).split('T')[0];

    xml += `
  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  xml += '\n</urlset>';
  return xml;
}

/**
 * Generate Google News Sitemap format
 */
function generateGoogleNewsSitemapXml(baseUrl = 'http://localhost:3000') {
  const articles = db.prepare(`
    SELECT t.title, t.slug, t.subcategory_slug, t.lang_code, t.published_at, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.status = 'published'
    ORDER BY t.published_at DESC
    LIMIT 100
  `).all();

  const langNames = {
    'as': 'অসমীয়া',
    'hi': 'Hindi',
    'en': 'English'
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

  for (const art of articles) {
    const catSlug = art.category_slug || 'news';
    const subSlug = art.subcategory_slug ? `/${art.subcategory_slug}` : '';
    const fullUrl = `${baseUrl}/${art.lang_code}/${catSlug}${subSlug}/${art.slug}`;
    const pubDate = art.published_at || new Date().toISOString();

    xml += `
  <url>
    <loc>${fullUrl}</loc>
    <news:news>
      <news:publication>
        <news:name>ND30 LIVE</news:name>
        <news:language>${art.lang_code}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title><![CDATA[${art.title}]]></news:title>
    </news:news>
  </url>`;
  }

  xml += '\n</urlset>';
  return xml;
}

/**
 * Generate RSS 2.0 Feed for a language
 */
function generateLanguageRssFeed(langCode, baseUrl = 'http://localhost:3000') {
  const titles = {
    'as': 'ND30 LIVE – অসমীয়া মুখ্য সংবাদ',
    'hi': 'ND30 LIVE – हिंदी ताज़ा समाचार',
    'en': 'ND30 LIVE – Latest English News'
  };
  const descriptions = {
    'as': 'অসম, উত্তৰ-পূব আৰু ৰাষ্ট্ৰীয় প্ৰেক্ষাপটৰ নিৰ্ভীক আৰু বিশ্বাসযোগ্য লাইভ সংবাদ',
    'hi': 'असम, पूर्वोत्तर और देश-विदेश की ताज़ा एवं निष्पक्ष लाइव खबरें',
    'en': 'Breaking news, live updates and comprehensive regional reporting from Assam, Northeast India & World'
  };

  const channelTitle = titles[langCode] || 'ND30 LIVE';
  const channelDesc = descriptions[langCode] || 'ND30 LIVE Feed';

  const articles = db.prepare(`
    SELECT t.title, t.slug, t.summary, t.content, t.featured_image, t.published_at, t.author_name,
           t.subcategory_slug, c.name as category_name, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.lang_code = ? AND t.status = 'published'
    ORDER BY t.published_at DESC
    LIMIT 30
  `).all(langCode);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title><![CDATA[${channelTitle}]]></title>
    <link>${baseUrl}/${langCode}/</link>
    <description><![CDATA[${channelDesc}]]></description>
    <language>${langCode}</language>
    <atom:link href="${baseUrl}/${langCode}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>${baseUrl}/images/nd30_live_logo.png</url>
      <title>ND30 LIVE</title>
      <link>${baseUrl}/${langCode}/</link>
    </image>`;

  for (const art of articles) {
    const catSlug = art.category_slug || 'news';
    const subSlug = art.subcategory_slug ? `/${art.subcategory_slug}` : '';
    const fullUrl = `${baseUrl}/${langCode}/${catSlug}${subSlug}/${art.slug}`;
    const pubDate = new Date(art.published_at || Date.now()).toUTCString();
    const imgUrl = art.featured_image ? (art.featured_image.startsWith('http') ? art.featured_image : `${baseUrl}${art.featured_image}`) : '';

    xml += `
    <item>
      <title><![CDATA[${art.title}]]></title>
      <link>${fullUrl}</link>
      <guid isPermaLink="true">${fullUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author><![CDATA[${art.author_name || 'ND30 Desk'}]]></author>
      <category><![CDATA[${art.category_name || 'General'}]]></category>
      <description><![CDATA[${art.summary || art.title}]]></description>
      ${imgUrl ? `<media:content url="${imgUrl}" medium="image" />` : ''}
    </item>`;
  }

  xml += `
  </channel>
</rss>`;
  return xml;
}

module.exports = {
  generateHreflangTags,
  generateNewsArticleJsonLd,
  generateBreadcrumbJsonLd,
  generateMasterSitemapXml,
  generateLanguageSitemapXml,
  generateGoogleNewsSitemapXml,
  generateLanguageRssFeed
};
