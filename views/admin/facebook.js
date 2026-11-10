/**
 * ND30 LIVE - Facebook Multilingual Import Review Dashboard
 * Manually add single or multiple Facebook posts & videos,
 * intelligent script detection (Assamese, Hindi, English),
 * bulk post deletion, and review queue management.
 */

const { db } = require('../../database/db');

function renderFacebookDashboard() {
  const posts = db.prepare('SELECT * FROM facebook_imported_posts ORDER BY id DESC LIMIT 150').all();

  const pendingPosts = posts.filter(p => p.status === 'pending_review');
  const importedDrafts = posts.filter(p => p.status === 'imported_draft');
  const loopPrevented = posts.filter(p => p.status === 'skipped_loop');
  const hiddenPosts = posts.filter(p => p.status === 'hidden');

  return `
  <!-- Top Header Bar -->
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
    <div>
      <h2 style="font-size:1.45rem; font-weight:800; display:flex; align-items:center; gap:10px;">
        <span style="display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; background:#1877F2; color:#fff; border-radius:50%; font-weight:bold; font-size:1.1rem;">f</span>
        Facebook Multilingual Ingest & Review
      </h2>
      <p style="font-size:0.85rem; color:var(--admin-muted); margin-top:4px;">
        Add single or multiple Facebook video/post links, review with Assamese, Hindi & English script detection, or delete posts in bulk.
      </p>
    </div>
    <div style="display:flex; gap:12px; flex-wrap:wrap;">
      <button type="button" id="openAddFbLinksModalBtn" onclick="openAddFbLinksModal()" class="btn btn-success" style="display:flex; align-items:center; gap:8px; font-weight:700; padding:10px 20px; font-size:0.95rem; box-shadow:0 2px 10px rgba(34,197,94,0.35);">
        <span style="font-size:1.2rem; line-height:1;">+</span> Add Post / Video Links
      </button>
    </div>
  </div>

  <!-- Bulk Action Bar (Visible when posts are selected) -->
  <div id="fbBulkActionBar" style="display:none; align-items:center; justify-content:space-between; background:linear-gradient(90deg, rgba(239,68,68,0.18), rgba(220,38,38,0.12)); border:1px solid rgba(239,68,68,0.4); border-radius:8px; padding:12px 18px; margin-bottom:16px; flex-wrap:wrap; gap:14px; animation:fadeIn 0.2s ease;">
    <div style="display:flex; align-items:center; gap:14px;">
      <span style="font-weight:700; color:#fca5a5; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
        <span style="font-size:1.1rem;">☑️</span> <span id="fbSelectedCountText">0</span> post(s) selected
      </span>
      <button type="button" class="btn btn-secondary btn-sm" onclick="clearAllFbSelection()" style="padding:4px 12px; font-size:0.78rem;">
        Clear Selection
      </button>
    </div>
    <div style="display:flex; gap:10px; align-items:center;">
      <button type="button" id="btnBulkDeleteFbPosts" onclick="deleteSelectedFbPosts()" class="btn btn-danger btn-sm" style="display:flex; align-items:center; gap:8px; font-weight:700; padding:8px 18px; background:#dc2626; box-shadow:0 2px 8px rgba(220,38,38,0.4);">
        <span>🗑️</span> Delete Selected (<span id="fbBulkDeleteCountText">0</span>)
      </button>
    </div>
  </div>

  <!-- Ingest Status Filter Pills, Search & Select All -->
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:14px;">
    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;" id="fbFilterPills">
      <span class="badge filter-pill active" data-filter="all" style="font-size:0.85rem; padding:8px 14px; background:rgba(255,255,255,0.12); color:#fff; cursor:pointer;">
        All Posts (<span id="fbCountAll">${posts.length}</span>)
      </span>
      <span class="badge filter-pill badge-warning" data-filter="pending_review" style="font-size:0.85rem; padding:8px 14px; cursor:pointer;">
        Awaiting Review (<span id="fbCountPending">${pendingPosts.length}</span>)
      </span>
      <span class="badge filter-pill badge-success" data-filter="imported_draft" style="font-size:0.85rem; padding:8px 14px; cursor:pointer;">
        Imported as Draft (<span id="fbCountDraft">${importedDrafts.length}</span>)
      </span>
      <span class="badge filter-pill badge-danger" data-filter="hidden" style="font-size:0.85rem; padding:8px 14px; cursor:pointer;">
        Hidden (<span id="fbCountHidden">${hiddenPosts.length}</span>)
      </span>
      <span class="badge filter-pill badge-purple" data-filter="skipped_loop" style="font-size:0.85rem; padding:8px 14px; cursor:pointer;">
        Loops Prevented (<span id="fbCountLoop">${loopPrevented.length}</span>)
      </span>
    </div>

    <div style="display:flex; gap:10px; align-items:center; flex-grow:1; max-width:440px;">
      <input type="text" id="fbSearchInput" class="form-control" placeholder="🔍 Search imported posts..." style="font-size:0.85rem; padding:8px 14px; flex:1;">
      <button type="button" class="btn btn-secondary btn-sm" onclick="selectAllVisibleFbPosts()" style="white-space:nowrap; padding:8px 14px; font-size:0.8rem; font-weight:600;" title="Select all visible posts in this view">
        ☑️ Select All
      </button>
    </div>
  </div>

  <!-- Imported Posts Table -->
  <div class="admin-table-container">
    <table class="admin-table" id="fbPostsTable">
      <thead>
        <tr>
          <th style="width:40px; text-align:center;">
            <input type="checkbox" id="fbSelectAllMaster" title="Select / Deselect All Visible Posts" onchange="toggleSelectAllFbPosts(this)" style="cursor:pointer; width:16px; height:16px;">
          </th>
          <th>Post ID & Preview</th>
          <th>Detected Language</th>
          <th>Confidence</th>
          <th>Suggested Section</th>
          <th>Status</th>
          <th style="min-width:210px;">Actions</th>
        </tr>
      </thead>
      <tbody id="fbTableBody">
        ${posts.length === 0 ? `
          <tr id="fbNoPostsRow">
            <td colspan="7" style="text-align:center; padding:36px; color:var(--admin-muted);">
              <div style="font-size:2.2rem; margin-bottom:8px;">🔗</div>
              <h4 style="font-size:1.05rem; font-weight:700; color:var(--admin-text); margin-bottom:4px;">No Facebook posts imported yet</h4>
              <p style="font-size:0.82rem; margin-bottom:14px;">Click "+ Add Post / Video Links" above to import your first Facebook video or post link.</p>
              <button type="button" class="btn btn-success btn-sm" onclick="openAddFbLinksModal()">+ Add Post / Video Links</button>
            </td>
          </tr>
        ` : posts.map(post => {
          const isPending = post.status === 'pending_review';
          const isLoop = post.status === 'skipped_loop';
          const isHidden = post.status === 'hidden';

          const mediaType = post.media_type || 'post';
          let mediaBadge = '<span class="badge" style="background:#4b5563; color:#fff; font-size:0.68rem; padding:2px 6px;">📝 Post</span>';
          if (mediaType === 'video') {
            mediaBadge = '<span class="badge" style="background:#dc2626; color:#fff; font-size:0.68rem; padding:2px 6px;">🎬 Video</span>';
          } else if (mediaType === 'reel') {
            mediaBadge = '<span class="badge" style="background:#e11d48; color:#fff; font-size:0.68rem; padding:2px 6px;">📱 Reel</span>';
          } else if (mediaType === 'photo') {
            mediaBadge = '<span class="badge" style="background:#0284c7; color:#fff; font-size:0.68rem; padding:2px 6px;">📷 Photo</span>';
          }

          return `
            <tr class="fb-post-row" data-status="${post.status}" data-id="${post.id}" id="fb-row-${post.id}">
              <td style="text-align:center;">
                <input type="checkbox" class="fb-post-select-checkbox" data-id="${post.id}" onchange="updateFbSelectionBar()" style="cursor:pointer; width:16px; height:16px;">
              </td>
              <td style="max-width:320px;">
                <div style="display:flex; gap:10px; align-items:flex-start;">
                  ${post.image_url ? `<img src="${post.image_url}" style="width:48px; height:48px; border-radius:6px; object-fit:cover; flex-shrink:0;">` : ''}
                  <div>
                    <div class="fb-post-text" style="font-size:0.85rem; font-weight:600; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                      ${escapeHtml(post.message || 'No text content')}
                    </div>
                    <div style="display:flex; align-items:center; gap:6px; margin-top:4px; flex-wrap:wrap;">
                      ${mediaBadge}
                      <span style="font-size:0.72rem; color:var(--admin-muted); font-family:monospace;">
                        ID: ${escapeHtml(post.fb_post_id)}
                      </span>
                      ${post.post_url ? `
                        <a href="${escapeHtml(post.post_url)}" target="_blank" rel="noopener noreferrer" style="color:#58a6ff; font-size:0.72rem; text-decoration:none; display:inline-flex; align-items:center; gap:2px;">
                          <span>🔗</span> FB ↗
                        </a>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge ${post.detected_lang === 'as' ? 'badge-danger' : (post.detected_lang === 'hi' ? 'badge-warning' : (post.detected_lang === 'en' ? 'badge-info' : 'badge-purple'))}">
                  ${(post.detected_lang || 'UNKNOWN').toUpperCase()}
                </span>
              </td>
              <td>
                <span style="font-weight:700; font-size:0.85rem; color:${post.confidence >= 0.7 ? '#34d399' : '#fbbf24'};">
                  ${((post.confidence || 0) * 100).toFixed(0)}%
                </span>
              </td>
              <td>
                <strong>${(post.suggested_lang || 'as').toUpperCase()}</strong>
              </td>
              <td>
                <span class="badge ${isPending ? 'badge-warning' : (isHidden ? 'badge-danger' : (isLoop ? 'badge-purple' : 'badge-success'))}">
                  ${post.status}
                </span>
              </td>
              <td style="white-space:nowrap;">
                <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                  ${isPending ? `
                    <button type="button" class="btn btn-primary btn-sm btn-review-fb-post"
                            data-post-id="${post.id}"
                            data-message="${escapeHtml(post.message)}"
                            data-suggested-lang="${post.suggested_lang || 'as'}"
                            data-post-url="${escapeHtml(post.post_url || '')}"
                            data-media-type="${escapeHtml(mediaType)}">
                      Review & Assign
                    </button>
                  ` : (post.imported_article_id ? `
                    <a href="/admin/editor?id=${post.imported_article_id}" class="btn btn-secondary btn-sm">
                      Open Draft
                    </a>
                  ` : (isHidden ? `
                    <span class="badge badge-danger" style="font-size:0.75rem;">Hidden</span>
                  ` : `<span style="font-size:0.78rem; color:var(--admin-muted);">Protected</span>`))}

                  ${isHidden ? `
                    <button type="button" class="btn btn-secondary btn-sm btn-toggle-fb-post-hide"
                            data-post-id="${post.id}"
                            data-action="unhide"
                            title="Restore this post to review queue">
                      👁️ Unhide
                    </button>
                  ` : `
                    <button type="button" class="btn btn-warning btn-sm btn-toggle-fb-post-hide"
                            data-post-id="${post.id}"
                            data-action="hide"
                            title="Hide this post from the review queue">
                      👁️ Hide
                    </button>
                  `}

                  <button type="button" class="btn btn-danger btn-sm btn-delete-fb-post"
                          data-post-id="${post.id}"
                          data-snippet="${escapeHtml((post.message || post.fb_post_id).slice(0, 40))}"
                          title="Permanently delete imported post">
                    🗑️ Delete
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- Review & Assign Modal -->
  <div id="fbReviewModal" class="modal-overlay">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">Manual Language Review & Assignment</h3>
        <button type="button" id="closeFbModalBtn" onclick="document.getElementById('fbReviewModal').classList.remove('active')" class="modal-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="fbReviewPostId">

        <div id="fbReviewSourceLinkWrapper" style="display:none; margin-bottom:14px; font-size:0.8rem; background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:8px 12px; align-items:center; justify-content:space-between;">
          <span style="color:var(--admin-muted);" id="fbReviewMediaTypeBadge">Original Post</span>
          <a id="fbReviewSourceLink" href="#" target="_blank" rel="noopener noreferrer" style="color:#58a6ff; font-weight:600; text-decoration:none;">
            <span>🔗</span> Open Original on Facebook ↗
          </a>
        </div>

        <div class="form-group">
          <label class="form-label">Assign to Language Section *</label>
          <select id="fbReviewLang" class="form-control">
            <option value="as">Assamese – অসমীয়া (/as/)</option>
            <option value="hi">Hindi – हिंदी (/hi/)</option>
            <option value="en">English (/en/)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Story Headline (Generated from post)</label>
          <input type="text" id="fbReviewHeadline" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Full Post Content</label>
          <textarea id="fbReviewContent" class="form-control" rows="5"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('fbReviewModal').classList.remove('active')">Cancel</button>
        <button type="button" id="approveFbPostBtn" class="btn btn-success">
          ✓ Approve & Create Draft
        </button>
      </div>
    </div>
  </div>

  <!-- Add Facebook Links Modal (Single & Multiple Bulk Import) -->
  <div id="fbAddLinksModal" class="modal-overlay">
    <div class="modal-dialog" style="max-width:620px;">
      <div class="modal-header">
        <div>
          <h3 class="modal-title" style="display:flex; align-items:center; gap:8px;">
            <span>➕</span> Add Facebook Post or Video Links
          </h3>
          <p style="font-size:0.78rem; color:var(--admin-muted); margin:4px 0 0 0;">
            Manually import Facebook videos, reels, photos, or posts with intelligent script detection.
          </p>
        </div>
        <button type="button" id="closeAddFbLinksModalBtn" onclick="closeAddFbLinksModal()" class="modal-close-btn">&times;</button>
      </div>

      <!-- Tab Navigation -->
      <div style="display:flex; border-bottom:1px solid var(--admin-border); padding:0 20px; background:rgba(0,0,0,0.15);">
        <button type="button" id="fbTabSingleBtn" class="fb-tab-btn" onclick="switchFbTab('single')" style="padding:12px 18px; border:none; background:none; color:#fff; font-weight:700; font-size:0.88rem; cursor:pointer; border-bottom:2px solid #22c55e; transition:all 0.2s;">
          🔗 Single Link
        </button>
        <button type="button" id="fbTabBulkBtn" class="fb-tab-btn" onclick="switchFbTab('bulk')" style="padding:12px 18px; border:none; background:none; color:var(--admin-muted); font-weight:600; font-size:0.88rem; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.2s;">
          📋 Multiple Links (Bulk Import)
        </button>
      </div>

      <div class="modal-body" style="padding:20px;">
        <!-- TAB 1: SINGLE LINK -->
        <div id="fbTabSingleContent">
          <div class="form-group">
            <label class="form-label">
              <span>Facebook Link (Post / Video / Reel / Watch) *</span>
            </label>
            <div style="display:flex; gap:8px;">
              <input type="url" id="fbSingleUrl" class="form-control" placeholder="https://www.facebook.com/watch/?v=... or /reel/... or /posts/..." required style="flex:1;">
              <button type="button" id="fbFetchPreviewBtn" onclick="fetchFbPreview()" class="btn btn-secondary" style="white-space:nowrap; padding:8px 14px;">
                🔍 Preview
              </button>
            </div>
            <span style="font-size:0.75rem; color:var(--admin-muted); margin-top:4px; display:block;">
              Supports public video, reel, photo, and standard post URLs.
            </span>
          </div>

          <!-- Preview Card (Loaded via AJAX) -->
          <div id="fbSinglePreviewCard" style="display:none; background:rgba(255,255,255,0.03); border:1px solid var(--admin-border); border-radius:8px; padding:12px; margin-bottom:16px;">
            <div style="display:flex; gap:12px; align-items:flex-start;">
              <div id="fbPreviewImgWrapper" style="width:70px; height:70px; border-radius:6px; background:#111; overflow:hidden; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                <img id="fbPreviewImg" src="" style="width:100%; height:100%; object-fit:cover; display:none;">
                <span id="fbPreviewPlaceholderIcon" style="font-size:1.8rem;">🎬</span>
              </div>
              <div style="flex:1; min-width:0;">
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                  <span id="fbPreviewTypeBadge" class="badge badge-purple" style="font-size:0.7rem; text-transform:uppercase;">VIDEO</span>
                  <span id="fbPreviewPostId" style="font-size:0.72rem; color:var(--admin-muted); font-family:monospace;"></span>
                </div>
                <div id="fbPreviewTitle" style="font-size:0.88rem; font-weight:700; color:#fff; line-height:1.3; margin-bottom:4px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;"></div>
                <div id="fbPreviewDesc" style="font-size:0.78rem; color:var(--admin-muted); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;"></div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Story Headline (Optional – auto-scraped if empty)</label>
            <input type="text" id="fbSingleHeadline" class="form-control" placeholder="Leave blank to use Facebook title or caption">
          </div>

          <div class="form-group">
            <label class="form-label">Story Content / Summary (Optional – auto-scraped if empty)</label>
            <textarea id="fbSingleContent" class="form-control" rows="3" placeholder="Leave blank to use post description or video caption"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Target Language Section</label>
            <select id="fbSingleLang" class="form-control">
              <option value="auto">🌐 Auto-Detect Script (Assamese, Hindi, or English)</option>
              <option value="as">Assamese – অসমীয়া (/as/)</option>
              <option value="hi">Hindi – हिंदी (/hi/)</option>
              <option value="en">English (/en/)</option>
            </select>
          </div>

          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px; margin-top:14px;">
            <label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; margin:0;">
              <input type="checkbox" id="fbSingleAutoDraft" style="margin-top:3px;">
              <div>
                <strong style="color:var(--admin-text); font-size:0.85rem; display:block;">Instant Multi-Language Drafts</strong>
                <span style="font-size:0.75rem; color:var(--admin-muted); display:block; margin-top:2px;">
                  Automatically generate drafts across Assamese, Hindi, and English (embeds video player automatically). Uncheck to keep in Review Queue first.
                </span>
              </div>
            </label>
          </div>
        </div>

        <!-- TAB 2: MULTIPLE LINKS (BULK IMPORT) -->
        <div id="fbTabBulkContent" style="display:none;">
          <div style="background:rgba(88,166,255,0.08); border:1px solid rgba(88,166,255,0.2); border-radius:8px; padding:12px; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              <span style="font-size:1.1rem;">⚡</span>
              <strong style="font-size:0.88rem; color:#58a6ff;">Bulk Facebook Ingest Engine</strong>
            </div>
            <p style="font-size:0.78rem; color:var(--admin-muted); margin:0;">
              Paste multiple Facebook video or post links below (one per line, or comma-separated). The engine extracts video IDs, scrapes preview data, detects languages, and prevents duplicate ingestion automatically.
            </p>
          </div>

          <div class="form-group">
            <label class="form-label" style="display:flex; justify-content:space-between; align-items:center;">
              <span>Paste Facebook URLs (One URL per line) *</span>
              <span id="fbBulkCountBadge" class="badge badge-purple" style="font-size:0.75rem; padding:3px 8px;">0 Links Detected</span>
            </label>
            <textarea id="fbBulkUrls" class="form-control" rows="7" placeholder="https://www.facebook.com/watch/?v=123456789
https://www.facebook.com/reel/987654321
https://www.facebook.com/nd30live/posts/101584729182
https://fb.watch/xyz123abc/"></textarea>
            <span style="font-size:0.75rem; color:var(--admin-muted); margin-top:4px; display:block;">
              You can paste a single link or dozens of links at once. Supports all Facebook desktop and mobile formats.
            </span>
          </div>

          <div class="form-group">
            <label class="form-label">Default Language Section</label>
            <select id="fbBulkLang" class="form-control">
              <option value="auto">🌐 Auto-Detect Script for Each Post</option>
              <option value="as">Assamese – অসমীয়া (/as/)</option>
              <option value="hi">Hindi – हिंदी (/hi/)</option>
              <option value="en">English (/en/)</option>
            </select>
          </div>

          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px; margin-top:14px;">
            <label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; margin:0;">
              <input type="checkbox" id="fbBulkAutoDraft" style="margin-top:3px;">
              <div>
                <strong style="color:var(--admin-text); font-size:0.85rem; display:block;">Instant Multi-Language Drafts</strong>
                <span style="font-size:0.75rem; color:var(--admin-muted); display:block; margin-top:2px;">
                  Bypass the review queue and immediately generate 3-language drafts with responsive video embeds for all valid links.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="padding:14px 20px;">
        <button type="button" class="btn btn-secondary" onclick="closeAddFbLinksModal()">Cancel</button>
        <button type="button" id="submitAddFbLinksBtn" onclick="submitAddFbLinks()" class="btn btn-success" style="display:flex; align-items:center; gap:6px;">
          <span>🚀</span> <span id="submitAddFbLinksBtnText">Import Facebook Link</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Dedicated Inline Controller Script (Guarantees zero caching latency) -->
  <script>
    var currentFbMode = 'single';

    function openAddFbLinksModal() {
      var modal = document.getElementById('fbAddLinksModal');
      if (modal) {
        modal.classList.add('active');
        setTimeout(function() {
          var input = document.getElementById('fbSingleUrl');
          if (input) input.focus();
        }, 100);
      }
    }

    function closeAddFbLinksModal() {
      var modal = document.getElementById('fbAddLinksModal');
      if (modal) modal.classList.remove('active');
    }

    function switchFbTab(tab) {
      currentFbMode = tab;
      var btnSingle = document.getElementById('fbTabSingleBtn');
      var btnBulk = document.getElementById('fbTabBulkBtn');
      var contentSingle = document.getElementById('fbTabSingleContent');
      var contentBulk = document.getElementById('fbTabBulkContent');
      var submitText = document.getElementById('submitAddFbLinksBtnText');

      if (tab === 'single') {
        if (btnSingle) { btnSingle.style.color = '#fff'; btnSingle.style.borderBottom = '2px solid #22c55e'; }
        if (btnBulk) { btnBulk.style.color = 'var(--admin-muted)'; btnBulk.style.borderBottom = '2px solid transparent'; }
        if (contentSingle) contentSingle.style.display = 'block';
        if (contentBulk) contentBulk.style.display = 'none';
        if (submitText) submitText.innerText = 'Import Facebook Link';
      } else {
        if (btnBulk) { btnBulk.style.color = '#fff'; btnBulk.style.borderBottom = '2px solid #22c55e'; }
        if (btnSingle) { btnSingle.style.color = 'var(--admin-muted)'; btnSingle.style.borderBottom = '2px solid transparent'; }
        if (contentSingle) contentSingle.style.display = 'none';
        if (contentBulk) contentBulk.style.display = 'block';
        if (submitText) submitText.innerText = 'Import All Links (Bulk)';
        updateBulkLinksCount();
      }
    }

    function updateBulkLinksCount() {
      var textarea = document.getElementById('fbBulkUrls');
      var badge = document.getElementById('fbBulkCountBadge');
      if (!textarea || !badge) return;
      var lines = textarea.value.split(/[\\r\\n,]+/);
      var valid = lines.filter(function(line) {
        var t = line.trim();
        return t && (t.includes('facebook.com') || t.includes('fb.watch') || t.includes('fb.com'));
      });
      badge.innerText = valid.length + ' Links Detected';
      badge.className = valid.length > 0 ? 'badge badge-success' : 'badge badge-purple';
    }

    var bulkInput = document.getElementById('fbBulkUrls');
    if (bulkInput) {
      bulkInput.addEventListener('input', updateBulkLinksCount);
      bulkInput.addEventListener('paste', function() { setTimeout(updateBulkLinksCount, 100); });
    }

    async function fetchFbPreview() {
      var urlInput = document.getElementById('fbSingleUrl');
      var url = urlInput ? urlInput.value.trim() : '';
      if (!url) {
        alert('Please enter a Facebook URL to preview.');
        return;
      }

      var btn = document.getElementById('fbFetchPreviewBtn');
      if (btn) { btn.disabled = true; btn.innerText = 'Fetching...'; }

      try {
        var res = await fetch('/api/admin/facebook/preview-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url })
        });
        var data = await res.json();

        if (data.success && data.metadata) {
          var card = document.getElementById('fbSinglePreviewCard');
          var titleEl = document.getElementById('fbPreviewTitle');
          var descEl = document.getElementById('fbPreviewDesc');
          var typeBadge = document.getElementById('fbPreviewTypeBadge');
          var postIdEl = document.getElementById('fbPreviewPostId');
          var imgEl = document.getElementById('fbPreviewImg');
          var iconEl = document.getElementById('fbPreviewPlaceholderIcon');

          if (card) card.style.display = 'block';
          if (titleEl) titleEl.innerText = data.metadata.title || 'Facebook Post';
          if (descEl) descEl.innerText = data.metadata.description || 'No description preview available.';
          if (typeBadge) typeBadge.innerText = (data.urlInfo && data.urlInfo.mediaType ? data.urlInfo.mediaType : 'POST').toUpperCase();
          if (postIdEl) postIdEl.innerText = 'ID: ' + (data.urlInfo && data.urlInfo.postId ? data.urlInfo.postId : '');

          if (data.metadata.image && imgEl) {
            imgEl.src = data.metadata.image;
            imgEl.style.display = 'block';
            if (iconEl) iconEl.style.display = 'none';
          } else {
            if (imgEl) imgEl.style.display = 'none';
            if (iconEl) iconEl.style.display = 'inline-block';
          }

          var headlineInput = document.getElementById('fbSingleHeadline');
          var contentInput = document.getElementById('fbSingleContent');
          if (headlineInput && !headlineInput.value.trim() && data.metadata.title) {
            headlineInput.value = data.metadata.title;
          }
          if (contentInput && !contentInput.value.trim() && data.metadata.description) {
            contentInput.value = data.metadata.description;
          }

          if (typeof showAdminToast === 'function') {
            showAdminToast('Metadata fetched successfully!');
          }
        } else {
          alert('Could not fetch preview: ' + (data.error || 'Check that the URL is public.'));
        }
      } catch (err) {
        alert('Error fetching preview: ' + err.message);
      } finally {
        if (btn) { btn.disabled = false; btn.innerText = '🔍 Preview'; }
      }
    }

    async function submitAddFbLinks() {
      var btn = document.getElementById('submitAddFbLinksBtn');
      var btnText = document.getElementById('submitAddFbLinksBtnText');
      if (btn) btn.disabled = true;

      try {
        if (currentFbMode === 'single') {
          var url = document.getElementById('fbSingleUrl') ? document.getElementById('fbSingleUrl').value.trim() : '';
          if (!url) {
            alert('Please enter a Facebook URL.');
            if (btn) btn.disabled = false;
            return;
          }

          var headline = document.getElementById('fbSingleHeadline') ? document.getElementById('fbSingleHeadline').value.trim() : '';
          var content = document.getElementById('fbSingleContent') ? document.getElementById('fbSingleContent').value.trim() : '';
          var lang = document.getElementById('fbSingleLang') ? document.getElementById('fbSingleLang').value : 'auto';
          var autoDraft = document.getElementById('fbSingleAutoDraft') ? document.getElementById('fbSingleAutoDraft').checked : false;

          if (btnText) btnText.innerText = 'Importing...';

          var res = await fetch('/api/admin/facebook/import-links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'single',
              url: url,
              customHeadline: headline,
              customContent: content,
              defaultLang: lang,
              autoDraft: autoDraft
            })
          });

          var data = await res.json();
          if (data.success) {
            if (typeof showAdminToast === 'function') {
              showAdminToast(data.message || 'Facebook link imported successfully!');
            }
            closeAddFbLinksModal();
            setTimeout(function() { window.location.reload(); }, 1000);
          } else {
            alert('Import failed: ' + (data.error || 'Unknown error'));
            if (btn) btn.disabled = false;
            if (btnText) btnText.innerText = 'Import Facebook Link';
          }
        } else {
          var rawLinks = document.getElementById('fbBulkUrls') ? document.getElementById('fbBulkUrls').value.trim() : '';
          if (!rawLinks) {
            alert('Please paste at least one Facebook URL.');
            if (btn) btn.disabled = false;
            return;
          }

          var bulkLang = document.getElementById('fbBulkLang') ? document.getElementById('fbBulkLang').value : 'auto';
          var bulkAutoDraft = document.getElementById('fbBulkAutoDraft') ? document.getElementById('fbBulkAutoDraft').checked : false;

          if (btnText) btnText.innerText = 'Importing Links in Bulk...';

          var resBulk = await fetch('/api/admin/facebook/import-links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'bulk',
              links: rawLinks,
              defaultLang: bulkLang,
              autoDraft: bulkAutoDraft
            })
          });

          var dataBulk = await resBulk.json();
          if (dataBulk.success) {
            alert('Bulk Import Report:\\n\\n• Successfully Imported: ' + (dataBulk.imported || 0) + '\\n• Already Existed: ' + (dataBulk.alreadyExisted || 0) + '\\n• Errors: ' + (dataBulk.failed || 0) + '\\n\\nPage will now refresh.');
            closeAddFbLinksModal();
            setTimeout(function() { window.location.reload(); }, 600);
          } else {
            alert('Bulk import failed: ' + (dataBulk.error || 'Unknown error'));
            if (btn) btn.disabled = false;
            if (btnText) btnText.innerText = 'Import All Links (Bulk)';
          }
        }
      } catch (err) {
        alert('Network error: ' + err.message);
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerText = currentFbMode === 'single' ? 'Import Facebook Link' : 'Import All Links (Bulk)';
      }
    }

    // ==========================================
    // MULTIPLE POST SELECTION & BULK DELETION
    // ==========================================
    function updateFbSelectionBar() {
      var checkboxes = document.querySelectorAll('.fb-post-select-checkbox:checked');
      var count = checkboxes.length;
      var bar = document.getElementById('fbBulkActionBar');
      var countText = document.getElementById('fbSelectedCountText');
      var delCountText = document.getElementById('fbBulkDeleteCountText');
      var master = document.getElementById('fbSelectAllMaster');

      if (countText) countText.innerText = count;
      if (delCountText) delCountText.innerText = count;

      if (bar) {
        if (count > 0) {
          bar.style.display = 'flex';
        } else {
          bar.style.display = 'none';
        }
      }

      var allVisibleBoxes = Array.from(document.querySelectorAll('.fb-post-row')).filter(function(r) {
        return r.style.display !== 'none';
      }).map(function(r) {
        return r.querySelector('.fb-post-select-checkbox');
      }).filter(Boolean);

      if (master) {
        master.checked = allVisibleBoxes.length > 0 && allVisibleBoxes.every(function(b) { return b.checked; });
      }
    }

    function toggleSelectAllFbPosts(master) {
      var isChecked = master ? master.checked : false;
      var visibleRows = document.querySelectorAll('.fb-post-row');
      visibleRows.forEach(function(row) {
        if (row.style.display !== 'none') {
          var cb = row.querySelector('.fb-post-select-checkbox');
          if (cb) cb.checked = isChecked;
        }
      });
      updateFbSelectionBar();
    }

    function selectAllVisibleFbPosts() {
      var visibleRows = document.querySelectorAll('.fb-post-row');
      var anyUnchecked = false;
      visibleRows.forEach(function(row) {
        if (row.style.display !== 'none') {
          var cb = row.querySelector('.fb-post-select-checkbox');
          if (cb && !cb.checked) anyUnchecked = true;
        }
      });

      var targetState = anyUnchecked ? true : false;
      visibleRows.forEach(function(row) {
        if (row.style.display !== 'none') {
          var cb = row.querySelector('.fb-post-select-checkbox');
          if (cb) cb.checked = targetState;
        }
      });
      updateFbSelectionBar();
    }

    function clearAllFbSelection() {
      document.querySelectorAll('.fb-post-select-checkbox').forEach(function(cb) {
        cb.checked = false;
      });
      var master = document.getElementById('fbSelectAllMaster');
      if (master) master.checked = false;
      updateFbSelectionBar();
    }

    async function deleteSelectedFbPosts() {
      var checked = document.querySelectorAll('.fb-post-select-checkbox:checked');
      var ids = Array.from(checked).map(function(cb) {
        return cb.getAttribute('data-id');
      }).filter(Boolean);

      if (ids.length === 0) {
        alert('Please select at least one post to delete.');
        return;
      }

      var confirmMsg = 'Are you sure you want to permanently delete ' + ids.length + ' selected Facebook post(s)?\\n\\nThis action cannot be undone.';
      if (!confirm(confirmMsg)) return;

      var delBtn = document.getElementById('btnBulkDeleteFbPosts');
      if (delBtn) { delBtn.disabled = true; delBtn.innerHTML = '<span>⏳</span> Deleting...'; }

      try {
        var res = await fetch('/api/admin/facebook/posts/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postIds: ids })
        });
        var data = await res.json();

        if (data.success) {
          if (typeof showAdminToast === 'function') {
            showAdminToast(data.message || (ids.length + ' posts deleted successfully.'));
          }
          ids.forEach(function(id) {
            var row = document.getElementById('fb-row-' + id);
            if (row) {
              row.style.transition = 'all 0.3s ease';
              row.style.opacity = '0';
              setTimeout(function() { row.remove(); }, 300);
            }
          });
          clearAllFbSelection();
          setTimeout(function() { window.location.reload(); }, 900);
        } else {
          alert('Delete failed: ' + (data.error || 'Unknown error'));
          if (delBtn) { delBtn.disabled = false; delBtn.innerHTML = '<span>🗑️</span> Delete Selected (' + ids.length + ')'; }
        }
      } catch (err) {
        alert('Network error deleting posts: ' + err.message);
        if (delBtn) { delBtn.disabled = false; delBtn.innerHTML = '<span>🗑️</span> Delete Selected (' + ids.length + ')'; }
      }
    }

    // Filter Pills and Search
    function filterFbTable() {
      var activePill = document.querySelector('#fbFilterPills .filter-pill.active');
      var activeFilter = activePill ? activePill.getAttribute('data-filter') : 'all';
      var searchInput = document.getElementById('fbSearchInput');
      var query = searchInput ? searchInput.value.toLowerCase().trim() : '';
      var rows = document.querySelectorAll('.fb-post-row');

      rows.forEach(function(row) {
        var status = row.getAttribute('data-status');
        var text = row.textContent.toLowerCase();
        var matchesStatus = (activeFilter === 'all') || (status === activeFilter);
        var matchesQuery = !query || text.includes(query);
        row.style.display = (matchesStatus && matchesQuery) ? '' : 'none';
      });

      updateFbSelectionBar();
    }

    var filterPills = document.querySelectorAll('#fbFilterPills .filter-pill');
    filterPills.forEach(function(pill) {
      pill.addEventListener('click', function() {
        filterPills.forEach(function(p) {
          p.classList.remove('active');
          p.style.background = '';
          p.style.color = '';
        });
        pill.classList.add('active');
        pill.style.background = 'rgba(255,255,255,0.12)';
        pill.style.color = '#fff';
        filterFbTable();
      });
    });

    var fbSearchEl = document.getElementById('fbSearchInput');
    if (fbSearchEl) {
      fbSearchEl.addEventListener('input', filterFbTable);
    }
  </script>`;
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
  renderFacebookDashboard
};
