/**
 * ND30 LIVE - Upgraded 3-Language News Editor
 * Supports independent Assamese, Hindi, English tabs, individual drafting & publishing,
 * AI Translation Assistant modal with review/approval, and language relationship clustering.
 */

const { db } = require('../../database/db');

function renderEditorPage(articleId = null) {
  let article = null;
  let translationsByLang = { as: null, hi: null, en: null };

  if (articleId) {
    article = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);
    if (article) {
      const transList = db.prepare('SELECT * FROM article_translations WHERE article_id = ?').all(articleId);
      transList.forEach(t => {
        translationsByLang[t.lang_code] = t;
      });
    }
  }

  // Fetch categories for all 3 languages
  const asCategories = db.prepare("SELECT * FROM categories WHERE lang_code = 'as' ORDER BY sort_order").all();
  const hiCategories = db.prepare("SELECT * FROM categories WHERE lang_code = 'hi' ORDER BY sort_order").all();
  const enCategories = db.prepare("SELECT * FROM categories WHERE lang_code = 'en' ORDER BY sort_order").all();

  const categoriesMap = { as: asCategories, hi: hiCategories, en: enCategories };

  const languages = [
    { code: 'as', name: 'Assamese (অসমীয়া)', native: 'অসমীয়া' },
    { code: 'hi', name: 'Hindi (हिंदी)', native: 'हिंदी' },
    { code: 'en', name: 'English', native: 'English' }
  ];

  return `
  <!-- Hidden ID for cluster editing -->
  <input type="hidden" id="articleId" value="${article ? article.id : ''}">

  <div class="multilingual-editor-container">
    <!-- Top 3-Language Tab Bar -->
    <div class="editor-lang-tabs-bar">
      ${languages.map((l, index) => {
        const trans = translationsByLang[l.code];
        let statusBadge = '<span class="tab-status-pill status-empty">Not Created</span>';
        if (trans) {
          statusBadge = trans.status === 'published' 
            ? '<span class="tab-status-pill status-published">Published</span>' 
            : '<span class="tab-status-pill status-draft">Draft</span>';
        }
        return `
          <button type="button" class="editor-lang-tab ${index === 0 ? 'active' : ''}" data-lang="${l.code}">
            <span>${l.native}</span>
            ${statusBadge}
          </button>
        `;
      }).join('')}

      <div class="tab-actions-right">
        <!-- Auto-Fill All 3 Languages Trigger -->
        <button type="button" id="autoTranslateAllBtn" class="btn-ai-translate" style="background:rgba(16, 185, 129, 0.15); border:1px solid rgba(16, 185, 129, 0.35); color:#34d399;" title="Auto-translate into all remaining languages now">
          <span>⚡</span> Auto-Fill All 3 Languages
        </button>
        <!-- AI Translation Assistant Trigger -->
        <button type="button" id="openAiModalBtn" class="btn-ai-translate" title="Translate using AI Assistant">
          <span>✨</span> Single Tab Assistant
        </button>
      </div>
    </div>

    <!-- All-Language Simultaneous Publishing Banner -->
    <div style="background:rgba(16, 185, 129, 0.08); border:1px solid rgba(16, 185, 129, 0.25); border-radius:8px; padding:12px 18px; margin-bottom:18px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:1.5rem; line-height:1;">🌐</span>
        <div>
          <strong style="color:#10b981; font-size:0.95rem;">Simultaneous All-Language Publishing Active</strong>
          <span style="font-size:0.82rem; color:var(--admin-muted); display:block; margin-top:2px;">
            Write your story in any language tab. When you click <strong>"Publish in All Languages"</strong>, ND30 LIVE automatically translates, categorizes, and publishes it across all 3 portals (অসমীয়া, हिंदी, and English) at once!
          </span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="badge badge-success" style="font-size:0.8rem; padding:6px 12px;">
          ✓ Auto-Publish All 3 Editions
        </span>
      </div>
    </div>

    <!-- 3 Language Panels with Independent Fields -->
    ${languages.map((l, index) => {
      const trans = translationsByLang[l.code] || {};
      const catList = categoriesMap[l.code] || [];
      const isPanelActive = index === 0;

      return `
      <div id="panel-${l.code}" class="editor-body-panel ${isPanelActive ? 'active' : ''}">
        <div style="margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:10px 16px; border-radius:8px; border:1px solid var(--admin-border);">
          <div>
            <strong style="color:var(--admin-text); font-size:0.95rem;">Editing: ${l.name} Version</strong>
            <span style="font-size:0.8rem; color:var(--admin-muted); margin-left:8px;">
              ${trans.id ? `(ID: ${trans.id} • Status: ${trans.status || 'draft'})` : '(New story draft)'}
            </span>
          </div>
          <div>
            <span class="badge ${l.code === 'as' ? 'badge-danger' : (l.code === 'hi' ? 'badge-warning' : 'badge-info')}">
              ISO: ${l.code}
            </span>
          </div>
        </div>

        <div class="form-grid-2">
          <!-- Left Column: Story Content -->
          <div>
            <!-- News Headline -->
            <div class="form-group">
              <label class="form-label" for="title-${l.code}">
                News Headline (${l.native}) *
              </label>
              <input type="text" id="title-${l.code}" class="form-control" 
                     placeholder="Enter captivating news headline in ${l.native}..." 
                     value="${escapeHtml(trans.title || '')}" required>
            </div>

            <!-- URL Slug -->
            <div class="form-group">
              <label class="form-label" for="slug-${l.code}">
                URL Slug <span class="form-label-desc">(Search-engine friendly, unique per language)</span>
              </label>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="color:var(--admin-muted); font-size:0.85rem;">/${l.code}/[category]/</span>
                <input type="text" id="slug-${l.code}" class="form-control" 
                       placeholder="auto-generated-or-custom-slug" 
                       value="${escapeHtml(trans.slug || '')}">
              </div>
            </div>

            <!-- Short Description / Lead Excerpt -->
            <div class="form-group">
              <label class="form-label" for="summary-${l.code}">
                Short Description / Summary Excerpt
              </label>
              <textarea id="summary-${l.code}" class="form-control" rows="3" 
                        placeholder="Brief 1-2 sentence lead paragraph summarizing the story in ${l.native}...">${escapeHtml(trans.summary || '')}</textarea>
            </div>

            <!-- Full Article Content -->
            <div class="form-group">
              <label class="form-label" for="content-${l.code}">
                Full Article Content (${l.native}) *
                <span class="form-label-desc">(HTML markup supported: &lt;p&gt;, &lt;h3&gt;, &lt;strong&gt;, quotes)</span>
              </label>
              <textarea id="content-${l.code}" class="form-control editor-content-area" 
                        placeholder="Write or paste full editorial story here...">${escapeHtml(trans.content || '')}</textarea>
            </div>
          </div>

          <!-- Right Column: Metadata, Featured Image, SEO & Toggles -->
          <div>
            <!-- Category Selection -->
            <div class="form-group">
              <label class="form-label" for="category-${l.code}">
                Category (${l.name})
              </label>
              <select id="category-${l.code}" class="form-control">
                <option value="">-- Select Category --</option>
                ${catList.map(c => `
                  <option value="${c.id}" ${trans.category_id === c.id ? 'selected' : ''}>${c.name} (${c.slug})</option>
                `).join('')}
              </select>
            </div>

            <!-- Featured Image -->
            <div class="form-group">
              <label class="form-label" for="image-${l.code}">
                Featured Image URL
              </label>
              <input type="text" id="image-${l.code}" class="form-control" 
                     placeholder="/uploads/brahmaputra_bridge.jpg" 
                     value="${escapeHtml(trans.featured_image || '/uploads/brahmaputra_bridge.jpg')}">
              <div style="margin-top:8px; display:flex; gap:6px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('image-${l.code}').value='/uploads/brahmaputra_bridge.jpg'">Bridge</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('image-${l.code}').value='/uploads/kaziranga_rhino.jpg'">Kaziranga</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('image-${l.code}').value='/uploads/nd30_news_banner.jpg'">ND30 Studio</button>
              </div>
            </div>

            <!-- Image Caption -->
            <div class="form-group">
              <label class="form-label" for="caption-${l.code}">
                Image Caption / Photo Credit
              </label>
              <input type="text" id="caption-${l.code}" class="form-control" 
                     placeholder="Photo caption in ${l.native}..." 
                     value="${escapeHtml(trans.image_caption || '')}">
            </div>

            <!-- Tags -->
            <div class="form-group">
              <label class="form-label" for="tags-${l.code}">
                Tags <span class="form-label-desc">(Comma separated)</span>
              </label>
              <input type="text" id="tags-${l.code}" class="form-control" 
                     placeholder="Assam, Breaking, Infrastructure..." 
                     value="${escapeHtml(trans.tags || '')}">
            </div>

            <!-- SEO Title -->
            <div class="form-group">
              <label class="form-label" for="seoTitle-${l.code}">
                SEO Meta Title
              </label>
              <input type="text" id="seoTitle-${l.code}" class="form-control" 
                     placeholder="Custom title for Google search results..." 
                     value="${escapeHtml(trans.seo_title || '')}">
            </div>

            <!-- SEO Description -->
            <div class="form-group">
              <label class="form-label" for="seoDescription-${l.code}">
                SEO Meta Description
              </label>
              <textarea id="seoDescription-${l.code}" class="form-control" rows="2" 
                        placeholder="Meta description under 160 characters...">${escapeHtml(trans.seo_description || '')}</textarea>
            </div>

            <!-- Editorial Flags -->
            <div class="form-group" style="background:#090d13; border:1px solid var(--admin-border); border-radius:8px; padding:14px;">
              <span class="form-label">Editorial Placement</span>
              <div style="display:flex; flex-direction:column; gap:8px; font-size:0.88rem;">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                  <input type="checkbox" id="featured-${l.code}" ${trans.is_featured ? 'checked' : ''}>
                  <span>🌟 Set as Featured Story (Hero display)</span>
                </label>
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                  <input type="checkbox" id="breaking-${l.code}" ${trans.is_breaking ? 'checked' : ''}>
                  <span>🔴 Add to Breaking News Ticker</span>
                </label>
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                  <input type="checkbox" id="trending-${l.code}" ${trans.is_trending ? 'checked' : ''}>
                  <span>🔥 Mark as Trending News</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      `;
    }).join('')}

    <!-- Universal Editorial Action Bar -->
    <div style="padding:20px 24px; background:#10141d; border-top:1px solid var(--admin-border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
        <button type="button" id="publishCurrentTabBtn" class="btn btn-secondary">
          Publish Active Tab Only
        </button>
        <button type="button" id="saveDraftsBtn" class="btn btn-secondary">
          💾 Save All as Drafts
        </button>
        ${article ? `
          ${Object.values(translationsByLang).some(t => t && t.status === 'published') ? `
            <button type="button" class="btn btn-warning btn-toggle-article-status" data-article-id="${article.id}" data-action="hide" data-title="this story" title="Hide from public portals">
              👁️ Hide Story
            </button>
          ` : `
            <button type="button" class="btn btn-success btn-toggle-article-status" data-article-id="${article.id}" data-action="unhide" data-title="this story" title="Publish to public portals">
              👁️ Unhide Story
            </button>
          `}
          <button type="button" class="btn btn-danger btn-delete-article" data-article-id="${article.id}" data-title="this story" data-redirect="/admin/articles" title="Permanently delete story and all translations">
            🗑️ Delete Story
          </button>
        ` : ''}
      </div>

      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:0.85rem; color:var(--admin-muted);">
          Trigger IFTTT syndication on publish: <strong>Enabled</strong>
        </span>
        <button type="button" id="publishAllBtn" class="btn btn-primary" style="font-size:1.02rem; padding:12px 28px; font-weight:800; background:linear-gradient(135deg, #dc2626, #991b1b); border:none; box-shadow:0 4px 14px rgba(220, 38, 38, 0.4);">
          🚀 Publish in All Languages (Assamese, Hindi & English)
        </button>
      </div>
    </div>
  </div>

  <!-- AI Translation Assistant Review Modal -->
  <div id="aiTranslationModal" class="modal-overlay">
    <div class="modal-dialog">
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.4rem;">✨</span>
          <h3 class="modal-title">AI Translation Assistant & Review Console</h3>
        </div>
        <button type="button" id="closeAiModalBtn" class="modal-close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <div style="background:rgba(124, 58, 237, 0.1); border:1px solid rgba(124, 58, 237, 0.3); border-radius:8px; padding:12px 16px; margin-bottom:20px; font-size:0.85rem; color:#c4b5fd;">
          <strong>Editorial Review Safety Notice:</strong> AI translations are generated as preview drafts only. You can inspect the translation, make editorial adjustments, and approve it before accepting it into the editor tab.
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:20px;">
          <div>
            <label class="form-label">Source Language (Translate From)</label>
            <select id="aiSourceLang" class="form-control">
              <option value="as">Assamese (অসমীয়া)</option>
              <option value="en" selected>English</option>
              <option value="hi">Hindi (हिंदी)</option>
            </select>
          </div>
          <div>
            <label class="form-label">Target Language (Translate To)</label>
            <select id="aiTargetLang" class="form-control">
              <option value="as" selected>Assamese (অসমীয়া)</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <button type="button" id="triggerAiTranslateBtn" class="btn btn-primary" style="width:100%; margin-bottom:20px;">
          Generate AI Translation Draft
        </button>

        <!-- Translation Preview Container -->
        <div id="aiResultContainer" style="display:none; border-top:1px solid var(--admin-border); padding-top:16px;">
          <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:12px; color:var(--admin-green);">
            ✓ Translation Generated - Review & Edit Draft:
          </h4>

          <div class="form-group">
            <label class="form-label">Translated Headline</label>
            <input type="text" id="aiPreviewTitle" class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label">Translated Summary</label>
            <textarea id="aiPreviewSummary" class="form-control" rows="2"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Translated Full Content</label>
            <textarea id="aiPreviewContent" class="form-control" rows="6"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Translated Tags</label>
            <input type="text" id="aiPreviewTags" class="form-control">
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('aiTranslationModal').classList.remove('active')">Cancel</button>
        <button type="button" id="acceptAiTranslationBtn" class="btn btn-success">
          ✓ Approve & Accept into Tab
        </button>
      </div>
    </div>
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
  renderEditorPage
};
