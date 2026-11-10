/**
 * ND30 LIVE - Category Page View
 */

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

function renderCardPlayOverlay(videoUrl, art, currentLang) {
  if (!videoUrl || !art) return '';
  const escapedUrl = escapeAttr(videoUrl);
  const escapedTitle = escapeAttr(art.title || '');
  const articleUrl = `/${currentLang}/${art.category_slug || 'news'}/${art.subcategory_slug ? art.subcategory_slug + '/' : ''}${art.slug}`;

  return `
    <div class="card-video-play-overlay" onclick="event.preventDefault(); event.stopPropagation(); openFrontendVideoModal('${escapedUrl}', '${escapedTitle}', '${articleUrl}')" title="Play Video">
      <div class="card-play-button">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#ffffff" style="margin-left:2px;">
          <polygon points="7 4 20 12 7 20 7 4"></polygon>
        </svg>
      </div>
      <span class="card-video-pill">▶ VIDEO</span>
    </div>
  `;
}

function renderCategoryPage({ category, articles, lang = 'as' }) {
  const currentLang = lang || 'as';

  return `
  <div class="container">
    <div class="section-header" style="margin-bottom:28px;">
      <div>
        <h1 class="section-title" style="font-size:1.8rem;">
          📂 ${category.name}
        </h1>
        <p style="font-size:0.9rem; color:var(--text-muted); margin-top:4px;">
          ${category.description || ''}
        </p>
      </div>
      <span class="section-link">${articles.length} Stories</span>
    </div>

    ${articles.length === 0 ? `
      <div style="background:var(--bg-card); padding:40px; text-align:center; border-radius:12px; border:1px solid var(--border-color);">
        <p style="color:var(--text-muted);">No news stories published in this category yet.</p>
        <a href="/${currentLang}/" class="btn btn-primary" style="margin-top:16px;">Back to Homepage</a>
      </div>
    ` : `
      <div class="news-grid-3">
        ${articles.map(art => {
          const vUrl = getArticleVideoUrl(art);
          return `
          <article class="news-card">
            <div class="news-card-img-wrap">
              <img src="${art.featured_image || '/uploads/nd30_news_banner.jpg'}" alt="${art.title}" class="news-card-img" loading="lazy">
              ${renderCardPlayOverlay(vUrl, art, currentLang)}
            </div>
            <div class="news-card-body">
              <span class="news-card-cat">${category.name}</span>
              <h3 class="news-card-title">
                <a href="/${currentLang}/${category.slug}/${art.subcategory_slug ? art.subcategory_slug + '/' : ''}${art.slug}">
                  ${art.title}
                </a>
              </h3>
              <p class="news-card-summary">${art.summary || ''}</p>
              <div class="news-card-footer">
                <span>${art.author_name || 'ND30 Desk'}</span>
                <span>${new Date(art.published_at || art.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </article>
        `;}).join('')}
      </div>
    `}
  </div>`;
}

module.exports = {
  renderCategoryPage
};
