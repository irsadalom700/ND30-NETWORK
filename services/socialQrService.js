/**
 * ND30 LIVE - Official Social QR Code Service
 * Generates Level H QR codes with centered platform logos
 * (Facebook, YouTube, Instagram, X) for header display.
 * Links are fully manageable from the admin backend.
 */

const QRCode = require('qrcode');
const { db } = require('../database/db');

// In-memory cache
const qrCache = new Map();

const PLATFORM_CONFIGS = {
  facebook: {
    key: 'facebook',
    name: 'Facebook',
    badgeText: 'Follow on FB',
    brandColor: '#1877F2',
    accentBorder: 'rgba(24, 119, 242, 0.45)',
    bgGradient: 'linear-gradient(135deg, rgba(24, 119, 242, 0.15), rgba(15, 23, 42, 0.9))',
    centerStyle: 'background:#1877F2; border-radius:50%;',
    svg: `<svg viewBox="0 0 24 24" width="13" height="13" fill="#ffffff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
  },
  youtube: {
    key: 'youtube',
    name: 'YouTube',
    badgeText: 'Subscribe on YT',
    brandColor: '#FF0000',
    accentBorder: 'rgba(255, 0, 0, 0.45)',
    bgGradient: 'linear-gradient(135deg, rgba(255, 0, 0, 0.15), rgba(15, 23, 42, 0.9))',
    centerStyle: 'background:#FF0000; border-radius:5px;',
    svg: `<svg viewBox="0 0 24 24" width="13" height="13" fill="#ffffff"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
  },
  instagram: {
    key: 'instagram',
    name: 'Instagram',
    badgeText: 'Follow on Insta',
    brandColor: '#E1306C',
    accentBorder: 'rgba(225, 48, 108, 0.45)',
    bgGradient: 'linear-gradient(135deg, rgba(225, 48, 108, 0.15), rgba(15, 23, 42, 0.9))',
    centerStyle: 'background:linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); border-radius:5px;',
    svg: `<svg viewBox="0 0 24 24" width="12" height="12" fill="#ffffff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
  },
  x: {
    key: 'x',
    name: 'X (Twitter)',
    badgeText: 'Follow on X',
    brandColor: '#ffffff',
    accentBorder: 'rgba(255, 255, 255, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(15, 23, 42, 0.9))',
    centerStyle: 'background:#000000; border-radius:50%; border:1px solid #444;',
    svg: `<svg viewBox="0 0 24 24" width="11" height="11" fill="#ffffff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
  }
};

/**
 * Generate QR code data URL with Level H error correction (30% recovery)
 */
async function generateQrDataUrl(url) {
  if (qrCache.has(url)) {
    return qrCache.get(url);
  }

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 220,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    qrCache.set(url, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error('[Social QR] Error generating QR code:', url, err);
    return '';
  }
}

/**
 * Synchronous fetch of active social links for instant layout rendering
 */
function getActiveSocialQrLinksSync() {
  let rows = [];
  try {
    rows = db.prepare('SELECT * FROM social_qr_links WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
  } catch (e) {
    console.error('[Social QR] Error querying links:', e.message);
  }

  return rows.map(row => {
    const platformKey = (row.platform || 'facebook').toLowerCase();
    const config = PLATFORM_CONFIGS[platformKey] || PLATFORM_CONFIGS.facebook;
    return {
      ...row,
      config,
      qrDataUrl: row.qr_data_url || qrCache.get(row.url) || ''
    };
  });
}

/**
 * Add a new social link with precomputed QR code
 */
async function addSocialLink({ platform, title, url }) {
  const cleanPlatform = (platform || 'facebook').toLowerCase();
  const cleanTitle = (title || PLATFORM_CONFIGS[cleanPlatform]?.name || 'Social Channel').trim();
  const cleanUrl = url.trim();

  const qrDataUrl = await generateQrDataUrl(cleanUrl);

  const stmt = db.prepare(`
    INSERT INTO social_qr_links (platform, title, url, qr_data_url, is_active, sort_order)
    VALUES (?, ?, ?, ?, 1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM social_qr_links))
  `);

  const info = stmt.run(cleanPlatform, cleanTitle, cleanUrl, qrDataUrl);
  return db.prepare('SELECT * FROM social_qr_links WHERE id = ?').get(info.lastInsertRowid);
}

/**
 * Update existing social link and regenerate its QR code
 */
async function updateSocialLink(id, { platform, title, url, is_active, sort_order }) {
  const existing = db.prepare('SELECT * FROM social_qr_links WHERE id = ?').get(id);
  if (!existing) throw new Error('Social link not found.');

  const newUrl = url !== undefined ? url.trim() : existing.url;
  const newPlatform = platform !== undefined ? platform.toLowerCase() : existing.platform;
  const newTitle = title !== undefined ? title.trim() : existing.title;
  const newActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;
  const newSort = sort_order !== undefined ? parseInt(sort_order) : existing.sort_order;

  // Generate new QR code if URL changed or missing
  let qrDataUrl = existing.qr_data_url;
  if (newUrl !== existing.url || !qrDataUrl) {
    qrCache.delete(existing.url);
    qrDataUrl = await generateQrDataUrl(newUrl);
  }

  db.prepare(`
    UPDATE social_qr_links
    SET platform = ?,
        title = ?,
        url = ?,
        qr_data_url = ?,
        is_active = ?,
        sort_order = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newPlatform, newTitle, newUrl, qrDataUrl, newActive, newSort, id);

  return db.prepare('SELECT * FROM social_qr_links WHERE id = ?').get(id);
}

/**
 * Delete a social link
 */
function deleteSocialLink(id) {
  const existing = db.prepare('SELECT * FROM social_qr_links WHERE id = ?').get(id);
  if (existing) {
    qrCache.delete(existing.url);
    db.prepare('DELETE FROM social_qr_links WHERE id = ?').run(id);
  }
}

/**
 * Render Header Social QR Container HTML Component (Replaces header AdSense)
 */
function renderHeaderSocialQrHtml() {
  const links = getActiveSocialQrLinksSync();
  if (!links || links.length === 0) return '';

  return `
  <!-- Official Social QR Codes Hub (Replaces Header AdSense) -->
  <div class="header-social-qr-container">
    <!-- Animated Calling Heading -->
    <div class="qr-animated-heading">
      <span class="qr-pulse-icon">📲</span>
      <span class="qr-animated-text">
        Scan the QR Codes to visit our official Fb Page and Youtube Channel
      </span>
    </div>

    <!-- QR Codes Row -->
    <div class="header-qr-grid">
      ${links.map(item => `
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="header-qr-card ${item.platform}" title="Scan with camera or click to visit official ${item.config.name}">
          <!-- QR Code Image with Centered Platform Logo -->
          <div class="qr-code-wrapper">
            <img src="${item.qrDataUrl}" alt="${item.config.name} QR Code" class="qr-code-img" loading="eager">
            <!-- Center Logo Overlay -->
            <div class="qr-center-logo ${item.platform}" style="${item.config.centerStyle}">
              ${item.config.svg}
            </div>
          </div>

          <!-- Label & Action -->
          <div class="qr-info-block">
            <div class="qr-platform-name">
              ${item.config.name}
            </div>
            <div class="qr-action-hint">
              <span>Scan / Visit ↗</span>
            </div>
          </div>
        </a>
      `).join('')}
    </div>
  </div>
  `;
}

module.exports = {
  PLATFORM_CONFIGS,
  generateQrDataUrl,
  getActiveSocialQrLinksSync,
  addSocialLink,
  updateSocialLink,
  deleteSocialLink,
  renderHeaderSocialQrHtml
};
