/**
 * ND30 LIVE - Frontend Notice Ticker Component
 * Container-aligned between Breaking News and Hero Section.
 * Fully customizable via Admin Notice Studio:
 * - Badge Text (multilingual for AS, HI, EN)
 * - Badge Style (Broadcast Pill, Solid Block, Neon Radiant, Gradient Gem)
 * - Badge Animation (Neon Blink, Pulse Glow, Radar Ping, Shimmer, Steady)
 * - Message Animation (Marquee Ticker, Pulse Glow, Typewriter, Bounce Float, Shimmer)
 * - Color Theme Presets
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

const BG_THEMES = {
  'crimson-alert': 'linear-gradient(135deg, #881337 0%, #be123c 50%, #9f1239 100%)',
  'midnight-blue': 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #172554 100%)',
  'emerald-green': 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #065f46 100%)',
  'royal-gold': 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #92400e 100%)',
  'deep-velvet': 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #5b21b6 100%)',
  'glass-slate': 'linear-gradient(135deg, rgba(30,41,59,0.96) 0%, rgba(15,23,42,0.98) 100%)'
};

const THEME_ACCENTS = {
  'crimson-alert': '#be123c',
  'midnight-blue': '#1e3a8a',
  'emerald-green': '#047857',
  'royal-gold': '#b45309',
  'deep-velvet': '#6d28d9',
  'glass-slate': '#334155'
};

/**
 * Render the frontend Notice Panel HTML
 * If notice is null or is_active != 1, returns empty string ''
 */
function renderNoticePanel(notice, currentLang = 'as') {
  if (!notice || notice.is_active !== 1) {
    return ''; // Completely removed when OFF
  }

  const langKey = (currentLang || 'as').toLowerCase().trim();

  // 1. Multilingual Badge Text
  let rawBadgeText = '';
  if (langKey === 'as') {
    rawBadgeText = notice.badge_text_as || notice.badge_text || '📢 বিশেষ জাননী';
  } else if (langKey === 'hi') {
    rawBadgeText = notice.badge_text_hi || '📢 विशेष सूचना';
  } else if (langKey === 'en') {
    rawBadgeText = notice.badge_text_en || '📢 SPECIAL NOTICE';
  } else {
    rawBadgeText = notice.badge_text || '📢 বিশেষ জাননী';
  }
  if (!rawBadgeText || !rawBadgeText.trim()) {
    rawBadgeText = langKey === 'as' ? '📢 বিশেষ জাননী' : (langKey === 'hi' ? '📢 विशेष सूचना' : '📢 SPECIAL NOTICE');
  }
  const badgeLabel = escapeHtml(rawBadgeText);

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

  // 4. Style & Animation Options
  const badgeStyle = notice.badge_style || 'broadcast-pill';
  const badgeAnim = notice.badge_anim || 'neon-blink';
  const animType = notice.animation_type || 'marquee';
  const bgTheme = notice.bg_theme || 'crimson-alert';
  const bgStyle = BG_THEMES[bgTheme] || BG_THEMES['crimson-alert'];
  const accentColor = THEME_ACCENTS[bgTheme] || notice.badge_bg || '#be123c';
  const textColor = notice.text_color || '#ffffff';

  return `
  <!-- Notice Section (Container-Aligned Between Breaking News & Hero Grid) -->
  <section id="nd30NoticePanel" class="notice-ticker-wrapper" aria-label="Official Notice">
    <style>
      .notice-ticker-wrapper {
        width: 100%;
        margin: 12px 0 14px 0;
        position: relative;
        z-index: 90;
      }
      .notice-ticker-card {
        background: ${bgStyle};
        color: ${textColor};
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 8px;
        display: flex;
        align-items: center;
        overflow: hidden;
        min-height: 46px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.18);
      }

      /* === BADGE STYLES === */

      /* Style 1: Modern Broadcast Pill (HUD Style) */
      .notice-badge-broadcast-pill {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 5px 14px;
        background: rgba(0, 0, 0, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 9999px;
        margin: 5px 12px 5px 10px;
        white-space: nowrap;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        font-weight: 800;
        font-size: 0.84rem;
        letter-spacing: 0.5px;
        color: #ffffff;
        flex-shrink: 0;
      }

      /* Style 2: Solid Block Ribbon (Matches Breaking News Flush Block) */
      .notice-badge-solid-block {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 11px 18px;
        background: ${accentColor};
        color: #ffffff;
        font-weight: 800;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
        flex-shrink: 0;
      }

      /* Style 3: Neon Radiant Badge */
      .notice-badge-neon-glow {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 5px 14px;
        background: rgba(0, 0, 0, 0.55);
        border: 1.5px solid #f43f5e;
        border-radius: 8px;
        margin: 5px 12px 5px 10px;
        white-space: nowrap;
        box-shadow: 0 0 14px rgba(244, 63, 94, 0.7), inset 0 0 10px rgba(244, 63, 94, 0.35);
        font-weight: 800;
        font-size: 0.84rem;
        letter-spacing: 0.6px;
        color: #ffffff;
        flex-shrink: 0;
      }

      /* Style 4: Gradient Gem Tag */
      .notice-badge-gradient-gem {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 5px 15px;
        background: linear-gradient(135deg, #e11d48, #be123c, #881337);
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 9999px;
        margin: 5px 12px 5px 10px;
        white-space: nowrap;
        box-shadow: 0 3px 12px rgba(225, 29, 72, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35);
        font-weight: 800;
        font-size: 0.84rem;
        letter-spacing: 0.5px;
        color: #ffffff;
        flex-shrink: 0;
      }

      /* Live Pulse Dot */
      .nd30-pulse-dot {
        width: 7px;
        height: 7px;
        background: #ffffff;
        border-radius: 50%;
        display: inline-block;
        flex-shrink: 0;
      }

      /* === BADGE ANIMATIONS === */
      .badge-anim-neon-blink {
        animation: nd30NoticeBlink 1.25s ease-in-out infinite;
      }
      @keyframes nd30NoticeBlink {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.95), 0 0 16px rgba(255, 225, 50, 0.75);
        }
        50% {
          opacity: 0.2;
          transform: scale(0.97);
          text-shadow: none;
        }
      }

      .badge-anim-pulse-glow {
        animation: nd30NoticePulseGlow 2.2s ease-in-out infinite;
      }
      @keyframes nd30NoticePulseGlow {
        0%, 100% {
          transform: scale(1);
          filter: drop-shadow(0 0 4px rgba(255,255,255,0.5));
        }
        50% {
          transform: scale(1.04);
          filter: drop-shadow(0 0 12px rgba(255,225,50,0.85)) drop-shadow(0 0 20px rgba(239,68,68,0.7));
        }
      }

      .badge-anim-radar-ping .nd30-pulse-dot {
        animation: nd30RadarPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      }
      @keyframes nd30RadarPing {
        0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.85); }
        70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
        100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
      }

      .badge-anim-shimmer {
        background: linear-gradient(90deg, #ffffff 0%, #ffe600 50%, #ffffff 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: nd30NoticeShimmer 3s linear infinite;
      }

      /* === NOTICE BODY CONTENT === */
      .notice-ticker-body {
        flex: 1;
        overflow: hidden;
        display: flex;
        align-items: center;
        padding: 0 16px;
        min-width: 0;
      }

      /* Animation 1: Marquee Ticker (Infinite Continuous Scroll) */
      .notice-ticker-marquee {
        display: flex;
        gap: 40px;
        white-space: nowrap;
        animation: noticeMarqueeScroll 35s linear infinite;
      }
      .notice-ticker-marquee:hover {
        animation-play-state: paused;
      }
      @keyframes noticeMarqueeScroll {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-50%); }
      }

      .notice-ticker-item {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-size: 0.95rem;
        font-weight: 600;
        color: ${textColor};
        text-decoration: none;
        transition: opacity 0.15s ease;
      }
      .notice-ticker-item:hover {
        opacity: 0.85;
        text-decoration: underline;
      }
      .notice-ticker-separator {
        color: #eab308;
        font-size: 0.85rem;
      }

      /* Animation 2: Neon Pulse & Glow on Message */
      .notice-msg-pulse-glow {
        display: inline-block;
        font-size: 0.98rem;
        font-weight: 600;
        animation: nd30NoticeTextGlow 2.4s ease-in-out infinite;
      }
      @keyframes nd30NoticeTextGlow {
        0%, 100% {
          text-shadow: 0 0 4px rgba(255,255,255,0.4);
        }
        50% {
          text-shadow: 0 0 12px rgba(255,255,255,0.95), 0 0 22px rgba(255,225,50,0.85);
        }
      }

      /* Animation 3: Typewriter Effect */
      .notice-msg-typewriter {
        font-size: 0.98rem;
        font-weight: 600;
        white-space: nowrap;
      }
      .notice-typewriter-cursor {
        display: inline-block;
        margin-left: 3px;
        font-weight: 300;
        animation: nd30NoticeCursorBlink 0.8s infinite;
      }
      @keyframes nd30NoticeCursorBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }

      /* Animation 4: Bounce & Float */
      .notice-msg-bounce-float {
        display: inline-block;
        font-size: 0.98rem;
        font-weight: 600;
        animation: nd30NoticeBounce 2.5s ease-in-out infinite;
      }
      @keyframes nd30NoticeBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }

      /* Animation 5: Metallic Shimmer Shine */
      .notice-msg-shimmer-shine {
        display: inline-block;
        font-size: 0.98rem;
        font-weight: 600;
        background: linear-gradient(90deg, ${textColor} 0%, #ffffff 35%, #ffe600 50%, #ffffff 65%, ${textColor} 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: nd30NoticeShimmer 3.2s linear infinite;
      }
      @keyframes nd30NoticeShimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }

      @media (max-width: 768px) {
        .notice-ticker-wrapper {
          margin: 8px 0 12px 0;
        }
        .notice-badge-broadcast-pill,
        .notice-badge-neon-glow,
        .notice-badge-gradient-gem {
          padding: 4px 10px;
          font-size: 0.72rem;
          margin: 4px 8px 4px 6px;
        }
        .notice-badge-solid-block {
          padding: 7px 12px;
          font-size: 0.72rem;
        }
        .notice-ticker-body {
          padding: 0 10px;
        }
        .notice-ticker-item {
          font-size: 0.82rem;
          padding: 6px 0;
        }
      }
    </style>

    <div class="container">
      <div class="notice-ticker-card">
        <!-- Badge / Label Element -->
        <div class="notice-badge-${badgeStyle}">
          <span class="nd30-pulse-dot"></span>
          <span class="badge-anim-${badgeAnim}">${badgeLabel}</span>
        </div>

        <!-- Main Notice Content -->
        <div class="notice-ticker-body">
          ${animType === 'marquee' ? `
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
          ` : animType === 'typewriter' ? `
            <a href="${dynamicLinkUrl || '#'}" style="text-decoration:none; color:inherit; display:flex; align-items:center;" ${!dynamicLinkUrl ? 'style="cursor:default;"' : ''}>
              <span id="nd30NoticeTypewriter" class="notice-msg-typewriter" data-text="${escapeHtml(rawMessage)}"></span><span class="notice-typewriter-cursor">|</span>
            </a>
          ` : `
            <a href="${dynamicLinkUrl || '#'}" class="notice-ticker-item" ${!dynamicLinkUrl ? 'style="cursor:default;"' : ''}>
              <span class="notice-msg-${animType}">${messageSafe}</span>
            </a>
          `}
        </div>
      </div>
    </div>

    ${animType === 'typewriter' ? `
    <script>
      (function() {
        var el = document.getElementById('nd30NoticeTypewriter');
        if (!el) return;
        var fullText = el.getAttribute('data-text') || '';
        var charIdx = 0;
        var isDeleting = false;
        var speed = 40;

        function tick() {
          if (!isDeleting) {
            charIdx++;
            el.textContent = fullText.substring(0, charIdx);
            if (charIdx >= fullText.length) {
              isDeleting = true;
              setTimeout(tick, 4500);
              return;
            }
          } else {
            charIdx--;
            el.textContent = fullText.substring(0, charIdx);
            if (charIdx <= 0) {
              isDeleting = false;
              setTimeout(tick, 600);
              return;
            }
          }
          setTimeout(tick, isDeleting ? 25 : speed);
        }
        tick();
      })();
    </script>
    ` : ''}
  </section>
  `;
}

module.exports = {
  renderNoticePanel
};
