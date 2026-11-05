/**
 * ND30 LIVE - IFTTT Automation Studio
 * Path: Settings -> Integrations -> IFTTT
 * Official Maker Webhooks, Secret Key Management, Test Triggers, Event History, Retry Queue
 */

const { db } = require('../../database/db');

function renderIftttStudio() {
  const conn = db.prepare('SELECT * FROM ifttt_connections WHERE id = 1').get() || { enabled: 1, webhook_secret: '', maker_key: '' };
  const rules = db.prepare('SELECT * FROM ifttt_automation_rules ORDER BY id ASC').all();
  const logs = db.prepare('SELECT * FROM ifttt_event_logs ORDER BY created_at DESC LIMIT 50').all();

  const failedLogs = logs.filter(l => l.status === 'failed');
  const successLogs = logs.filter(l => l.status === 'success');

  const baseUrl = process.env.BASE_URL || 'http://localhost:3030';
  const inboundWebhookUrl = `${baseUrl}/api/ifttt/webhook`;

  return `
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
    <div>
      <div style="display:flex; align-items:center; gap:8px; font-size:0.85rem; color:var(--admin-muted); margin-bottom:4px;">
        <span>Settings</span> › <span>Integrations</span> › <strong style="color:var(--admin-text);">IFTTT Automation</strong>
      </div>
      <h2 style="font-size:1.4rem; font-weight:800; display:flex; align-items:center; gap:8px;">
        <span>⚡</span> IFTTT Integration & Workflow Automation
      </h2>
    </div>
    <div style="display:flex; align-items:center; gap:12px;">
      <span class="badge ${conn.enabled ? 'badge-success' : 'badge-danger'}" style="font-size:0.85rem; padding:6px 14px;">
        ● ${conn.enabled ? 'Service Active & Listening' : 'Service Disabled'}
      </span>
    </div>
  </div>

  <!-- Credentials & Webhook Setup Grid -->
  <div style="display:grid; grid-template-columns: 1.2fr 0.8fr; gap:24px; margin-bottom:28px;">
    <!-- Inbound & Outbound Configuration -->
    <div style="background:var(--admin-card); border:1px solid var(--admin-border); border-radius:12px; padding:22px;">
      <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
        <span>🔐</span> Official Webhook Endpoints & Authentication
      </h3>

      <!-- Inbound Endpoint -->
      <div class="form-group">
        <label class="form-label">
          ND30 Inbound Webhook Endpoint
          <span class="form-label-desc">(Use in IFTTT "Then" Webhooks action for Facebook to Website or external triggers)</span>
        </label>
        <div style="display:flex; gap:8px;">
          <input type="text" readonly class="form-control" value="${inboundWebhookUrl}" style="font-family:monospace; font-size:0.88rem; background:#070a0f;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${inboundWebhookUrl}'); alert('Inbound webhook URL copied!');">
            Copy
          </button>
        </div>
      </div>

      <!-- Secure Webhook Secret Key -->
      <div class="form-group">
        <label class="form-label">
          Secure Webhook Key / Secret
          <span class="form-label-desc">(Pass as header <code>X-IFTTT-Secret</code> or field <code>secret_key</code> to authenticate incoming payloads)</span>
        </label>
        <div style="display:flex; gap:8px;">
          <input type="password" id="webhookSecretInput" readonly class="form-control" value="${conn.webhook_secret}" style="font-family:monospace; font-size:0.88rem; background:#070a0f;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="const inp=document.getElementById('webhookSecretInput'); inp.type = inp.type==='password'?'text':'password';">
            Show/Hide
          </button>
          <button type="button" id="regenSecretBtn" class="btn btn-secondary btn-sm" title="Regenerate Secret">
            🔄 Regen
          </button>
        </div>
      </div>

      <!-- Outbound IFTTT Maker Key -->
      <div class="form-group">
        <label class="form-label">
          Your IFTTT Webhooks Maker Key
          <span class="form-label-desc">(From your IFTTT Webhooks service settings: <code>https://ifttt.com/maker_webhooks</code>)</span>
        </label>
        <input type="text" id="makerKeyInput" class="form-control" value="${conn.maker_key || ''}" placeholder="e.g. c8K3jL8n9X0m1Q2w3E4r5T">
      </div>
    </div>

    <!-- Live Test Webhook Runner Console -->
    <div style="background:var(--admin-card); border:1px solid var(--admin-border); border-radius:12px; padding:22px; display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
          <span>🧪</span> Live Webhook Dispatch Tester
        </h3>
        <p style="font-size:0.82rem; color:var(--admin-muted); margin-bottom:14px;">
          Send a structured test payload to verify delivery status and response logging.
        </p>

        <div class="form-group">
          <label class="form-label">Test Language Event</label>
          <select id="testIftttLang" class="form-control">
            <option value="as">new_assamese_news (Assamese - অসমীয়া)</option>
            <option value="hi">new_hindi_news (Hindi - हिंदी)</option>
            <option value="en" selected>new_english_news (English Edition)</option>
          </select>
        </div>

        <button type="button" id="testIftttBtn" class="btn btn-primary" style="width:100%; margin-bottom:12px;">
          🚀 Dispatch Test Event
        </button>
      </div>

      <div class="terminal-box" id="iftttConsoleBox">
[System] IFTTT automation runner ready.
[System] Idempotency checks: Active
[System] Automation loop guard: Active
      </div>
    </div>
  </div>

  <!-- Automation Rules & Language Mapping Table -->
  <div style="margin-bottom:28px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
      <h3 style="font-size:1.1rem; font-weight:700;">Configured Automation Rules & Language Mapping</h3>
      <span style="font-size:0.8rem; color:var(--admin-muted);">4 Active Workflows</span>
    </div>

    <div class="admin-table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Workflow Name</th>
            <th>Event Identifier</th>
            <th>Language Section</th>
            <th>Target Service</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          ${rules.map(rule => `
            <tr>
              <td>
                <strong>${rule.rule_name}</strong>
                <div style="font-size:0.75rem; color:var(--admin-muted);">${rule.description || ''}</div>
              </td>
              <td><code style="color:#38bdf8; font-weight:700;">${rule.event_name}</code></td>
              <td>
                <span class="badge ${rule.lang_code === 'as' ? 'badge-danger' : (rule.lang_code === 'hi' ? 'badge-warning' : (rule.lang_code === 'en' ? 'badge-info' : 'badge-purple'))}">
                  ${rule.lang_code.toUpperCase()}
                </span>
              </td>
              <td>
                <span style="font-size:0.85rem; font-weight:600;">
                  ${rule.target_service === 'telegram' ? '✈️ Telegram Channel' : (rule.target_service === 'facebook' ? 'f Facebook Page' : (rule.target_service === 'x' ? '𝕏 X (Twitter)' : '⚡ IFTTT Maker'))}
                </span>
              </td>
              <td>
                <span class="badge ${rule.is_active ? 'badge-success' : 'badge-danger'}">
                  ${rule.is_active ? 'Active' : 'Disabled'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Event History & Failed Logs with Retry Mechanism -->
  <div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <h3 style="font-size:1.1rem; font-weight:700;">Event Delivery History & Retry Logs</h3>
        <span class="badge badge-success">Successful: ${successLogs.length}</span>
        <span class="badge ${failedLogs.length > 0 ? 'badge-danger' : 'badge-info'}">Failed: ${failedLogs.length}</span>
      </div>
    </div>

    <div class="admin-table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Event ID & Dir</th>
            <th>Event Name</th>
            <th>Language</th>
            <th>Delivery Status</th>
            <th>HTTP Status</th>
            <th>Timestamp</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${logs.length === 0 ? `
            <tr>
              <td colspan="7" style="text-align:center; padding:30px; color:var(--admin-muted);">
                No events recorded yet. Run a test event above or publish an article.
              </td>
            </tr>
          ` : logs.map(log => {
            const isFailed = log.status === 'failed';
            return `
              <tr>
                <td>
                  <div style="font-family:monospace; font-size:0.75rem; font-weight:700; color:var(--admin-text);">
                    ${log.event_id.slice(0, 20)}...
                  </div>
                  <span class="badge ${log.direction === 'outbound' ? 'badge-info' : 'badge-purple'}" style="font-size:0.65rem;">
                    ${log.direction.toUpperCase()}
                  </span>
                </td>
                <td><code style="color:#38bdf8;">${log.event_name}</code></td>
                <td><span class="badge badge-purple">${(log.lang_code || 'all').toUpperCase()}</span></td>
                <td>
                  <span class="badge ${log.status === 'success' ? 'badge-success' : (log.status === 'retrying' ? 'badge-warning' : 'badge-danger')}">
                    ${log.status}
                  </span>
                  ${log.retry_count > 0 ? `<span style="font-size:0.7rem; color:var(--admin-muted); margin-left:4px;">(Retried ${log.retry_count}x)</span>` : ''}
                </td>
                <td style="font-family:monospace; font-size:0.85rem;">
                  ${log.http_status || '-'}
                </td>
                <td style="font-size:0.75rem; color:var(--admin-muted); white-space:nowrap;">
                  ${new Date(log.created_at).toLocaleString()}
                </td>
                <td>
                  ${isFailed ? `
                    <button type="button" class="btn btn-primary btn-sm btn-retry-ifttt" data-event-id="${log.event_id}">
                      🔁 Retry Now
                    </button>
                  ` : `
                    <span style="font-size:0.75rem; color:var(--admin-green);">Delivered</span>
                  `}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

module.exports = {
  renderIftttStudio
};
