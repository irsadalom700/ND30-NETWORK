/**
 * ND30 LIVE - Google AdSense Placement Manager
 * Path: Settings -> Google AdSense
 */

const { db } = require('../../database/db');

function renderAdSenseManager() {
  const slots = db.prepare('SELECT * FROM adsense_slots ORDER BY id ASC').all();

  return `
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
    <div>
      <div style="display:flex; align-items:center; gap:8px; font-size:0.85rem; color:var(--admin-muted); margin-bottom:4px;">
        <span>Settings</span> › <strong style="color:var(--admin-text);">Google AdSense</strong>
      </div>
      <h2 style="font-size:1.4rem; font-weight:800; display:flex; align-items:center; gap:8px;">
        <span>💰</span> Google AdSense Ad Placement Management
      </h2>
    </div>
  </div>

  <div style="display:grid; grid-template-columns: 1fr; gap:20px;">
    ${slots.map(slot => `
      <div style="background:var(--admin-card); border:1px solid var(--admin-border); border-radius:12px; padding:22px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <h3 style="font-size:1.1rem; font-weight:700;">${slot.slot_name}</h3>
            <span style="font-size:0.75rem; color:var(--admin-muted); font-family:monospace;">Slot Key: ${slot.slot_key}</span>
          </div>
          <span class="badge ${slot.is_active ? 'badge-success' : 'badge-danger'}">
            ${slot.is_active ? 'Active & Displaying' : 'Disabled'}
          </span>
        </div>

        <form method="POST" action="/api/admin/adsense/save" style="display:grid; grid-template-columns: 1fr 1fr 1fr auto; gap:16px; align-items:flex-end;">
          <input type="hidden" name="slotKey" value="${slot.slot_key}">

          <div>
            <label class="form-label" style="font-size:0.8rem;">AdSense Publisher ID</label>
            <input type="text" name="adClient" class="form-control" value="${slot.ad_client || 'ca-pub-9876543210123456'}">
          </div>

          <div>
            <label class="form-label" style="font-size:0.8rem;">Ad Unit Slot ID</label>
            <input type="text" name="adSlotId" class="form-control" value="${slot.ad_slot_id || '1234567890'}">
          </div>

          <div>
            <label class="form-label" style="font-size:0.8rem;">Display Status</label>
            <select name="isActive" class="form-control">
              <option value="1" ${slot.is_active ? 'selected' : ''}>Active</option>
              <option value="0" ${!slot.is_active ? 'selected' : ''}>Disabled</option>
            </select>
          </div>

          <button type="submit" class="btn btn-secondary">
            Save Unit
          </button>
        </form>
      </div>
    `).join('')}
  </div>`;
}

module.exports = {
  renderAdSenseManager
};
