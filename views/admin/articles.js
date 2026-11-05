/**
 * ND30 LIVE - Articles Management Table
 * Multilingual News Library with Hide, Unhide, and Delete controls
 */

const { db } = require('../../database/db');

function renderArticlesList(filterLang = 'all') {
  // Query all article clusters with their translations
  const clusters = db.prepare('SELECT * FROM articles ORDER BY created_at DESC').all();

  const getTranslationsStmt = db.prepare(`
    SELECT t.*, c.name as category_name
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.article_id = ?
  `);

  const articlesData = clusters.map(c => {
    const translations = getTranslationsStmt.all(c.id);
    return {
      cluster: c,
      translations
    };
  });

  const totalCount = articlesData.length;
  const pubCount = articlesData.filter(a => a.translations.some(t => t.status === 'published')).length;
  const hiddenCount = articlesData.filter(a => a.translations.some(t => t.status === 'hidden') && !a.translations.some(t => t.status === 'published')).length;
  const draftCount = articlesData.filter(a => !a.translations.some(t => t.status === 'published' || t.status === 'hidden')).length;

  return `
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
    <div>
      <h2 style="font-size:1.4rem; font-weight:800;">Multilingual News Library</h2>
      <p style="font-size:0.85rem; color:var(--admin-muted);">
        Manage published stories, drafts, and Facebook imports across Assamese, Hindi, and English with instant Hide and Delete options.
      </p>
    </div>
    <div style="display:flex; gap:12px;">
      <a href="/admin/editor" class="btn btn-primary" style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:1.1rem; line-height:1;">+</span> Create New Story
      </a>
    </div>
  </div>

  <!-- Filter Pills & Search Bar -->
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:14px;">
    <div style="display:flex; gap:10px; flex-wrap:wrap;" id="articleFilterPills">
      <span class="badge filter-pill active" data-filter="all" style="font-size:0.85rem; padding:8px 14px; background:rgba(255,255,255,0.12); color:#fff;">
        All Stories (${totalCount})
      </span>
      <span class="badge filter-pill badge-success" data-filter="published" style="font-size:0.85rem; padding:8px 14px;">
        Published (${pubCount})
      </span>
      <span class="badge filter-pill badge-danger" data-filter="hidden" style="font-size:0.85rem; padding:8px 14px;">
        Hidden (${hiddenCount})
      </span>
      <span class="badge filter-pill badge-warning" data-filter="draft" style="font-size:0.85rem; padding:8px 14px;">
        Drafts (${draftCount})
      </span>
    </div>

    <div style="flex-grow:1; max-width:360px;">
      <input type="text" id="articleSearchInput" class="form-control" placeholder="🔍 Search stories by headline, category or ID..." style="font-size:0.85rem; padding:8px 14px;">
    </div>
  </div>

  <div class="admin-table-container">
    <table class="admin-table" id="articlesTable">
      <thead>
        <tr>
          <th>Cluster ID & Source</th>
          <th>Story Headline(s)</th>
          <th>Available Translations</th>
          <th>Created Date</th>
          <th style="min-width:190px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${articlesData.length === 0 ? `
          <tr>
            <td colspan="5" style="text-align:center; padding:36px; color:var(--admin-muted);">
              No news articles found. Click "+ Create New Story" to publish your first multilingual story.
            </td>
          </tr>
        ` : articlesData.map(({ cluster, translations }) => {
          // Find representative title
          const primaryTrans = translations.find(t => t.lang_code === 'en') || translations.find(t => t.lang_code === 'as') || translations[0];
          const isPublished = translations.some(t => t.status === 'published');
          const isHidden = !isPublished && translations.some(t => t.status === 'hidden');
          const rowStatus = isPublished ? 'published' : (isHidden ? 'hidden' : 'draft');
          const cleanTitle = primaryTrans ? primaryTrans.title : 'Untitled Story';

          return `
            <tr class="article-row" data-status="${rowStatus}" data-id="${cluster.id}">
              <td>
                <div style="font-family:monospace; font-size:0.8rem; font-weight:700; color:var(--admin-text);">
                  ${cluster.id}
                </div>
                <div style="display:flex; gap:6px; margin-top:4px; flex-wrap:wrap;">
                  <span class="badge ${cluster.origin_source === 'facebook' ? 'badge-info' : (cluster.origin_source === 'ifttt' ? 'badge-purple' : 'badge-warning')}" style="font-size:0.7rem;">
                    Source: ${cluster.origin_source}
                  </span>
                  <span class="badge ${isPublished ? 'badge-success' : (isHidden ? 'badge-danger' : 'badge-warning')}" style="font-size:0.7rem;">
                    ${isPublished ? 'Published' : (isHidden ? 'Hidden' : 'Draft')}
                  </span>
                </div>
              </td>
              <td>
                <div class="story-headline" style="font-weight:700; font-size:0.95rem; margin-bottom:6px; line-height:1.4;">
                  ${cleanTitle}
                </div>
                <div class="story-category" style="font-size:0.78rem; color:var(--admin-muted);">
                  Category: ${primaryTrans?.category_name || 'General'}
                </div>
              </td>
              <td>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                  ${['as', 'hi', 'en'].map(code => {
                    const trans = translations.find(t => t.lang_code === code);
                    if (trans) {
                      const isPub = trans.status === 'published';
                      const isHid = trans.status === 'hidden';
                      const badgeClass = isPub ? 'badge-success' : (isHid ? 'badge-danger' : 'badge-warning');
                      const label = isPub ? 'Published' : (isHid ? 'Hidden' : 'Draft');
                      return `
                        <span class="badge ${badgeClass}" title="${code.toUpperCase()} (${label})">
                          ${code.toUpperCase()}: ${label}
                        </span>
                      `;
                    } else {
                      return `
                        <span class="badge" style="background:rgba(255,255,255,0.05); color:#64748b;" title="No translation for ${code}">
                          ${code.toUpperCase()}: None
                        </span>
                      `;
                    }
                  }).join('')}
                </div>
              </td>
              <td style="font-size:0.82rem; color:var(--admin-muted); white-space:nowrap;">
                ${new Date(cluster.created_at).toLocaleDateString()}
              </td>
              <td style="white-space:nowrap;">
                <div style="display:flex; gap:6px; align-items:center;">
                  <a href="/admin/editor?id=${cluster.id}" class="btn btn-secondary btn-sm" title="Edit story in multilingual editor">
                    ✏️ Edit
                  </a>

                  ${isPublished ? `
                    <button type="button" class="btn btn-warning btn-sm btn-toggle-article-status"
                            data-article-id="${cluster.id}"
                            data-action="hide"
                            data-title="${escapeHtml(cleanTitle)}"
                            title="Hide this story from all public portals">
                      👁️ Hide
                    </button>
                  ` : `
                    <button type="button" class="btn btn-success btn-sm btn-toggle-article-status"
                            data-article-id="${cluster.id}"
                            data-action="unhide"
                            data-title="${escapeHtml(cleanTitle)}"
                            title="Unhide and publish to all public portals">
                      👁️ Unhide
                    </button>
                  `}

                  <button type="button" class="btn btn-danger btn-sm btn-delete-article"
                          data-article-id="${cluster.id}"
                          data-title="${escapeHtml(cleanTitle)}"
                          title="Permanently delete this story and all translations">
                    🗑️ Delete
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = {
  renderArticlesList
};
