/**
 * ND30 LIVE - Category Page View
 */

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
        ${articles.map(art => `
          <article class="news-card">
            <div class="news-card-img-wrap">
              <img src="${art.featured_image || '/uploads/nd30_news_banner.jpg'}" alt="${art.title}" class="news-card-img" loading="lazy">
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
        `).join('')}
      </div>
    `}
  </div>`;
}

module.exports = {
  renderCategoryPage
};
