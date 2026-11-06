/**
 * ND30 LIVE - Homepage View (Language Specific)
 */

const { db } = require('../database/db');
const { renderAdSliderHtml } = require('./adSlider');
const { getActiveSlides } = require('../services/advertisementService');

function renderHomePage(lang = 'as') {
  const currentLang = lang || 'as';
  const adSlides = getActiveSlides();

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

  // Get active AdSense units
  const heroAd = db.prepare("SELECT * FROM adsense_slots WHERE slot_key = 'hero_secondary_adsense' AND is_active = 1").get()
    || db.prepare("SELECT * FROM adsense_slots WHERE slot_key = 'sidebar_rectangle' AND is_active = 1").get();
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

        <!-- Google AdSense Placement (Replaces previous photo slider) -->
        <div class="ad-slot-container" style="background:#0d131f; border:1px solid rgba(255,255,255,0.09); border-radius:12px; padding:12px; text-align:center; box-shadow:0 4px 20px rgba(0,0,0,0.35); overflow:hidden;">
          <span class="ad-label" style="display:block; font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; color:#64748b; margin-bottom:8px; font-weight:700;">Advertisement • Google AdSense</span>
          ${heroAd && heroAd.custom_html ? heroAd.custom_html : `
          <ins class="adsbygoogle"
               style="display:inline-block;width:300px;height:250px"
               data-ad-client="${heroAd ? heroAd.ad_client : 'ca-pub-9876543210123456'}"
               data-ad-slot="${heroAd ? heroAd.ad_slot_id : '5512093848'}"
               data-ad-format="rectangle"
               data-full-width-responsive="true"></ins>
          <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
          `}
        </div>
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
