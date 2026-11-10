/**
 * ND30 LIVE - Homepage View (Language Specific)
 */

const { db } = require('../database/db');
const { renderAdSliderHtml } = require('./adSlider');
const { getActiveSlides } = require('../services/advertisementService');

function getArticleVideoUrl(art) {
  if (!art) return null;
  if (art.video_url) return art.video_url;
  if (!art.content) return null;
  const m = art.content.match(/facebook\.com\/plugins\/(?:video|post)\.php\?href=([^"&]+)/i);
  if (m) {
    try { return decodeURIComponent(m[1]); } catch(e) { return m[1]; }
  }
  return null;
}

function getAutoplayVideoSrc(videoUrl) {
  if (!videoUrl) return '';
  let clean = videoUrl.trim().replace('m.facebook.com', 'www.facebook.com');

  // Check YouTube
  const ytMatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&playsinline=1&rel=0`;
  }

  // Canonicalize numeric ID for Facebook Watch if possible
  const vMatch = clean.match(/watch\/?\?v=(\d+)/i) || clean.match(/\/videos\/(\d+)/i);
  if (vMatch) {
    clean = `https://www.facebook.com/watch/?v=${vMatch[1]}`;
  }

  const isReel = clean.includes('/reel/') || clean.includes('/share/r/');
  if (isReel) {
    return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(clean)}&show_text=false&width=780`;
  }

  // Facebook standard video: autoplay=true and muted=true enables seamless cross-browser autoplay
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(clean)}&show_text=false&autoplay=true&muted=true&mute=true&width=780`;
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

function renderHomePage(lang = 'as') {
  const currentLang = lang || 'as';
  const adSlides = getActiveSlides();

  // 1. Fetch latest published article with video (Prioritized for Top Autoplay Hero Section)
  const latestVideoArticle = db.prepare(`
    SELECT t.*, c.name as category_name, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.lang_code = ? AND t.status = 'published'
      AND ((t.video_url IS NOT NULL AND t.video_url != '') OR t.content LIKE '%facebook.com/plugins%')
    ORDER BY t.published_at DESC
    LIMIT 1
  `).get(currentLang);

  // 2. Fetch featured articles
  const featuredArticles = db.prepare(`
    SELECT t.*, c.name as category_name, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.lang_code = ? AND t.status = 'published' AND t.is_featured = 1
    ORDER BY t.published_at DESC
    LIMIT 4
  `).all(currentLang);

  // 3. Fetch all latest published articles
  const latestArticles = db.prepare(`
    SELECT t.*, c.name as category_name, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.lang_code = ? AND t.status = 'published'
    ORDER BY t.published_at DESC
    LIMIT 12
  `).all(currentLang);

  // 4. Fetch trending articles
  const trendingArticles = db.prepare(`
    SELECT t.*, c.name as category_name, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.lang_code = ? AND t.status = 'published'
    ORDER BY t.views_count DESC
    LIMIT 5
  `).all(currentLang);

  // Get active AdSense units
  const heroAd = db.prepare("SELECT * FROM adsense_slots WHERE slot_key = 'hero_secondary_adsense' AND is_active = 1").get()
    || db.prepare("SELECT * FROM adsense_slots WHERE slot_key = 'sidebar_rectangle' AND is_active = 1").get();
  const sidebarAd = db.prepare("SELECT * FROM adsense_slots WHERE slot_key = 'sidebar_rectangle' AND is_active = 1").get();

  // Primary Hero is latest post with video if available, otherwise featured/latest
  const heroPrimary = latestVideoArticle || featuredArticles[0] || latestArticles[0];

  // Secondary stack excludes heroPrimary
  const candidateSecondary = featuredArticles.filter(a => a.id !== heroPrimary?.id);
  const heroSecondary = (candidateSecondary.length >= 3 
    ? candidateSecondary.slice(0, 3) 
    : latestArticles.filter(a => a.id !== heroPrimary?.id).slice(0, 3));

  const remainingArticles = latestArticles.filter(a => a.id !== heroPrimary?.id && !heroSecondary.some(s => s.id === a.id));

  // Section titles localized
  const titles = {
    latest: currentLang === 'as' ? 'শেহতীয়া সংবাদ' : (currentLang === 'hi' ? 'ताज़ा समाचार' : 'Latest News'),
    trending: currentLang === 'as' ? 'ট্ৰেণ্ডিং খবৰ' : (currentLang === 'hi' ? 'ट्रेंडिंग खबरें' : 'Trending Stories'),
    allStories: currentLang === 'as' ? 'সকলো বাতৰি চাওক' : (currentLang === 'hi' ? 'सभी खबरें देखें' : 'View All Stories')
  };

  return `
  <div class="container">
    <!-- Hero News Section -->
    ${heroPrimary ? (() => {
      const heroPrimaryVideo = getArticleVideoUrl(heroPrimary);
      const articleUrl = `/${currentLang}/${heroPrimary.category_slug || 'news'}/${heroPrimary.subcategory_slug ? heroPrimary.subcategory_slug + '/' : ''}${heroPrimary.slug}`;
      const escapedUrl = escapeAttr(heroPrimaryVideo || '');
      const escapedTitle = escapeAttr(heroPrimary.title || '');

      let primaryHeroHtml = '';
      if (heroPrimaryVideo) {
        const autoplayEmbedSrc = getAutoplayVideoSrc(heroPrimaryVideo);
        const videoBadgeLabel = currentLang === 'as' 
          ? 'শেহতীয়া ভিডিঅ’ বাতৰি • লাইভ' 
          : (currentLang === 'hi' ? 'ताज़ा वीडियो समाचार • ऑटोप्ले' : 'LATEST VIDEO BROADCAST • AUTOPLAY');

        primaryHeroHtml = `
          <article class="hero-primary-card hero-video-primary-card">
            <!-- Top video status and action bar -->
            <div class="hero-video-bar-top">
              <div class="hero-video-badge-pill">
                <span class="pulse-dot"></span>
                <span>${videoBadgeLabel}</span>
              </div>
              <div class="hero-video-actions-top">
                <a href="${escapeAttr(heroPrimaryVideo)}" target="_blank" rel="noopener noreferrer" class="hero-video-ext-link" title="Watch Directly on Facebook">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#ffffff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  <span>Watch on Facebook ↗</span>
                </a>
                <button type="button" class="hero-video-expand-btn" onclick="openFrontendVideoModal('${escapedUrl}', '${escapedTitle}', '${articleUrl}')" title="Expand Fullscreen Lightbox">
                  ⛶ Expand
                </button>
              </div>
            </div>

            <!-- Responsive 16:9 Autoplaying Video Area (Preserves Exact Same Card Dimensions) -->
            <div class="hero-video-player-container">
              <iframe 
                id="heroAutoplayVideoIframe"
                src="${autoplayEmbedSrc}" 
                class="hero-video-embed-iframe" 
                scrolling="no" 
                frameborder="0" 
                allowfullscreen="true" 
                allow="autoplay *; fullscreen *; clipboard-write; encrypted-media; picture-in-picture; web-share">
              </iframe>
            </div>

            <!-- News Headline & Metadata Area below Video -->
            <div class="hero-video-content-panel">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <span class="hero-tag" style="margin-bottom:0;">${heroPrimary.category_name || 'Top Story'}</span>
                <span class="hero-playing-live-tag">
                  <span class="pulse-dot" style="background:#ef4444; width:5px; height:5px;"></span>
                  <span>AUTOPLAYING</span>
                </span>
              </div>
              <h2 class="hero-title" style="font-size:1.32rem; line-height:1.3; margin:4px 0 8px 0; -webkit-line-clamp:2; display:-webkit-box; -webkit-box-orient:vertical; overflow:hidden;">
                <a href="${articleUrl}">
                  ${heroPrimary.title}
                </a>
              </h2>
              ${heroPrimary.summary ? `<p class="hero-summary" style="margin-bottom:8px; font-size:0.88rem; -webkit-line-clamp:2; display:-webkit-box; -webkit-box-orient:vertical; overflow:hidden; color:#cbd5e1;">${heroPrimary.summary}</p>` : ''}
              <div class="hero-meta" style="display:flex; align-items:center; flex-wrap:wrap; gap:12px; font-size:0.78rem; color:var(--text-subtle);">
                <span>✍️ ${heroPrimary.author_name || 'ND30 Desk'}</span>
                <span>🕒 ${new Date(heroPrimary.published_at || heroPrimary.created_at).toLocaleDateString()}</span>
                <span>👁️ ${heroPrimary.views_count || 120} views</span>
                <a href="${articleUrl}" style="margin-left:auto; color:var(--primary-red); font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                  Read Story →
                </a>
              </div>
            </div>
          </article>
        `;
      } else {
        primaryHeroHtml = `
          <article class="hero-primary-card">
            <img src="${heroPrimary.featured_image || '/uploads/nd30_news_banner.jpg'}" alt="${heroPrimary.title}" class="hero-img-backdrop" loading="eager">
            ${renderCardPlayOverlay(heroPrimaryVideo, heroPrimary, currentLang)}
            <div class="hero-overlay"></div>
            <div class="hero-content">
              <span class="hero-tag">${heroPrimary.category_name || 'Top Story'}</span>
              <h2 class="hero-title">
                <a href="${articleUrl}">
                  ${heroPrimary.title}
                </a>
              </h2>
              <p class="hero-summary">${heroPrimary.summary || ''}</p>
              <div class="hero-meta">
                <span>✍️ ${heroPrimary.author_name || 'ND30 Desk'}</span>
                <span>🕒 ${new Date(heroPrimary.published_at || heroPrimary.created_at).toLocaleDateString()}</span>
                <span>👁️ ${heroPrimary.views_count || 120} views</span>
              </div>
            </div>
          </article>
        `;
      }

      return `
    <section class="hero-news-grid" aria-label="Top Featured Stories">
      <!-- Primary Big Hero (Autoplays latest video post) -->
      ${primaryHeroHtml}

      <!-- Secondary Hero Stack -->
      <div class="hero-secondary-stack">
        ${heroSecondary.map(art => {
          const vUrl = getArticleVideoUrl(art);
          return `
          <article class="news-card-compact">
            <div style="position:relative; width:120px; height:80px; flex-shrink:0; border-radius:6px; overflow:hidden;">
              <img src="${art.featured_image || '/uploads/nd30_news_banner.jpg'}" alt="${art.title}" class="news-card-compact-img" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
              ${renderCardPlayOverlay(vUrl, art, currentLang, true)}
            </div>
            <div class="news-card-compact-body">
              <div>
                <span class="news-card-cat">${art.category_name || 'News'}</span>
                <h3 class="news-card-compact-title">
                  <a href="/${currentLang}/${art.category_slug || 'news'}/${art.subcategory_slug ? art.subcategory_slug + '/' : ''}${art.slug}">
                    ${art.title}
                  </a>
                </h3>
              </div>
              <div style="font-size:0.75rem; color:var(--text-subtle); margin-top:6px;">
                ${new Date(art.published_at || art.created_at).toLocaleDateString()}
              </div>
            </div>
          </article>
        `;}).join('')}

        <!-- Advertisement Photo Slider with WhatsApp Contact (Marked place requested by user) -->
        ${renderAdSliderHtml(adSlides)}
      </div>
    </section>`;
    })() : ''}

    <!-- Main 2-Column Content / Sidebar Area -->
    <div class="home-main-layout">
      <!-- Latest Stories Stream (Lists all latest posts with Play option for videos) -->
      <div>
        <div class="section-header">
          <h3 class="section-title">🔴 ${titles.latest}</h3>
          <span class="section-link">${currentLang.toUpperCase()} Edition</span>
        </div>

        <div class="news-grid-cards">
          ${latestArticles.map(art => {
            const vUrl = getArticleVideoUrl(art);
            const artUrl = `/${currentLang}/${art.category_slug || 'news'}/${art.subcategory_slug ? art.subcategory_slug + '/' : ''}${art.slug}`;
            return `
            <article class="news-card">
              <div class="news-card-img-wrap">
                <img src="${art.featured_image || '/uploads/nd30_news_banner.jpg'}" alt="${art.title}" class="news-card-img" loading="lazy">
                ${renderCardPlayOverlay(vUrl, art, currentLang)}
              </div>
              <div class="news-card-body">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                  <span class="news-card-cat">${art.category_name || 'News'}</span>
                  ${vUrl ? '<span style="color:#ef4444; font-size:0.72rem; font-weight:800; display:inline-flex; align-items:center; gap:3px;">▶ VIDEO</span>' : ''}
                </div>
                <h3 class="news-card-title">
                  <a href="${artUrl}">
                    ${art.title}
                  </a>
                </h3>
                <p class="news-card-summary">${art.summary || ''}</p>
                <div class="news-card-footer" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
                  <span style="font-size:0.75rem; color:var(--text-subtle);">
                    ${art.author_name || 'ND30'} • ${new Date(art.published_at || art.created_at).toLocaleDateString()}
                  </span>
                  ${vUrl ? `
                    <button type="button" onclick="event.preventDefault(); event.stopPropagation(); openFrontendVideoModal('${escapeAttr(vUrl)}', '${escapeAttr(art.title || '')}', '${artUrl}')" style="background:#dc2626; color:#fff; border:none; border-radius:4px; padding:3px 8px; font-size:0.72rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(220,38,38,0.4);" title="Play Video">
                      <span>▶</span> Play
                    </button>
                  ` : ''}
                </div>
              </div>
            </article>
          `;}).join('')}
        </div>
      </div>

      <!-- Sidebar -->
      <aside>
        <!-- Trending News Section Header (Aligned on the same line as Latest News) -->
        <div class="section-header">
          <h3 class="section-title">🔥 ${titles.trending}</h3>
          <span class="section-link" style="font-size:0.8rem; color:var(--text-subtle);">${currentLang === 'as' ? 'শীৰ্ষ পঠিত' : (currentLang === 'hi' ? 'टॉप खबरें' : 'Top Reads')}</span>
        </div>

        <!-- Trending News Widget -->
        <div class="sidebar-widget">
          <div style="display:flex; flex-direction:column; gap:16px;">
            ${trendingArticles.map((art, idx) => `
              <div style="display:flex; gap:14px; align-items:flex-start;">
                <span style="font-size:1.4rem; font-weight:900; color:var(--primary-red); opacity:0.8; line-height:1;">
                  0${idx + 1}
                </span>
                <div>
                  <h5 style="font-size:0.92rem; font-weight:700; line-height:1.35; margin-bottom:4px;">
                    <a href="/${currentLang}/${art.category_slug || 'news'}/${art.subcategory_slug ? art.subcategory_slug + '/' : ''}${art.slug}">
                      ${art.title}
                    </a>
                  </h5>
                  <span style="font-size:0.75rem; color:var(--text-subtle);">👁️ ${art.views_count || 100} reads</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

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
      </aside>
    </div>
  </div>`;
}

module.exports = {
  renderHomePage
};
