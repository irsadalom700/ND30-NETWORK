/**
 * ND30 LIVE - Frontend Notice Panel Component
 * Renders the notice banner with text styling, small photo, 5 text animations,
 * and live On/Off state.
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

const FONT_SIZES = {
  'normal': '0.95rem',
  'medium': '1.05rem',
  'large': '1.2rem',
  'xlarge': '1.35rem'
};

/**
 * Render the frontend Notice Panel HTML
 * If notice is null or is_active != 1, returns empty string ''
 */
function renderNoticePanel(notice) {
  if (!notice || notice.is_active !== 1) {
    return ''; // Completely removed when OFF
  }

  const bgStyle = notice.bg_theme === 'custom' && notice.custom_bg
    ? notice.custom_bg
    : (BG_THEMES[notice.bg_theme] || BG_THEMES['crimson-alert']);

  const fontSize = FONT_SIZES[notice.font_size] || '1.05rem';
  const fontWeight = notice.font_weight || '600';
  const textColor = notice.text_color || '#ffffff';
  const badgeText = escapeHtml(notice.badge_text || '📢 জাননী / NOTICE');
  const badgeBg = notice.badge_bg || '#dc2626';
  const badgeColor = notice.badge_color || '#ffffff';
  const rawMessage = notice.message || '';
  const messageSafe = escapeHtml(rawMessage);
  const linkUrl = notice.link_url ? escapeHtml(notice.link_url) : '';
  const linkText = escapeHtml(notice.link_text || 'পঢ়ক / Read More ➜');
  const animType = notice.animation_type || 'marquee';
  const showClose = notice.show_close_button === 1;

  return `
  <!-- ND30 LIVE Animated Notice Panel -->
  <section id="nd30NoticePanel" class="nd30-notice-banner-container" aria-label="Official Notice">
    <style>
      .nd30-notice-banner-container {
        width: 100%;
        margin: 0 0 16px 0;
        position: relative;
        z-index: 95;
      }
      .nd30-notice-card {
        background: ${bgStyle};
        color: ${textColor};
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.16);
        padding: 9px 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
        overflow: hidden;
      }
      .nd30-notice-badge {
        background: ${badgeBg};
        color: ${badgeColor};
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        padding: 4px 10px;
        border-radius: 9999px;
        white-space: nowrap;
        box-shadow: 0 0 12px rgba(220, 38, 38, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      .nd30-notice-pulse-dot {
        width: 7px;
        height: 7px;
        background: #ffffff;
        border-radius: 50%;
        display: inline-block;
        animation: nd30NoticeDotPulse 1.4s ease-in-out infinite;
      }
      @keyframes nd30NoticeDotPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.6); opacity: 0.5; }
      }
      .nd30-notice-thumb-link {
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
        text-decoration: none;
      }
      .nd30-notice-thumb {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        object-fit: cover;
        border: 2px solid rgba(255, 255, 255, 0.4);
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        background: rgba(0, 0, 0, 0.2);
      }
      .nd30-notice-thumb:hover {
        transform: scale(1.08);
        box-shadow: 0 4px 14px rgba(255, 255, 255, 0.3);
      }
      .nd30-notice-body {
        flex: 1;
        overflow: hidden;
        position: relative;
        display: flex;
        align-items: center;
        min-height: 28px;
      }
      .nd30-notice-text {
        font-size: ${fontSize};
        font-weight: ${fontWeight};
        color: ${textColor};
        line-height: 1.4;
      }
      
      /* Animation 1: Marquee Continuous Ticker */
      .notice-anim-marquee {
        display: inline-block;
        white-space: nowrap;
        padding-left: 100%;
        animation: nd30NoticeMarquee 26s linear infinite;
        will-change: transform;
      }
      .notice-anim-marquee:hover {
        animation-play-state: paused;
      }
      @keyframes nd30NoticeMarquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-100%); }
      }

      /* Animation 2: Neon Pulse & Glow */
      .notice-anim-pulse-glow {
        display: inline-block;
        animation: nd30NoticePulseGlow 2.5s ease-in-out infinite;
        will-change: transform, text-shadow;
      }
      @keyframes nd30NoticePulseGlow {
        0%, 100% {
          transform: scale(1);
          text-shadow: 0 0 4px rgba(255,255,255,0.4), 0 0 10px rgba(255,255,255,0.2);
        }
        50% {
          transform: scale(1.025);
          text-shadow: 0 0 12px rgba(255,255,255,0.95), 0 0 24px rgba(255,225,50,0.85), 0 0 35px rgba(239,68,68,0.7);
        }
      }

      /* Animation 3: Typewriter Effect */
      .notice-anim-typewriter {
        display: inline-block;
        position: relative;
        white-space: pre-wrap;
      }
      .notice-anim-typewriter-cursor {
        display: inline-block;
        margin-left: 3px;
        font-weight: 300;
        animation: nd30NoticeBlinkCursor 0.8s infinite;
        color: currentColor;
      }
      @keyframes nd30NoticeBlinkCursor {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }

      /* Animation 4: Bounce & Float */
      .notice-anim-bounce-float {
        display: inline-block;
        animation: nd30NoticeBounceFloat 2.6s ease-in-out infinite;
        will-change: transform;
      }
      @keyframes nd30NoticeBounceFloat {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-4px);
        }
      }

      /* Animation 5: Metallic Shimmer Shine */
      .notice-anim-shimmer-shine {
        display: inline-block;
        background: linear-gradient(
          90deg,
          ${textColor} 0%,
          #ffffff 35%,
          #ffe600 50%,
          #ffffff 65%,
          ${textColor} 100%
        );
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: nd30NoticeShimmer 3.2s linear infinite;
      }
      @keyframes nd30NoticeShimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }

      .nd30-notice-action-btn {
        background: rgba(255, 255, 255, 0.22);
        color: #ffffff;
        text-decoration: none;
        padding: 5px 12px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 700;
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.35);
        backdrop-filter: blur(4px);
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      .nd30-notice-action-btn:hover {
        background: #ffffff;
        color: #111827;
        box-shadow: 0 0 12px rgba(255, 255, 255, 0.6);
        transform: translateY(-1px);
      }
      .nd30-notice-close-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 1.1rem;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        line-height: 1;
        transition: all 0.15s ease;
        flex-shrink: 0;
      }
      .nd30-notice-close-btn:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.2);
      }

      @media (max-width: 768px) {
        .nd30-notice-card {
          padding: 8px 10px;
          gap: 8px;
        }
        .nd30-notice-thumb {
          width: 32px;
          height: 32px;
        }
        .nd30-notice-badge {
          font-size: 0.7rem;
          padding: 3px 8px;
        }
        .nd30-notice-text {
          font-size: 0.92rem !important;
        }
        .nd30-notice-action-btn {
          font-size: 0.72rem;
          padding: 4px 8px;
        }
      }
      @media (max-width: 480px) {
        .nd30-notice-card {
          padding: 7px 8px;
          gap: 6px;
        }
        .nd30-notice-badge {
          font-size: 0.65rem;
          padding: 2px 6px;
        }
        .nd30-notice-text {
          font-size: 0.82rem !important;
        }
        .nd30-notice-action-btn {
          font-size: 0.68rem;
          padding: 3px 6px;
        }
      }
    </style>

    <div class="container">
      <div class="nd30-notice-card">
        <!-- Notice Badge -->
        <div class="nd30-notice-badge">
          <span class="nd30-notice-pulse-dot"></span>
          <span>${badgeText}</span>
        </div>

        <!-- Animated Notice Body -->
        <div class="nd30-notice-body">
          ${animType === 'typewriter' ? `
            <span id="nd30TypewriterNotice" class="nd30-notice-text notice-anim-typewriter" data-text="${escapeHtml(rawMessage)}"></span><span class="notice-anim-typewriter-cursor">|</span>
          ` : `
            <div class="nd30-notice-text notice-anim-${animType}">
              ${messageSafe}
            </div>
          `}
        </div>

        <!-- Action Link Button (if configured) -->
        ${linkUrl ? `
          <a href="${linkUrl}" class="nd30-notice-action-btn">
            ${linkText}
          </a>
        ` : ''}

        <!-- Dismiss / Close Button -->
        ${showClose ? `
          <button type="button" class="nd30-notice-close-btn" onclick="document.getElementById('nd30NoticePanel').style.display='none'; try{sessionStorage.setItem('nd30_notice_closed_${notice.id}', '1');}catch(e){}" title="Close Notice" aria-label="Close Notice">
            &times;
          </button>
        ` : ''}
      </div>
    </div>

    ${animType === 'typewriter' ? `
    <script>
      (function() {
        var el = document.getElementById('nd30TypewriterNotice');
        if (!el) return;
        var fullText = el.getAttribute('data-text') || '';
        var charIdx = 0;
        var isDeleting = false;
        var speed = 45;

        function tick() {
          if (!isDeleting) {
            charIdx++;
            el.textContent = fullText.substring(0, charIdx);
            if (charIdx >= fullText.length) {
              isDeleting = true;
              setTimeout(tick, 4500); // Wait 4.5s before re-typing
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

