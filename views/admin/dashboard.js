/**
 * ND30 LIVE - Admin Dashboard View
 */

const { db } = require('../../database/db');

function renderAdminDashboard() {
  const totalClusters = db.prepare('SELECT COUNT(*) as count FROM articles').get().count;
  const asCount = db.prepare("SELECT COUNT(*) as count FROM article_translations WHERE lang_code = 'as' AND status = 'published'").get().count;
  const hiCount = db.prepare("SELECT COUNT(*) as count FROM article_translations WHERE lang_code = 'hi' AND status = 'published'").get().count;
  const enCount = db.prepare("SELECT COUNT(*) as count FROM article_translations WHERE lang_code = 'en' AND status = 'published'").get().count;

  const fbPendingCount = db.prepare("SELECT COUNT(*) as count FROM facebook_imported_posts WHERE status = 'pending_review'").get().count;
  const iftttEvents = db.prepare("SELECT COUNT(*) as count FROM ifttt_event_logs").get().count;
  const iftttFailed = db.prepare("SELECT COUNT(*) as count FROM ifttt_event_logs WHERE status = 'failed'").get().count;

  const recentTranslations = db.prepare(`
    SELECT t.*, c.name as category_name
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.created_at DESC
    LIMIT 8
  `).all();

  const recentLogs = db.prepare(`
    SELECT * FROM ifttt_event_logs
    ORDER BY created_at DESC
    LIMIT 6
  `).all();

  return `
  <!-- Stats Grid -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-header">
        <span>Multilingual Stories</span>
        <span>🌐</span>
      </div>
      <div class="stat-value">${totalClusters}</div>
      <div class="stat-footer">Clusters active across languages</div>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <span>Published Editions</span>
        <span>📰</span>
      </div>
      <div class="stat-value" style="font-size:1.4rem;">
        <span style="color:#ef4444;">AS: ${asCount}</span> • 
        <span style="color:#f59e0b;">HI: ${hiCount}</span> • 
        <span style="color:#3b82f6;">EN: ${enCount}</span>
      </div>
      <div class="stat-footer">Independent language sections</div>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <span>FB Import Review</span>
        <span>📱</span>
      </div>
      <div class="stat-value" style="color:${fbPendingCount > 0 ? '#fbbf24' : '#10b981'};">
        ${fbPendingCount}
      </div>
      <div class="stat-footer">Posts awaiting manual language review</div>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <span>IFTTT Automation</span>
        <span>⚡</span>
      </div>
      <div class="stat-value" style="color:${iftttFailed > 0 ? '#ef4444' : '#10b981'};">
        ${iftttEvents} <span style="font-size:0.9rem; font-weight:500;">(${iftttFailed} failed)</span>
      </div>
      <div class="stat-footer">Webhooks & social syndications</div>
    </div>
  </div>

  <!-- Quick Action Banner -->
  <div style="background:linear-gradient(135deg, #1e293b, #0f172a); border:1px solid var(--admin-border); border-radius:12px; padding:20px 24px; margin-bottom:28px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
    <div>
      <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:4px;">Publish or Review Multilingual Stories</h3>
      <p style="font-size:0.85rem; color:var(--admin-muted);">
        Use the 3-Language Editor with built-in AI Translation Assistant to write and publish news across Assamese, Hindi, and English.
      </p>
    </div>
    <div style="display:flex; gap:12px;">
      <a href="/admin/editor" class="btn btn-primary">+ Create Multilingual Article</a>
      <a href="/admin/facebook" class="btn btn-secondary">Review Facebook Imports</a>
      <a href="/admin/ifttt" class="btn btn-secondary">IFTTT Studio</a>
    </div>
  </div>

  <div class="admin-dashboard-grid" style="display:grid; grid-template-columns: 1.8fr 1.2fr; gap:28px;">
    <!-- Recent Articles Table -->
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="font-size:1.1rem; font-weight:700;">Recent News Translations</h3>
        <a href="/admin/articles" style="color:var(--admin-red); font-size:0.85rem; font-weight:600;">View All ↗</a>
      </div>

      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Language</th>
              <th>Headline</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${recentTranslations.map(art => `
              <tr>
                <td>
                  <span class="badge ${art.lang_code === 'as' ? 'badge-danger' : (art.lang_code === 'hi' ? 'badge-warning' : 'badge-info')}">
                    ${art.lang_code.toUpperCase()}
                  </span>
                </td>
                <td style="max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  <strong>${art.title}</strong>
                </td>
                <td>${art.category_name || 'General'}</td>
                <td>
                  <span class="badge ${art.status === 'published' ? 'badge-success' : 'badge-warning'}">
                    ${art.status}
                  </span>
                </td>
                <td>
                  <a href="/admin/editor?id=${art.article_id}" class="btn btn-secondary btn-sm">Edit</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- IFTTT Live Activity Log -->
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="font-size:1.1rem; font-weight:700;">⚡ IFTTT Automation Activity</h3>
        <a href="/admin/ifttt" style="color:var(--admin-red); font-size:0.85rem; font-weight:600;">Manage ↗</a>
      </div>

      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Lang</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${recentLogs.map(log => `
              <tr>
                <td style="font-family:monospace; font-size:0.82rem;">${log.event_name}</td>
                <td><span class="badge badge-purple">${(log.lang_code || 'all').toUpperCase()}</span></td>
                <td>
                  <span class="badge ${log.status === 'success' ? 'badge-success' : (log.status === 'retrying' ? 'badge-warning' : 'badge-danger')}">
                    ${log.status}
                  </span>
                </td>
                <td style="font-size:0.75rem; color:var(--admin-muted);">
                  ${new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

module.exports = {
  renderAdminDashboard
};
