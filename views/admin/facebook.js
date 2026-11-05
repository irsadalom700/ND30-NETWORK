/**
 * ND30 LIVE - Facebook Multilingual Import Review Dashboard
 * Meta Graph API sync, automatic language detection confidence,
 * review queue, manual language assignment, and Facebook Page/Profile connect/disconnect.
 */

const { db } = require('../../database/db');

function renderFacebookDashboard() {
  const pages = db.prepare('SELECT * FROM facebook_pages ORDER BY id DESC').all();
  const posts = db.prepare('SELECT * FROM facebook_imported_posts ORDER BY id DESC LIMIT 100').all();

  const pendingPosts = posts.filter(p => p.status === 'pending_review');
  const importedDrafts = posts.filter(p => p.status === 'imported_draft');
  const loopPrevented = posts.filter(p => p.status === 'skipped_loop');
  const hiddenPosts = posts.filter(p => p.status === 'hidden');

  return `
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
    <div>
      <h2 style="font-size:1.4rem; font-weight:800;">Facebook Multilingual Ingest & Review</h2>
      <p style="font-size:0.85rem; color:var(--admin-muted);">
        Meta Graph API real-time import with intelligent Assamese, Hindi, and English script detection for ND30 LIVE.
      </p>
    </div>
    <div style="display:flex; gap:12px; flex-wrap:wrap;">
      <button type="button" id="openConnectFbModalBtn" class="btn btn-primary" style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:1.1rem; line-height:1;">+</span> Connect Facebook Page / Profile
      </button>
      <button type="button" id="syncFbBtn" class="btn btn-secondary" style="display:flex; align-items:center; gap:6px;">
        <span>🔄</span> Sync Facebook Now
      </button>
    </div>
  </div>

  <!-- Connected Facebook Pages & Profiles Grid -->
  <div style="margin-bottom:28px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
      <h3 style="font-size:1.05rem; font-weight:700;">Connected Facebook Pages & Profiles</h3>
      <span style="font-size:0.8rem; color:var(--admin-muted);">${pages.length} Connected</span>
    </div>

    ${pages.length === 0 ? `
      <div style="background:var(--admin-card); border:1px dashed var(--admin-border); border-radius:10px; padding:36px 20px; text-align:center;">
        <div style="font-size:2.4rem; margin-bottom:10px;">🔗</div>
        <h4 style="font-size:1.1rem; font-weight:700; margin-bottom:6px;">No Facebook Page or Profile Connected</h4>
        <p style="font-size:0.85rem; color:var(--admin-muted); max-width:480px; margin:0 auto 18px auto;">
          Connect your Facebook Page or Profile link to enable real-time post ingest, script detection, and instant publishing to ND30 LIVE.
        </p>
        <button type="button" class="btn btn-primary" onclick="document.getElementById('fbConnectModal').classList.add('active')">
          + Connect Facebook Page / Profile
        </button>
      </div>
    ` : `
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">
        ${pages.map(page => `
          <div style="background:var(--admin-card); border:1px solid var(--admin-border); border-radius:10px; padding:18px; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; background:#1877F2; color:#fff; border-radius:50%; font-weight:bold; font-size:0.95rem;">f</span>
                  <strong style="font-size:1rem; color:var(--admin-text);">${escapeHtml(page.page_name)}</strong>
                </div>
                <div style="display:flex; gap:6px;">
                  <span class="badge badge-purple" style="font-size:0.7rem; text-transform:capitalize;">
                    ${page.page_type || 'page'}
                  </span>
                  <span class="badge ${page.is_active ? 'badge-success' : 'badge-danger'}" style="font-size:0.7rem;">
                    ${page.is_active ? 'Active' : 'Disconnected'}
                  </span>
                </div>
              </div>

              <!-- Page Link -->
              <div style="margin-bottom:12px; background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:8px 10px;">
                <div style="font-size:0.72rem; color:var(--admin-muted); margin-bottom:2px;">Facebook Link:</div>
                <a href="${page.page_url || ('https://www.facebook.com/' + page.page_id)}" target="_blank" rel="noopener noreferrer" style="color:#58a6ff; font-weight:600; text-decoration:none; display:flex; align-items:center; gap:4px; font-size:0.8rem; word-break:break-all;">
                  <span>🔗</span> ${escapeHtml(page.page_url || ('https://www.facebook.com/' + page.page_id))} ↗
                </a>
              </div>

              <!-- Page Meta -->
              <div style="font-size:0.78rem; color:var(--admin-muted); display:flex; flex-direction:column; gap:4px; margin-bottom:14px;">
                <span>ID / Handle: <code style="color:#f0f6fc;">${escapeHtml(page.page_id)}</code></span>
                <span>Default Language: <strong style="color:var(--admin-text);">${(page.default_lang_code || 'as').toUpperCase()}</strong></span>
                <span>Import Workflow: <span class="badge badge-warning" style="font-size:0.68rem;">${escapeHtml(page.auto_import_mode || 'review')}</span></span>
                <span>Last Synced: ${page.last_sync_at ? new Date(page.last_sync_at).toLocaleTimeString() : 'Pending'}</span>
              </div>
            </div>

            <!-- Disconnect & Sync Actions -->
            <div style="display:flex; gap:8px; border-top:1px solid var(--admin-border); padding-top:12px; margin-top:8px;">
              <button type="button" class="btn btn-danger btn-sm btn-disconnect-fb" data-page-id="${page.id}" data-page-name="${escapeHtml(page.page_name)}" style="flex:1;">
                🔌 Disconnect
              </button>
              <button type="button" class="btn btn-secondary btn-sm btn-sync-single-fb" data-page-id="${page.id}" title="Sync this Facebook feed">
                🔄 Sync
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  </div>

  <!-- Ingest Status Filter Pills & Search -->
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:14px;">
    <div style="display:flex; gap:10px; flex-wrap:wrap;" id="fbFilterPills">
      <span class="badge filter-pill active" data-filter="all" style="font-size:0.85rem; padding:8px 14px; background:rgba(255,255,255,0.12); color:#fff;">
        All Posts (${posts.length})
      </span>
      <span class="badge filter-pill badge-warning" data-filter="pending_review" style="font-size:0.85rem; padding:8px 14px;">
        Awaiting Review (${pendingPosts.length})
      </span>
      <span class="badge filter-pill badge-success" data-filter="imported_draft" style="font-size:0.85rem; padding:8px 14px;">
        Imported as Draft (${importedDrafts.length})
      </span>
      <span class="badge filter-pill badge-danger" data-filter="hidden" style="font-size:0.85rem; padding:8px 14px;">
        Hidden (${hiddenPosts.length})
      </span>
      <span class="badge filter-pill badge-purple" data-filter="skipped_loop" style="font-size:0.85rem; padding:8px 14px;">
        Loops Prevented (${loopPrevented.length})
      </span>
    </div>

    <div style="flex-grow:1; max-width:320px;">
      <input type="text" id="fbSearchInput" class="form-control" placeholder="🔍 Search imported posts..." style="font-size:0.85rem; padding:8px 14px;">
    </div>
  </div>

  <!-- Imported Posts Table -->
  <div class="admin-table-container">
    <table class="admin-table" id="fbPostsTable">
      <thead>
        <tr>
          <th>Post ID & Preview</th>
          <th>Detected Language</th>
          <th>Confidence</th>
          <th>Suggested Section</th>
          <th>Status</th>
          <th style="min-width:210px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${posts.length === 0 ? `
          <tr>
            <td colspan="6" style="text-align:center; padding:30px; color:var(--admin-muted);">
              No posts fetched yet. Click "Sync Facebook Now" to pull latest posts from your connected page.
            </td>
          </tr>
        ` : posts.map(post => {
          const isPending = post.status === 'pending_review';
          const isLoop = post.status === 'skipped_loop';
          const isHidden = post.status === 'hidden';

          return `
            <tr class="fb-post-row" data-status="${post.status}" data-id="${post.id}" id="fb-row-${post.id}">
              <td style="max-width:320px;">
                <div style="display:flex; gap:10px; align-items:flex-start;">
                  ${post.image_url ? `<img src="${post.image_url}" style="width:48px; height:48px; border-radius:6px; object-fit:cover; flex-shrink:0;">` : ''}
                  <div>
                    <div class="fb-post-text" style="font-size:0.85rem; font-weight:600; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                      ${escapeHtml(post.message || 'No text content')}
                    </div>
                    <div style="font-size:0.72rem; color:var(--admin-muted); margin-top:2px; font-family:monospace;">
                      ID: ${escapeHtml(post.fb_post_id)}
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
                            data-suggested-lang="${post.suggested_lang || 'as'}">
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

  <!-- Connect Facebook Page / Profile Modal -->
  <div id="fbConnectModal" class="modal-overlay">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">Connect Facebook Page or Profile</h3>
        <button type="button" id="closeFbConnectModalBtn" class="modal-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Facebook Page or Profile Link *</label>
          <input type="url" id="fbConnectUrl" class="form-control" placeholder="https://www.facebook.com/nd30live/" required>
          <span style="font-size:0.75rem; color:var(--admin-muted); margin-top:4px; display:block;">
            Enter the full link to your Facebook Page or Profile (e.g., <code>https://www.facebook.com/nd30live/</code>).
          </span>
        </div>

        <div class="form-group">
          <label class="form-label">Page / Account Display Name</label>
          <input type="text" id="fbConnectName" class="form-control" placeholder="ND30 LIVE">
          <span style="font-size:0.75rem; color:var(--admin-muted); margin-top:4px; display:block;">
            Optional: Customize the label in your ND30 LIVE dashboard.
          </span>
        </div>

        <div class="form-group">
          <label class="form-label">Account Type</label>
          <select id="fbConnectType" class="form-control">
            <option value="page">Facebook Page (Public News / Media Page)</option>
            <option value="profile">Facebook Personal Profile</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Default Language Section</label>
          <select id="fbConnectLang" class="form-control">
            <option value="as">Assamese – অসমীয়া (/as/)</option>
            <option value="hi">Hindi – हिंदी (/hi/)</option>
            <option value="en">English (/en/)</option>
          </select>
          <span style="font-size:0.75rem; color:var(--admin-muted); margin-top:4px; display:block;">
            Script auto-detection will still classify Assamese, Hindi, and English posts accurately.
          </span>
        </div>

        <div class="form-group">
          <label class="form-label">Auto-Import Workflow</label>
          <select id="fbConnectMode" class="form-control">
            <option value="review">Review Queue (Recommended - review & assign language before publishing)</option>
            <option value="draft">Direct Drafts (Automatically draft in detected language)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Meta Graph API Access Token (Optional)</label>
          <input type="password" id="fbConnectToken" class="form-control" placeholder="Optional Page or User Access Token">
          <span style="font-size:0.75rem; color:var(--admin-muted); margin-top:4px; display:block;">
            Leave blank for manual link connection & simulated newsroom ingestion.
          </span>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('fbConnectModal').classList.remove('active')">Cancel</button>
        <button type="button" id="saveFbConnectBtn" class="btn btn-primary">
          🔗 Connect Account
        </button>
      </div>
    </div>
  </div>

  <!-- Review & Assign Modal -->
  <div id="fbReviewModal" class="modal-overlay">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">Manual Language Review & Assignment</h3>
        <button type="button" id="closeFbModalBtn" class="modal-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="fbReviewPostId">

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
  renderFacebookDashboard
};
