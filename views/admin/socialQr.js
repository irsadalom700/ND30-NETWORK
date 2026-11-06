/**
 * ND30 LIVE - Social QR Code Channels Admin Manager
 * Allows newsroom administrators to manage header QR code links
 * (Facebook, YouTube, Instagram, X). Changing a link automatically
 * regenerates the Level H QR code with centered branding.
 */

const { db } = require('../../database/db');
const { PLATFORM_CONFIGS } = require('../../services/socialQrService');

function renderSocialQrAdmin() {
  const links = db.prepare('SELECT * FROM social_qr_links ORDER BY sort_order ASC, id ASC').all();

  const totalActive = links.filter(l => l.is_active === 1).length;
  const hasFb = links.some(l => l.platform === 'facebook' && l.is_active === 1);
  const hasYt = links.some(l => l.platform === 'youtube' && l.is_active === 1);

  return `
  <div class="admin-content-container">
    <!-- Notice Banner -->
    <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);">
      <div>
        <h2 style="font-size: 1.25rem; font-weight: 800; color: #ffffff; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
          <span>📲</span> Official Social QR Channels & Header Hub
        </h2>
        <p style="color: #94a3b8; font-size: 0.88rem; line-height: 1.5; margin: 0; max-width: 680px;">
          Manage the social channel QR codes displayed in the website header. When you update or add a destination URL, a high-density Level H QR code with centered platform branding is automatically generated for instant mobile camera scanning.
        </p>
      </div>
      <div style="display: flex; gap: 12px; align-items: center;">
        <a href="/as/" target="_blank" class="btn btn-secondary" style="font-size: 0.82rem; padding: 8px 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <span>👁️</span> Preview Website Header ↗
        </a>
      </div>
    </div>

    <!-- Quick Status Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px;">
      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 14px;">
        <div style="font-size: 1.8rem;">⚡</div>
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">Active QR Channels</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: #ffffff;">${totalActive} <span style="font-size: 0.85rem; font-weight: 500; color: #64748b;">/ ${links.length} total</span></div>
        </div>
      </div>

      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(24, 119, 242, 0.3); border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 14px;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background: #1877F2; display: flex; align-items: center; justify-content: center;">
          ${PLATFORM_CONFIGS.facebook.svg}
        </div>
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">Facebook Status</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: ${hasFb ? '#22c55e' : '#eab308'};">
            ${hasFb ? '● Online & Scan-Ready' : '○ Disabled / Missing'}
          </div>
        </div>
      </div>

      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 0, 0, 0.3); border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 14px;">
        <div style="width: 36px; height: 36px; border-radius: 8px; background: #FF0000; display: flex; align-items: center; justify-content: center;">
          ${PLATFORM_CONFIGS.youtube.svg}
        </div>
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">YouTube Status</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: ${hasYt ? '#22c55e' : '#eab308'};">
            ${hasYt ? '● Online & Scan-Ready' : '○ Disabled / Missing'}
          </div>
        </div>
      </div>

      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 14px;">
        <div style="font-size: 1.8rem;">🎯</div>
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">ECC QR Reliability</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: #22c55e;">Level H (30% Recovery)</div>
        </div>
      </div>
    </div>

    <!-- Add More Link Section -->
    <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 22px; margin-bottom: 32px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
      <h3 style="font-size: 1.05rem; font-weight: 700; color: #ffffff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        <span>➕</span> Add More Social QR Channel
      </h3>
      <form id="addSocialLinkForm" class="admin-socialqr-form" onsubmit="handleCreateLink(event)" style="display: grid; grid-template-columns: 200px 1fr 1.6fr auto; gap: 14px; align-items: flex-end;">
        <div>
          <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px;">Select Platform *</label>
          <select id="newPlatform" onchange="handlePlatformChange(this.value)" required style="width: 100%; background: #0f172a; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 6px; padding: 10px 12px; font-size: 0.88rem; outline: none;">
            <option value="facebook">📘 Facebook</option>
            <option value="youtube">▶️ YouTube</option>
            <option value="instagram">📸 Instagram</option>
            <option value="x">✖️ X (Twitter)</option>
          </select>
        </div>

        <div>
          <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px;">Channel Display Title *</label>
          <input type="text" id="newTitle" placeholder="Official Facebook Page" required value="Official Facebook Page" style="width: 100%; background: #0f172a; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 6px; padding: 10px 12px; font-size: 0.88rem; outline: none;">
        </div>

        <div>
          <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px;">Destination Channel URL *</label>
          <input type="url" id="newUrl" placeholder="https://www.facebook.com/nd30live/" required style="width: 100%; background: #0f172a; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 6px; padding: 10px 12px; font-size: 0.88rem; outline: none;">
        </div>

        <div>
          <button type="submit" id="addSubmitBtn" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; border: none; border-radius: 6px; padding: 10px 20px; font-size: 0.88rem; font-weight: 700; cursor: pointer; white-space: nowrap; height: 42px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); transition: transform 0.15s ease;">
            <span>✨</span> Generate QR Code
          </button>
        </div>
      </form>
    </div>

    <!-- Active Social QR Codes List -->
    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 1.05rem; font-weight: 700; color: #ffffff; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
        <span>🗂️</span> Managed QR Channels in Header (${links.length})
      </h3>
      <p style="font-size: 0.82rem; color: #94a3b8; margin-bottom: 20px;">
        Edit the destination link below to update where scanning visitors are directed. QR codes recalculate instantly upon save.
      </p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px;">
      ${links.map(item => {
        const platformKey = (item.platform || 'facebook').toLowerCase();
        const conf = PLATFORM_CONFIGS[platformKey] || PLATFORM_CONFIGS.facebook;

        return `
        <div id="card-${item.id}" style="background: var(--admin-card-bg, #1e293b); border: 1px solid ${item.is_active ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)'}; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 16px; position: relative; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2); transition: border-color 0.2s ease;">
          
          <!-- Top Row: Platform Badge & Active Status -->
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; ${conf.centerStyle}">
                ${conf.svg}
              </div>
              <span style="font-weight: 700; color: #ffffff; font-size: 0.95rem;">
                ${conf.name}
              </span>
            </div>

            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.8rem; color: ${item.is_active ? '#22c55e' : '#94a3b8'};">
              <input type="checkbox" id="active-${item.id}" ${item.is_active ? 'checked' : ''} onchange="handleSaveLink(${item.id})">
              <span>${item.is_active ? 'Header Visible' : 'Disabled'}</span>
            </label>
          </div>

          <!-- Middle: QR Preview with Centered Logo -->
          <div style="display: flex; gap: 16px; align-items: center; background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 8px; border: 1px dashed rgba(255, 255, 255, 0.1);">
            <div style="position: relative; width: 78px; height: 78px; background: #ffffff; border-radius: 8px; padding: 3px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
              <img id="qr-img-${item.id}" src="${item.qr_data_url || ''}" alt="${conf.name} QR" style="width: 100%; height: 100%; object-fit: contain; display: block;">
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.4); ${conf.centerStyle}">
                ${conf.svg}
              </div>
            </div>

            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 0.72rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 4px;">Live Destination</div>
              <a id="qr-link-text-${item.id}" href="${item.url}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; font-size: 0.82rem; font-weight: 500; text-decoration: none; word-break: break-all; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${item.url}">
                ${item.url} ↗
              </a>
              <div style="font-size: 0.72rem; color: #64748b; margin-top: 6px;">
                Scan with any smartphone camera
              </div>
            </div>
          </div>

          <!-- Form Fields for Editing -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Title</label>
              <input type="text" id="title-${item.id}" value="${item.title || conf.name}" style="width: 100%; background: #0f172a; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.85rem; outline: none;">
            </div>

            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Destination URL</label>
              <input type="url" id="url-${item.id}" value="${item.url}" style="width: 100%; background: #0f172a; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.85rem; outline: none;">
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
            <button type="button" onclick="handleDeleteLink(${item.id}, '${conf.name}')" style="background: transparent; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 6px 12px; font-size: 0.78rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
              <span>🗑️</span> Remove
            </button>
            <button type="button" id="save-btn-${item.id}" onclick="handleSaveLink(${item.id})" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; border: none; border-radius: 6px; padding: 6px 14px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);">
              <span>💾</span> Save & Update QR
            </button>
          </div>

        </div>
        `;
      }).join('')}
    </div>
  </div>

  <script>
    const DEFAULT_TITLES = {
      facebook: 'Official Facebook Page',
      youtube: 'Official YouTube Channel',
      instagram: 'Official Instagram Page',
      x: 'Official X (Twitter) Channel'
    };

    const DEFAULT_URLS = {
      facebook: 'https://www.facebook.com/nd30live/',
      youtube: 'https://www.youtube.com/@ND30LIVE',
      instagram: 'https://www.instagram.com/nd30live/',
      x: 'https://x.com/nd30live'
    };

    function handlePlatformChange(platform) {
      const titleInput = document.getElementById('newTitle');
      const urlInput = document.getElementById('newUrl');
      if (DEFAULT_TITLES[platform]) {
        titleInput.value = DEFAULT_TITLES[platform];
      }
      if (DEFAULT_URLS[platform]) {
        urlInput.placeholder = DEFAULT_URLS[platform];
      }
    }

    async function handleCreateLink(event) {
      event.preventDefault();
      const platform = document.getElementById('newPlatform').value;
      const title = document.getElementById('newTitle').value.trim();
      const url = document.getElementById('newUrl').value.trim();
      const submitBtn = document.getElementById('addSubmitBtn');

      submitBtn.disabled = true;
      submitBtn.innerText = 'Generating QR...';

      try {
        const res = await fetch('/api/admin/social-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform, title, url })
        });
        const data = await res.json();
        if (data.success) {
          alert('Success! ' + title + ' QR code generated and active in the header.');
          window.location.reload();
        } else {
          alert('Error creating link: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Request failed: ' + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>✨</span> Generate QR Code';
      }
    }

    async function handleSaveLink(id) {
      const title = document.getElementById('title-' + id).value.trim();
      const url = document.getElementById('url-' + id).value.trim();
      const isActive = document.getElementById('active-' + id).checked;
      const saveBtn = document.getElementById('save-btn-' + id);

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Updating...';
      }

      try {
        const res = await fetch('/api/admin/social-qr/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, url, is_active: isActive })
        });
        const data = await res.json();
        if (data.success) {
          if (data.link && data.link.qr_data_url) {
            const imgEl = document.getElementById('qr-img-' + id);
            if (imgEl) imgEl.src = data.link.qr_data_url;
            const textEl = document.getElementById('qr-link-text-' + id);
            if (textEl) {
              textEl.href = data.link.url;
              textEl.innerText = data.link.url + ' ↗';
              textEl.title = data.link.url;
            }
          }
          alert('Saved! QR code for ' + title + ' has been updated with the new link destination.');
        } else {
          alert('Error updating link: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Update failed: ' + err.message);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<span>💾</span> Save & Update QR';
        }
      }
    }

    async function handleDeleteLink(id, platformName) {
      if (!confirm('Are you sure you want to remove the ' + platformName + ' QR code from the header?')) {
        return;
      }

      try {
        const res = await fetch('/api/admin/social-qr/' + id, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          alert('Removed ' + platformName + ' QR channel.');
          const card = document.getElementById('card-' + id);
          if (card) card.remove();
          else window.location.reload();
        } else {
          alert('Error removing link: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Delete failed: ' + err.message);
      }
    }
  </script>
  `;
}

module.exports = {
  renderSocialQrAdmin
};

