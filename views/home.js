/**
 * ND30 LIVE - Homepage View (Language Specific)
 */

const { db } = require('../database/db');

function renderHomePage(lang = 'as') {
  const currentLang = lang || 'as';

  // Fetch featured articles
  const featuredArticles = db.prepare(`
    SELECT t.*, c.name as category_name, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.lang_code = ? AND t.status = 'published' AND t.is_featured = 1
    ORDER BY t.published_at DESC
    LIMIT 4
  `).all(currentLang);

  // Fetch all latest published articles
  const latestArticles = db.prepare(`
    SELECT t.*, c.name as category_name, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.lang_code = ? AND t.status = 'published'
    ORDER BY t.published_at DESC
    LIMIT 12
  `).all(currentLang);

  // Fetch trending articles
  const trendingArticles = db.prepare(`
    SELECT t.*, c.name as category_name, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.lang_code = ? AND t.status = 'published'
    ORDER BY t.views_count DESC
    LIMIT 5
  `).all(currentLang);

  // Get active AdSense sidebar unit
  const sidebarAd = db.prepare("SELECT * FROM adsense_slots WHERE slot_key = 'sidebar_rectangle' AND is_active = 1").get();

  const heroPrimary = featuredArticles[0] || latestArticles[0];
  const heroSecondary = (featuredArticles.length > 1 ? featuredArticles.slice(1, 4) : latestArticles.slice(1, 4));

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
    ${heroPrimary ? `
    <section class="hero-news-grid" aria-label="Top Featured Stories">
      <!-- Primary Big Hero -->
      <article class="hero-primary-card">
        <img src="${heroPrimary.featured_image || '/uploads/nd30_news_banner.jpg'}" alt="${heroPrimary.title}" class="hero-img-backdrop" loading="eager">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <span class="hero-tag">${heroPrimary.category_name || 'Top Story'}</span>
          <h2 class="hero-title">
            <a href="/${currentLang}/${heroPrimary.category_slug || 'news'}/${heroPrimary.subcategory_slug ? heroPrimary.subcategory_slug + '/' : ''}${heroPrimary.slug}">
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

      <!-- Secondary Hero Stack -->
      <div class="hero-secondary-stack">
        ${heroSecondary.map(art => `
          <article class="news-card-compact">
            <img src="${art.featured_image || '/uploads/nd30_news_banner.jpg'}" alt="${art.title}" class="news-card-compact-img" loading="lazy">
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
        `).join('')}
      </div>
    </section>` : ''}

    <!-- Main 2-Column Content / Sidebar Area -->
    <div style="display:grid; grid-template-columns: 2.2fr 1fr; gap:36px;">
      <!-- Latest Stories Stream -->
      <div>
        <div class="section-header">
          <h3 class="section-title">🔴 ${titles.latest}</h3>
          <span class="section-link">${currentLang.toUpperCase()} Edition</span>
        </div>

        <div class="news-grid-3" style="grid-template-columns: repeat(2, 1fr);">
          ${(remainingArticles.length > 0 ? remainingArticles : latestArticles).map(art => `
            <article class="news-card">
              <div class="news-card-img-wrap">
                <img src="${art.featured_image || '/uploads/nd30_news_banner.jpg'}" alt="${art.title}" class="news-card-img" loading="lazy">
              </div>
              <div class="news-card-body">
                <span class="news-card-cat">${art.category_name || 'News'}</span>
                <h3 class="news-card-title">
                  <a href="/${currentLang}/${art.category_slug || 'news'}/${art.subcategory_slug ? art.subcategory_slug + '/' : ''}${art.slug}">
                    ${art.title}
                  </a>
                </h3>
                <p class="news-card-summary">${art.summary || ''}</p>
                <div class="news-card-footer">
                  <span>${art.author_name || 'ND30'}</span>
                  <span>${new Date(art.published_at || art.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>

      <!-- Sidebar -->
      <aside>
        <!-- Trending News Widget -->
        <div class="sidebar-widget">
          <h4 class="widget-title">🔥 ${titles.trending}</h4>
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

        <!-- Live IFTTT & Social Automation Badge -->
        <div class="sidebar-widget" style="background:linear-gradient(135deg, rgba(220,38,38,0.1), rgba(15,23,42,0.9)); border-color:var(--border-highlight);">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <span style="font-size:1.3rem;">⚡</span>
            <h4 style="font-size:1rem; font-weight:700; color:#fff;">ND30 Multi-Channel Syndication</h4>
          </div>
          <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.5; margin-bottom:14px;">
            Connected with IFTTT Automation, Meta Graph API & Telegram feeds for real-time multilingual broadcasting across Assam & India.
          </p>
          <div style="display:flex; gap:8px;">
            <span class="badge badge-success">IFTTT Live</span>
            <span class="badge badge-info">Meta API Connected</span>
            <span class="badge badge-purple">RSS 2.0</span>
          </div>
        </div>
      </aside>
    </div>
  </div>`;
}

module.exports = {
  renderHomePage
};
