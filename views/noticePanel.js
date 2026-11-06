/**
 * ND30 LIVE - Frontend Notice Ticker Component
 * Matches the exact design, proportions, animation, and responsiveness
 * of the Breaking News Section directly above it.
 * Full multilingual translation support for Assamese, Hindi, and English.
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Render the frontend Notice Panel HTML
 * If notice is null or is_active != 1, returns empty string ''
 */
function renderNoticePanel(notice, currentLang = 'as') {
  if (!notice || notice.is_active !== 1) {
    return ''; // Completely removed when OFF
  }

  // 1. Multilingual Label (Matches Breaking News Ticker Label format)
  const langKey = (currentLang || 'as').toLowerCase().trim();
  let noticeLabel = 'NOTICE';
  if (langKey === 'as') {
    noticeLabel = 'জাননী';
  } else if (langKey === 'hi') {
    noticeLabel = 'सूचना';
  } else {
    noticeLabel = 'NOTICE';
  }

  // 2. Multilingual Main Text Selection
  let rawMessage = '';
  if (langKey === 'as') {
    rawMessage = notice.message_as || notice.message || '';
  } else if (langKey === 'hi') {
    rawMessage = notice.message_hi || notice.message || '';
  } else if (langKey === 'en') {
    rawMessage = notice.message_en || notice.message || '';
  } else {
    rawMessage = notice.message || '';
  }

  if (!rawMessage || !rawMessage.trim()) {
    rawMessage = notice.message || '';
  }

  const messageSafe = escapeHtml(rawMessage);

  // 3. Dynamic Link URL preserving current language
  const linkUrl = notice.link_url ? escapeHtml(notice.link_url) : '';
  let dynamicLinkUrl = linkUrl;
  if (dynamicLinkUrl === '/as/' || dynamicLinkUrl === '/hi/' || dynamicLinkUrl === '/en/') {
    dynamicLinkUrl = `/${langKey}/`;
  }

  return `
  <!-- Notice Ticker (Exact Match to Breaking News Section) -->
  <section id="nd30NoticePanel" class="notice-ticker" aria-label="Official Notice Ticker">
    <style>
      .notice-ticker {
        background: var(--bg-card);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: stretch;
        overflow: hidden;
        width: 100%;
        position: relative;
        z-index: 90;
      }
      .notice-ticker-label {
        background: #be123c;
        color: #ffffff;
        padding: 10px 18px;
        font-weight: 800;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
        z-index: 2;
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
        flex-shrink: 0;
      }
      .notice-ticker-content {
        flex: 1;
        overflow: hidden;
        display: flex;
        align-items: center;
        padding: 0 16px;
      }
      .notice-ticker-marquee {
        display: flex;
        gap: 40px;
        white-space: nowrap;
        animation: noticeMarqueeScroll 35s linear infinite;
      }
      .notice-ticker-marquee:hover {
        animation-play-state: paused;
      }
      .notice-ticker-item {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-size: 0.90rem;
        font-weight: 500;
        color: var(--text-main);
        text-decoration: none;
        transition: color 0.15s ease;
      }
      .notice-ticker-item:hover {
        color: #f43f5e;
        text-decoration: underline;
      }
      .notice-ticker-separator {
        color: var(--accent-gold);
        font-size: 0.85rem;
      }
      @keyframes noticeMarqueeScroll {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-50%); }
      }
      @media (max-width: 768px) {
        .notice-ticker-label {
          padding: 6px 10px;
          font-size: 0.72rem;
        }
        .notice-ticker-content {
          padding: 0 10px;
        }
        .notice-ticker-item {
          font-size: 0.82rem;
          padding: 6px 0;
        }
      }
    </style>

    <div class="notice-ticker-label">
      <span class="pulse-dot"></span>
      ${noticeLabel}
    </div>
    <div class="notice-ticker-content">
      <div class="notice-ticker-marquee">
        <a href="${dynamicLinkUrl || '#'}" class="notice-ticker-item" ${!dynamicLinkUrl ? 'style="cursor:default;"' : ''}>
          <span>${messageSafe}</span>
          <span class="notice-ticker-separator">✦</span>
        </a>
        <a href="${dynamicLinkUrl || '#'}" class="notice-ticker-item" ${!dynamicLinkUrl ? 'style="cursor:default;"' : ''}>
          <span>${messageSafe}</span>
          <span class="notice-ticker-separator">✦</span>
        </a>
        <a href="${dynamicLinkUrl || '#'}" class="notice-ticker-item" ${!dynamicLinkUrl ? 'style="cursor:default;"' : ''}>
          <span>${messageSafe}</span>
          <span class="notice-ticker-separator">✦</span>
        </a>
        <a href="${dynamicLinkUrl || '#'}" class="notice-ticker-item" ${!dynamicLinkUrl ? 'style="cursor:default;"' : ''}>
          <span>${messageSafe}</span>
          <span class="notice-ticker-separator">✦</span>
        </a>
      </div>
    </div>
  </section>
  `;
}

module.exports = {
  renderNoticePanel
};
