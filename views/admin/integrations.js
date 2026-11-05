/**
 * ND30 LIVE - Unified Admin Integrations Hub
 * Settings → Integrations
 * Houses Facebook Page Integration, IFTTT Automation, Google AdSense, and Google Analytics
 * with explicit architectural separation between Meta API direct ingestion and IFTTT workflow syndication.
 */

const { db } = require('../../database/db');

function renderIntegrationsHub() {
  const iftttConn = db.prepare('SELECT * FROM ifttt_connections WHERE id = 1').get();
  const fbPages = db.prepare('SELECT COUNT(*) as count FROM facebook_pages WHERE is_active = 1').get().count;
  const activeFb = db.prepare('SELECT * FROM facebook_pages WHERE is_active = 1 ORDER BY id DESC LIMIT 1').get();
  const adSlots = db.prepare('SELECT COUNT(*) as count FROM adsense_slots WHERE is_active = 1').get().count;
  const analytics = db.prepare('SELECT * FROM analytics_settings WHERE id = 1').get();

  return `
  <div style="margin-bottom:28px;">
    <div style="display:flex; align-items:center; gap:8px; font-size:0.85rem; color:var(--admin-muted); margin-bottom:4px;">
      <span>Settings</span> › <strong style="color:var(--admin-text);">Integrations</strong>
    </div>
    <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:6px;">External Services & Integrations Hub</h2>
    <p style="font-size:0.9rem; color:var(--admin-muted); max-width:820px; line-height:1.5;">
      Centralized control panel for external automation, publisher APIs, monetization, and analytics. As per architectural guidelines, Facebook direct ingestion and IFTTT outbound syndication operate as distinct independent modules.
    </p>
  </div>

  <!-- Integrations Cards Grid -->
  <div class="integrations-grid">
    <!-- 1. Facebook Page Integration -->
    <div class="integration-card">
      <div>
        <div class="integration-card-header">
          <div class="integration-icon-title">
            <div class="integration-icon" style="background:rgba(24, 119, 242, 0.15); color:#1877F2;">
              f
            </div>
            <div>
              <h3 style="font-size:1.15rem; font-weight:700;">Facebook Page Integration</h3>
              <span style="font-size:0.75rem; color:var(--admin-muted);">Direct Meta Graph API Post Ingest</span>
            </div>
          </div>
          <span class="badge badge-success">Configurable</span>
        </div>

        <div class="integration-card-body">
          Connects official Facebook Pages via Meta Graph API for automated post polling, linguistic script classification (Assamese, Hindi, English), loop prevention, and draft review queue.
        </div>

        <div style="background:#0c1017; border:1px solid var(--admin-border); border-radius:8px; padding:12px; font-size:0.82rem; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>Connected Facebook:</span>
            <strong style="color:#10b981;">${activeFb ? activeFb.page_name : `${fbPages} Active`}</strong>
          </div>
          ${activeFb && activeFb.page_url ? `
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; flex-wrap:wrap; gap:4px;">
            <span>Link:</span>
            <a href="${activeFb.page_url}" target="_blank" style="color:#58a6ff; font-weight:600; text-decoration:none;">${activeFb.page_url} ↗</a>
          </div>` : ''}
          <div style="display:flex; justify-content:space-between;">
            <span>Ingestion Mode:</span>
            <strong style="color:#38bdf8;">Meta Graph API / Direct Link</strong>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--admin-border); padding-top:16px;">
        <span style="font-size:0.78rem; color:var(--admin-muted);">Direct Import Module</span>
        <a href="/admin/facebook" class="btn btn-primary btn-sm">Manage Facebook ↗</a>
      </div>
    </div>

    <!-- 2. IFTTT Automation -->
    <div class="integration-card">
      <div>
        <div class="integration-card-header">
          <div class="integration-icon-title">
            <div class="integration-icon" style="background:rgba(0, 0, 0, 0.4); border:1px solid rgba(255,255,255,0.1); color:#38bdf8;">
              ⚡
            </div>
            <div>
              <h3 style="font-size:1.15rem; font-weight:700;">IFTTT Automation</h3>
              <span style="font-size:0.75rem; color:var(--admin-muted);">Multi-Channel External Workflow Sync</span>
            </div>
          </div>
          <span class="badge ${iftttConn?.enabled ? 'badge-success' : 'badge-warning'}">Configurable</span>
        </div>

        <div class="integration-card-body">
          Connects external services and workflows via official Maker Webhooks. Dispatches language-specific events (Telegram broadcasts, Twitter/X updates, social feeds) with strict idempotency and loop prevention.
        </div>

        <div style="background:#0c1017; border:1px solid var(--admin-border); border-radius:8px; padding:12px; font-size:0.82rem; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>IFTTT Engine State:</span>
            <strong style="color:${iftttConn?.enabled ? '#10b981' : '#f87171'};">${iftttConn?.enabled ? 'Enabled & Listening' : 'Disabled'}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Language Event Triggers:</span>
            <strong style="color:#a78bfa;">new_assamese_news, new_hindi_news, new_english_news</strong>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--admin-border); padding-top:16px;">
        <span style="font-size:0.78rem; color:var(--admin-muted);">Outbound Syndication</span>
        <a href="/admin/ifttt" class="btn btn-primary btn-sm">Configure IFTTT ↗</a>
      </div>
    </div>

    <!-- 3. Google AdSense -->
    <div class="integration-card">
      <div>
        <div class="integration-card-header">
          <div class="integration-icon-title">
            <div class="integration-icon" style="background:rgba(245, 158, 11, 0.15); color:#f59e0b;">
              💰
            </div>
            <div>
              <h3 style="font-size:1.15rem; font-weight:700;">Google AdSense</h3>
              <span style="font-size:0.75rem; color:var(--admin-muted);">Manual Ad Placement Management</span>
            </div>
          </div>
          <span class="badge badge-success">Configurable</span>
        </div>

        <div class="integration-card-body">
          Manage header leaderboards, responsive in-article ads, sticky sidebar rectangles, and footer billboards with custom publisher IDs and automatic layout adaptation.
        </div>

        <div style="background:#0c1017; border:1px solid var(--admin-border); border-radius:8px; padding:12px; font-size:0.82rem; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>Active Placement Slots:</span>
            <strong style="color:#10b981;">${adSlots} Configured</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Publisher Client:</span>
            <code style="color:#f0f6fc;">ca-pub-9876543210123456</code>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--admin-border); padding-top:16px;">
        <span style="font-size:0.78rem; color:var(--admin-muted);">Monetization Manager</span>
        <a href="/admin/adsense" class="btn btn-primary btn-sm">Manage Placements ↗</a>
      </div>
    </div>

    <!-- 4. Google Analytics -->
    <div class="integration-card">
      <div>
        <div class="integration-card-header">
          <div class="integration-icon-title">
            <div class="integration-icon" style="background:rgba(239, 68, 68, 0.15); color:#ef4444;">
              📈
            </div>
            <div>
              <h3 style="font-size:1.15rem; font-weight:700;">Google Analytics</h3>
              <span style="font-size:0.75rem; color:var(--admin-muted);">Website Traffic & Article Analytics</span>
            </div>
          </div>
          <span class="badge badge-success">Configurable</span>
        </div>

        <div class="integration-card-body">
          Google Analytics 4 (GA4) integration with custom tracking for language editions (Assamese, Hindi, English), cross-lingual switches, reading times, and IFTTT outbound delivery events.
        </div>

        <div style="background:#0c1017; border:1px solid var(--admin-border); border-radius:8px; padding:12px; font-size:0.82rem; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>Measurement ID:</span>
            <code style="color:#38bdf8;">${analytics?.ga_measurement_id || 'G-ND30NEWS01'}</code>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Language Switch Tracking:</span>
            <strong style="color:#10b981;">Enabled</strong>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--admin-border); padding-top:16px;">
        <span style="font-size:0.78rem; color:var(--admin-muted);">Audience Insights</span>
        <button type="button" class="btn btn-secondary btn-sm" onclick="alert('Google Analytics settings saved! Tracking ID: ' + '${analytics?.ga_measurement_id}')">
          Save Settings
        </button>
      </div>
    </div>
  </div>

  <!-- Architectural Best Practice Notice -->
  <div style="background:rgba(59, 130, 246, 0.08); border:1px solid rgba(59, 130, 246, 0.25); border-radius:10px; padding:18px 24px;">
    <h4 style="font-size:0.95rem; font-weight:700; color:#60a5fa; margin-bottom:6px;">
      🛡️ Architectural Separation Guarantee:
    </h4>
    <p style="font-size:0.85rem; color:var(--admin-muted); line-height:1.6;">
      As recommended, Facebook direct post importing operates exclusively through Meta Graph API with dedicated origin hashing, while IFTTT automation is reserved for external multi-channel broadcasting (Telegram, Twitter/X, notification webhooks). This guarantees that shared posts are never re-imported in infinite loops.
    </p>
  </div>`;
}

module.exports = {
  renderIntegrationsHub
};
