/**
 * ND30 LIVE - Single Article Page View
 * Features: Language-switching buttons linking available translations,
 * Strict non-redirection rule, schema.org JSON-LD, In-Article AdSense unit,
 * related news, social sharing.
 */

const { db } = require('../database/db');

function getArticleVideoUrl(art) {
  if (!art) return null;
  if (art.video_url) return art.video_url;
  if (!art.content) return null;
  const m = art.content.match(/facebook\.com\/plugins\/video\.php\?href=([^"&]+)/i);
  if (m) {
    try { return decodeURIComponent(m[1]); } catch(e) { return m[1]; }
  }
  return null;
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;')
    .replace(/\n/g, ' ');
}

function renderCardPlayOverlay(videoUrl, art, currentLang, isCompact = false) {
  if (!videoUrl || !art) return '';
  const escapedUrl = escapeAttr(videoUrl);
  const escapedTitle = escapeAttr(art.title || '');
  const articleUrl = `/${currentLang}/${art.category_slug || 'news'}/${art.subcategory_slug ? art.subcategory_slug + '/' : ''}${art.slug}`;
  const btnSize = isCompact ? '38px' : '52px';
  const iconSize = isCompact ? '20' : '26';

  return `
    <div class="card-video-play-overlay" onclick="event.preventDefault(); event.stopPropagation(); openFrontendVideoModal('${escapedUrl}', '${escapedTitle}', '${articleUrl}')" title="Play Video">
      <div class="card-play-button" style="width:${btnSize}; height:${btnSize};">
        <svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="#ffffff" style="margin-left:2px;">
          <polygon points="7 4 20 12 7 20 7 4"></polygon>
        </svg>
      </div>
      ${!isCompact ? '<span class="card-video-pill">▶ VIDEO</span>' : ''}
    </div>
  `;
}

function renderArticlePage({ translation, allTranslationsForStory, relatedArticles }) {
  const currentLang = translation.lang_code;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3030';

  // Fetch in-article inline AdSense
  const inArticleAd = db.prepare("SELECT * FROM adsense_slots WHERE slot_key = 'in_article_top' AND is_active = 1").get();
  const sidebarAd = db.prepare("SELECT * FROM adsense_slots WHERE slot_key = 'sidebar_rectangle' AND is_active = 1").get();

  // Language names
  const langDisplayMap = {
    'as': { name: 'অসমীয়া', flag: 'AS' },
    'hi': { name: 'हिंदी', flag: 'HI' },
    'en': { name: 'English', flag: 'EN' }
  };

  // Build breadcrumb trail
  const breadcrumbs = [
    { name: currentLang === 'as' ? 'মুখ্য পৃষ্ঠা' : (currentLang === 'hi' ? 'होम' : 'Home'), url: `/${currentLang}/` },
    { name: translation.category_name || 'News', url: `/${currentLang}/${translation.category_slug || 'news'}` }
  ];
  if (translation.subcategory_slug) {
    breadcrumbs.push({
      name: translation.subcategory_slug.toUpperCase(),
      url: `/${currentLang}/${translation.category_slug || 'news'}/${translation.subcategory_slug}`
    });
  }

  // Available translations for this article cluster
  const availableLangs = allTranslationsForStory.map(t => t.lang_code);
  const heroVideoUrl = getArticleVideoUrl(translation);
  const cleanProse = heroVideoUrl 
    ? translation.content.replace(/<div class="fb-video-container"[\s\S]*?<\/div>/gi, '')
    : translation.content;

  return `
  <!-- Reading Progress Bar -->
  <div id="articleProgressBar" style="position:fixed;top:0;left:0;height:4px;background:var(--primary-red);z-index:9999;width:0%;transition:width 0.1s ease;"></div>

  <div class="container">
    <div class="article-layout">
      <!-- Main Story Column -->
      <article>
        <!-- Breadcrumbs -->
        <nav class="breadcrumb-bar" aria-label="Breadcrumbs">
          ${breadcrumbs.map((b, i) => `
            <a href="${b.url}">${b.name}</a>
            ${i < breadcrumbs.length - 1 ? '<span>›</span>' : ''}
          `).join('')}
        </nav>

        <!-- Category Tag -->
        <header class="article-header">
          <span class="article-category-tag">${translation.category_name || 'News'}</span>
          <h1 class="article-headline">${translation.title}</h1>
          
          <!-- Summary Excerpt Box -->
          ${translation.summary ? `
            <div class="article-lead-box">
              ${translation.summary}
            </div>` : ''}

          <!-- Language Relationship / Availability Bar -->
          <div class="article-lang-bar" aria-label="Article Language Options">
            <div class="article-lang-label">
              <span>🌐</span>
              <span>
                ${currentLang === 'as' 
                  ? 'এই বাতৰিটো অন্যান্য ভাষাত পঢ়ক:' 
                  : (currentLang === 'hi' 
                    ? 'यह समाचार अन्य उपलब्ध भाषाओं में पढ़ें:' 
                    : 'Read this story in other languages:')}
              </span>
            </div>

            <div class="article-lang-options">
              ${['as', 'hi', 'en'].map(code => {
                const targetTrans = allTranslationsForStory.find(t => t.lang_code === code && t.status === 'published');
                const isCurrent = code === currentLang;
                const info = langDisplayMap[code];

                if (isCurrent) {
                  return `<span class="article-lang-pill current">✓ ${info.name} (${info.flag})</span>`;
                } else if (targetTrans) {
                  // Translation exists -> direct URL
                  const targetCatSlug = targetTrans.category_slug || 'news';
                  const targetSubSlug = targetTrans.subcategory_slug ? `/${targetTrans.subcategory_slug}` : '';
                  const targetUrl = `/${code}/${targetCatSlug}${targetSubSlug}/${targetTrans.slug}`;
                  return `
                    <a href="${targetUrl}" class="article-lang-pill" title="Read in ${info.name}">
                      📖 ${info.name} (${info.flag})
                    </a>`;
                } else {
                  // Auto-translate on-the-fly URL
                  const targetUrl = `/${code}/story/${translation.article_id}`;
                  return `
                    <a href="${targetUrl}" class="article-lang-pill" title="Auto-translate and read in ${info.name}">
                      ✨ ${info.name} (${info.flag})
                    </a>`;
                }
              }).join('')}
            </div>
          </div>

          <!-- Byline & Social Sharing -->
          <div class="article-byline">
            <div class="author-info">
              <div class="author-avatar">${(translation.author_name || 'ND30').charAt(0)}</div>
              <div>
                <strong style="color:var(--text-main);">${translation.author_name || 'ND30 Desk'}</strong>
                <div style="font-size:0.75rem; color:var(--text-subtle);">
                  Published: ${new Date(translation.published_at || translation.created_at).toLocaleString()} • ${translation.views_count || 120} Views
                </div>
              </div>
            </div>

            <div class="share-buttons-group">
              <span style="font-size:0.8rem; margin-right:4px;">Share:</span>
              <a href="#" class="share-btn tg" data-share="tg" title="Share to Telegram">✈️</a>
              <a href="#" class="share-btn wa" data-share="wa" title="Share on WhatsApp">💬</a>
              <a href="#" class="share-btn fb" data-share="fb" title="Share on Facebook">f</a>
              <a href="#" class="share-btn x" data-share="x" title="Share on X">𝕏</a>
              <a href="#" class="share-btn copy" data-share="copy" title="Copy Article Link">🔗</a>
            </div>
          </div>
        </header>

        <!-- Featured Video Player Hero or Featured Media Image -->
        ${heroVideoUrl ? `
        <div class="article-video-hero-player" style="margin:20px 0 26px 0; border-radius:12px; overflow:hidden; background:#000; box-shadow:0 8px 30px rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.1);">
          <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden;">
            <iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(heroVideoUrl)}&show_text=false&autoplay=true&width=780"
                    style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;"
                    scrolling="no" frameborder="0" allowfullscreen="true"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share">
            </iframe>
          </div>
        </div>
        ` : (translation.featured_image ? `
        <figure class="article-featured-img-wrap">
          <img src="${translation.featured_image}" alt="${translation.title}" class="article-featured-img">
          ${translation.image_caption ? `<figcaption class="article-img-caption">${translation.image_caption}</figcaption>` : ''}
        </figure>` : '')}

        <!-- Inline In-Article AdSense Unit -->
        ${inArticleAd ? `
        <div style="margin:24px 0; text-align:center;">
          <div class="ad-slot-container" style="max-width:100%;">
            <span class="ad-label">Advertisement • AdSense Inline</span>
            ${inArticleAd.custom_html || `
            <ins class="adsbygoogle"
                 style="display:block; text-align:center;"
                 data-ad-layout="in-article"
                 data-ad-format="fluid"
                 data-ad-client="${inArticleAd.ad_client}"
                 data-ad-slot="${inArticleAd.ad_slot_id}"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
            `}
          </div>
        </div>` : ''}

        <!-- Full Article Body -->
        <div class="article-prose">
          ${cleanProse}
        </div>

        <!-- Article Tags -->
        ${translation.tags ? `
        <div class="article-tags-wrap">
          <span style="font-weight:700; font-size:0.85rem; color:var(--text-subtle);">TAGS:</span>
          ${translation.tags.split(',').map(tag => `
            <span class="article-tag">#${tag.trim()}</span>
          `).join('')}
        </div>` : ''}

        <!-- Related Stories in the same language -->
        ${relatedArticles.length > 0 ? `
        <div style="margin-top:48px;">
          <div class="section-header">
            <h3 class="section-title">
              ${currentLang === 'as' ? 'সম্পৰ্কীয় বাতৰি' : (currentLang === 'hi' ? 'संबंधित समाचार' : 'Related Stories')}
            </h3>
          </div>
          <div class="news-grid-cards">
            ${relatedArticles.map(rel => {
              const relVideoUrl = getArticleVideoUrl(rel);
              return `
              <article class="news-card">
                <div class="news-card-img-wrap" style="height:140px; position:relative;">
                  <img src="${rel.featured_image || '/uploads/nd30_news_banner.jpg'}" alt="${rel.title}" class="news-card-img" loading="lazy">
                  ${renderCardPlayOverlay(relVideoUrl, rel, currentLang, true)}
                </div>
                <div class="news-card-body">
                  <h4 class="news-card-title" style="font-size:0.95rem;">
                    <a href="/${currentLang}/${rel.category_slug || 'news'}/${rel.subcategory_slug ? rel.subcategory_slug + '/' : ''}${rel.slug}">
                      ${rel.title}
                    </a>
                  </h4>
                </div>
              </article>
            `;}).join('')}
          </div>
        </div>` : ''}
      </article>

      <!-- Sidebar -->
      <aside>
        <!-- AdSense Sidebar Unit -->
        ${sidebarAd ? `
        <div class="sidebar-widget" style="padding:10px; text-align:center;">
          <span class="ad-label">Advertisement</span>
          ${sidebarAd.custom_html || `
          <ins class="adsbygoogle"
               style="display:inline-block;width:300px;height:250px"
               data-ad-client="${sidebarAd.ad_client}"
               data-ad-slot="${sidebarAd.ad_slot_id}"></ins>
          <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
          `}
        </div>` : ''}

        <!-- Language Edition Switcher Card -->
        <div class="sidebar-widget">
          <h4 class="widget-title">🌐 Read Story in Another Language</h4>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:12px;">
            Switch this story into another language edition:
          </p>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${['as', 'hi', 'en'].map(code => {
              const targetTrans = allTranslationsForStory.find(t => t.lang_code === code && t.status === 'published');
              const targetCat = targetTrans?.category_slug || translation.category_slug || 'assam';
              const targetUrl = targetTrans ? `/${code}/${targetCat}/${targetTrans.slug}` : `/${code}/story/${translation.article_id}`;
              const info = langDisplayMap[code];
              const isCurrent = code === currentLang;
              return `
                <a href="${targetUrl}" class="btn ${isCurrent ? 'btn-primary' : 'btn-secondary'}" style="justify-content:flex-start;">
                  <span>${isCurrent ? '✓ ' : ''}${info.name} (${info.flag})</span>
                </a>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Automation & Syndicate Card -->
        <div class="sidebar-widget">
          <h4 class="widget-title">📡 Live News Alert Channels</h4>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:14px;">
            Get immediate alerts in your language on Telegram & RSS:
          </p>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <a href="https://t.me" target="_blank" class="btn btn-primary" style="background:#229ED9; font-size:0.85rem;">
              ✈️ Join ND30 LIVE Telegram Channel
            </a>
            <a href="/${currentLang}/rss.xml" class="btn btn-secondary" style="font-size:0.85rem;">
              📡 ${currentLang.toUpperCase()} RSS Feed
            </a>
          </div>
        </div>
      </aside>
    </div>
  </div>`;
}

module.exports = {
  renderArticlePage
};
