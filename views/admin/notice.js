/**
 * ND30 LIVE - Admin Notice Panel Manager View
 * Interactive control studio for frontend notice banner:
 * - Live On/Off toggle switch
 * - Manual text editing with Assamese/Hindi/English support
 * - Small photo/thumbnail upload and preview
 * - 5 Text Animations (Marquee, Pulse Glow, Typewriter, Bounce Float, Shimmer Shine)
 * - Typography and color/theme styling controls
 * - Real-time live preview
 */

const { renderAdminLayout } = require('./layout');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderNoticeAdmin({ notice, message = '', error = '', currentUser = null }) {
  const n = notice || {
    id: 1,
    title: 'ND30 LIVE Official Notice',
    message: 'উত্তৰ-পূবৰ নিৰ্ভীক আৰু নিৰপেক্ষ সংবাদ মাধ্যম ND30 LIVE লৈ স্বাগতম! Welcome to ND30 LIVE Digital Portal.',
    image_url: '/images/nd30_live_logo.png',
    link_url: '/as/',
    link_text: 'অধিক পঢ়ক ➜',
    badge_text: '📢 বিশেষ জাননী',
    badge_bg: '#dc2626',
    badge_color: '#ffffff',
    animation_type: 'marquee',
    bg_theme: 'crimson-alert',
    custom_bg: '',
    text_color: '#ffffff',
    font_size: 'medium',
    font_weight: '600',
    is_active: 1,
    show_close_button: 1
  };

  const isActive = n.is_active === 1;

  const content = `
  <div class="admin-notice-studio">
    <!-- Top Action Bar -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--admin-border);">
      <div>
        <h1 style="font-size:1.6rem; font-weight:800; color:#ffffff; margin:0 0 6px 0; display:flex; align-items:center; gap:10px;">
          <span>🔔</span> Frontend Notice Panel Studio
        </h1>
        <p style="color:var(--admin-muted); margin:0; font-size:0.9rem;">
          Broadcast urgent alerts, public notices, and announcements with manual text, small photos, custom typography, and 5 text animation engines.
        </p>
      </div>

      <!-- Live Master On/Off Switch -->
      <div style="display:flex; align-items:center; gap:14px; background:var(--admin-card-bg); padding:10px 18px; border-radius:12px; border:1px solid var(--admin-border); box-shadow:0 4px 12px rgba(0,0,0,0.25);">
        <div style="text-align:right;">
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--admin-muted); font-weight:700;">Frontend Visibility</div>
          <div id="statusBadge" style="font-size:0.88rem; font-weight:800; color:${isActive ? '#10b981' : '#9ca3af'}; display:flex; align-items:center; gap:6px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${isActive ? '#10b981' : '#6b7280'}; box-shadow:${isActive ? '0 0 8px #10b981' : 'none'};"></span>
            <span id="statusText">${isActive ? 'ACTIVE (ON FRONTEND)' : 'INACTIVE (HIDDEN)'}</span>
          </div>
        </div>

        <button type="button" id="quickToggleBtn" onclick="toggleNoticeVisibility()" class="btn" style="background:${isActive ? '#dc2626' : '#10b981'}; color:#ffffff; font-weight:700; padding:8px 16px; border-radius:8px; border:none; cursor:pointer; font-size:0.85rem; transition:all 0.2s ease;">
          ${isActive ? '⏸ Turn Notice OFF' : '▶ Turn Notice ON'}
        </button>

        <a href="/as/" target="_blank" class="btn" style="background:rgba(255,255,255,0.08); color:var(--admin-text); border:1px solid var(--admin-border); padding:8px 14px; border-radius:8px; font-size:0.85rem; text-decoration:none; display:flex; align-items:center; gap:6px;">
          <span>🌐</span> View Site ↗
        </a>
      </div>
    </div>

    ${message ? `
      <div style="background:rgba(16, 185, 129, 0.15); border:1px solid #10b981; color:#10b981; padding:12px 18px; border-radius:8px; margin-bottom:20px; font-weight:600; display:flex; align-items:center; gap:8px;">
        <span>✅</span> ${escapeHtml(message)}
      </div>
    ` : ''}

    ${error ? `
      <div style="background:rgba(239, 68, 68, 0.15); border:1px solid #ef4444; color:#ef4444; padding:12px 18px; border-radius:8px; margin-bottom:20px; font-weight:600; display:flex; align-items:center; gap:8px;">
        <span>⚠️</span> ${escapeHtml(error)}
      </div>
    ` : ''}

    <!-- REAL-TIME INTERACTIVE LIVE PREVIEW -->
    <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:20px; margin-bottom:28px; box-shadow:0 4px 16px rgba(0,0,0,0.3);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span style="font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--admin-muted); display:flex; align-items:center; gap:8px;">
          <span>👁️</span> Real-Time Live Preview (Matches Frontend Appearance)
        </span>
        <span style="font-size:0.75rem; color:var(--admin-muted);">Updates instantly as you edit below</span>
      </div>

      <!-- Preview Canvas -->
      <div id="previewCard" style="background:linear-gradient(135deg, #881337 0%, #be123c 50%, #9f1239 100%); color:#ffffff; border-radius:10px; padding:10px 18px; display:flex; align-items:center; box-shadow:0 6px 20px rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.18); min-height:50px; overflow:hidden;">
        <!-- Blinking Notice Tag Preview -->
        <div class="nd30-notice-tag" style="display:inline-flex; align-items:center; flex-shrink:0; padding:4px 12px; background:rgba(0,0,0,0.32); border:1px solid rgba(255,255,255,0.28); border-radius:6px; margin-right:14px; box-shadow:0 2px 8px rgba(0,0,0,0.25);">
          <span class="nd30-notice-blink-text" style="font-weight:800; font-size:0.84rem; letter-spacing:0.8px; text-transform:uppercase; color:#ffffff; animation:nd30NoticeBlink 1.25s ease-in-out infinite; white-space:nowrap;">Notice / জাননী / सूचना</span>
        </div>

        <!-- Badge (Hidden) -->
        <div id="previewBadge" style="display:none !important;">
          <span style="width:7px; height:7px; background:#fff; border-radius:50%; display:inline-block; animation:nd30NoticeDotPulse 1.4s ease-in-out infinite;"></span>
          <span id="previewBadgeText">${escapeHtml(n.badge_text)}</span>
        </div>

        <!-- Animated Message Text -->
        <div id="previewBody" style="flex:1; width:100%; overflow:hidden; display:flex; align-items:center;">
          <div id="previewText" class="notice-anim-${n.animation_type}" style="font-size:1.05rem; font-weight:${n.font_weight}; color:${n.text_color}; line-height:1.4;">
            ${escapeHtml(n.message)}
          </div>
        </div>

        <!-- Link Button (Hidden) -->
        <span id="previewActionBtn" style="display:none !important;">
          ${escapeHtml(n.link_text || 'পঢ়ক / Read More ➜')}
        </span>

        <!-- Dismiss Close Button (Hidden) -->
        <span id="previewCloseBtn" style="display:none !important;">
          &times;
        </span>
      </div>
    </div>

    <!-- MAIN CONFIGURATION FORM -->
    <form action="/admin/notice/save" method="POST" enctype="multipart/form-data" id="noticeForm">
      <input type="hidden" name="id" value="${n.id}">
      <input type="hidden" name="is_active" id="isActiveInput" value="${n.is_active}">

      <div class="admin-notice-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:28px;">
        <!-- Column 1: Content & Small Photo -->
        <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:22px;">
          <h2 style="font-size:1.1rem; font-weight:700; color:#ffffff; margin:0 0 16px 0; display:flex; align-items:center; gap:8px;">
            <span>📝</span> 1. Notice Text & Message
          </h2>

          <!-- Notice Message -->
          <div style="margin-bottom:18px;">
            <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--admin-text); margin-bottom:6px;">
              Notice Message (বাতৰি / জাননীৰ পাঠ্য) <span style="color:#ef4444;">*</span>
            </label>
            <textarea name="message" id="inputMessage" rows="3" required oninput="updateLivePreview()" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:8px; padding:10px 14px; font-size:0.95rem; line-height:1.5; resize:vertical;" placeholder="Enter notice text in Assamese, Hindi, or English (e.g. বিশেষ ঘোষণা: ...)">${escapeHtml(n.message)}</textarea>
            <div style="font-size:0.75rem; color:var(--admin-muted); margin-top:4px;">
              Tip: Supports Assamese, Hindi, English, and emojis (📢, 🚨, ✨, 🔴).
            </div>
          </div>

          <!-- Hidden Image URL (Empty - Photo Section Hidden) -->
          <input type="hidden" name="image_url" id="imageUrlInput" value="">

          <!-- Hidden Badge Settings (Badge hidden from notice bar) -->
          <input type="hidden" name="badge_text" id="inputBadgeText" value="${escapeHtml(n.badge_text || '📢 বিশেষ জাননী')}">
          <input type="hidden" name="badge_bg" id="inputBadgeBg" value="${n.badge_bg || '#dc2626'}">
          <input type="hidden" name="badge_color" value="${n.badge_color || '#ffffff'}">

          <!-- Optional Link URL -->
          <div style="margin-bottom:18px;">
            <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--admin-text); margin-bottom:6px;">Target Link URL (ঐচ্ছিক লিংক - Notice Destination)</label>
            <input type="text" name="link_url" id="inputLinkUrl" value="${escapeHtml(n.link_url)}" oninput="updateLivePreview()" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:6px; padding:8px 12px; font-size:0.85rem;" placeholder="/as/article/... or https://...">
            <input type="hidden" name="link_text" id="inputLinkText" value="${escapeHtml(n.link_text || '')}">
          </div>
        </div>

        <!-- Column 2: 5 Animations & Visual Styling -->
        <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:22px;">
          <h2 style="font-size:1.1rem; font-weight:700; color:#ffffff; margin:0 0 16px 0; display:flex; align-items:center; gap:8px;">
            <span>✨</span> 2. Choose Text Animation (5 Options)
          </h2>

          <!-- Animation Selector Cards -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px;">
            <!-- Animation 1: Marquee -->
            <label class="anim-card ${n.animation_type === 'marquee' ? 'selected' : ''}" onclick="selectAnimation('marquee')">
              <input type="radio" name="animation_type" value="marquee" ${n.animation_type === 'marquee' ? 'checked' : ''} style="display:none;">
              <div style="font-weight:700; font-size:0.9rem; color:#ffffff; display:flex; align-items:center; gap:6px;">
                <span>🏃</span> 1. Marquee Ticker
              </div>
              <div style="font-size:0.75rem; color:var(--admin-muted); margin-top:3px;">
                Continuous smooth horizontal ticker scroll.
              </div>
            </label>

            <!-- Animation 2: Pulse Glow -->
            <label class="anim-card ${n.animation_type === 'pulse-glow' ? 'selected' : ''}" onclick="selectAnimation('pulse-glow')">
              <input type="radio" name="animation_type" value="pulse-glow" ${n.animation_type === 'pulse-glow' ? 'checked' : ''} style="display:none;">
              <div style="font-weight:700; font-size:0.9rem; color:#ffffff; display:flex; align-items:center; gap:6px;">
                <span>💡</span> 2. Neon Pulse & Glow
              </div>
              <div style="font-size:0.75rem; color:var(--admin-muted); margin-top:3px;">
                Rhythmic breathing neon glow with subtle scale.
              </div>
            </label>

            <!-- Animation 3: Typewriter -->
            <label class="anim-card ${n.animation_type === 'typewriter' ? 'selected' : ''}" onclick="selectAnimation('typewriter')">
              <input type="radio" name="animation_type" value="typewriter" ${n.animation_type === 'typewriter' ? 'checked' : ''} style="display:none;">
              <div style="font-weight:700; font-size:0.9rem; color:#ffffff; display:flex; align-items:center; gap:6px;">
                <span>⌨️</span> 3. Typewriter Effect
              </div>
              <div style="font-size:0.75rem; color:var(--admin-muted); margin-top:3px;">
                Dynamic letter-by-letter live typing with cursor.
              </div>
            </label>

            <!-- Animation 4: Bounce Float -->
            <label class="anim-card ${n.animation_type === 'bounce-float' ? 'selected' : ''}" onclick="selectAnimation('bounce-float')">
              <input type="radio" name="animation_type" value="bounce-float" ${n.animation_type === 'bounce-float' ? 'checked' : ''} style="display:none;">
              <div style="font-weight:700; font-size:0.9rem; color:#ffffff; display:flex; align-items:center; gap:6px;">
                <span>🌊</span> 4. Bounce & Float
              </div>
              <div style="font-size:0.75rem; color:var(--admin-muted); margin-top:3px;">
                Playful smooth vertical floating wave motion.
              </div>
            </label>

            <!-- Animation 5: Shimmer Shine -->
            <label class="anim-card ${n.animation_type === 'shimmer-shine' ? 'selected' : ''}" onclick="selectAnimation('shimmer-shine')" style="grid-column: span 2;">
              <input type="radio" name="animation_type" value="shimmer-shine" ${n.animation_type === 'shimmer-shine' ? 'checked' : ''} style="display:none;">
              <div style="font-weight:700; font-size:0.9rem; color:#ffffff; display:flex; align-items:center; gap:6px;">
                <span>✨</span> 5. Metallic Shimmer Shine
              </div>
              <div style="font-size:0.75rem; color:var(--admin-muted); margin-top:3px;">
                Radiant metallic light beam sweep continuously gliding across text.
              </div>
            </label>
          </div>

          <h2 style="font-size:1.1rem; font-weight:700; color:#ffffff; margin:20px 0 16px 0; display:flex; align-items:center; gap:8px;">
            <span>🎨</span> 3. Text Styling & Color Theme
          </h2>

          <!-- Background Theme Presets -->
          <div style="margin-bottom:16px;">
            <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--admin-text); margin-bottom:6px;">Background Theme</label>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
              <button type="button" onclick="selectTheme('crimson-alert')" class="theme-preset-btn ${n.bg_theme === 'crimson-alert' ? 'active' : ''}" style="background:linear-gradient(135deg, #881337, #be123c);">
                🔴 Crimson Alert
              </button>
              <button type="button" onclick="selectTheme('midnight-blue')" class="theme-preset-btn ${n.bg_theme === 'midnight-blue' ? 'active' : ''}" style="background:linear-gradient(135deg, #0f172a, #1e3a8a);">
                🔵 Midnight Navy
              </button>
              <button type="button" onclick="selectTheme('emerald-green')" class="theme-preset-btn ${n.bg_theme === 'emerald-green' ? 'active' : ''}" style="background:linear-gradient(135deg, #064e3b, #047857);">
                🟢 Emerald Flash
              </button>
              <button type="button" onclick="selectTheme('royal-gold')" class="theme-preset-btn ${n.bg_theme === 'royal-gold' ? 'active' : ''}" style="background:linear-gradient(135deg, #78350f, #b45309);">
                🟡 Royal Gold
              </button>
              <button type="button" onclick="selectTheme('deep-velvet')" class="theme-preset-btn ${n.bg_theme === 'deep-velvet' ? 'active' : ''}" style="background:linear-gradient(135deg, #4c1d95, #6d28d9);">
                🟣 Deep Velvet
              </button>
              <button type="button" onclick="selectTheme('glass-slate')" class="theme-preset-btn ${n.bg_theme === 'glass-slate' ? 'active' : ''}" style="background:linear-gradient(135deg, #1e293b, #0f172a);">
                ⬛ Dark Slate
              </button>
            </div>
            <input type="hidden" name="bg_theme" id="inputBgTheme" value="${n.bg_theme}">
          </div>

          <!-- Typography: Text Color, Size, Weight -->
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:16px;">
            <div>
              <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--admin-text); margin-bottom:6px;">Text Color</label>
              <div style="display:flex; align-items:center; gap:8px;">
                <input type="color" name="text_color" id="inputTextColor" value="${n.text_color || '#ffffff'}" oninput="updateLivePreview()" style="width:36px; height:34px; padding:0; border:none; border-radius:6px; cursor:pointer; background:none;">
                <input type="text" id="textColorHex" value="${n.text_color || '#ffffff'}" oninput="syncColorInput('textColorHex', 'inputTextColor')" style="flex:1; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:6px; padding:5px 8px; font-size:0.8rem;">
              </div>
            </div>

            <div>
              <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--admin-text); margin-bottom:6px;">Font Size</label>
              <select name="font_size" id="inputFontSize" onchange="updateLivePreview()" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:6px; padding:7px 10px; font-size:0.85rem;">
                <option value="normal" ${n.font_size === 'normal' ? 'selected' : ''}>Normal (0.95rem)</option>
                <option value="medium" ${n.font_size === 'medium' ? 'selected' : ''}>Medium (1.05rem)</option>
                <option value="large" ${n.font_size === 'large' ? 'selected' : ''}>Large (1.20rem)</option>
                <option value="xlarge" ${n.font_size === 'xlarge' ? 'selected' : ''}>Extra Large (1.35rem)</option>
              </select>
            </div>

            <div>
              <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--admin-text); margin-bottom:6px;">Font Weight</label>
              <select name="font_weight" id="inputFontWeight" onchange="updateLivePreview()" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:6px; padding:7px 10px; font-size:0.85rem;">
                <option value="400" ${n.font_weight === '400' ? 'selected' : ''}>Regular (400)</option>
                <option value="600" ${n.font_weight === '600' ? 'selected' : ''}>Semi-Bold (600)</option>
                <option value="700" ${n.font_weight === '700' ? 'selected' : ''}>Bold (700)</option>
                <option value="900" ${n.font_weight === '900' ? 'selected' : ''}>Heavy Black (900)</option>
              </select>
            </div>
          </div>

          <!-- Allow Close Button (Hidden - Dismiss button removed from notice banner) -->
          <input type="hidden" name="show_close_button" id="inputCloseBtn" value="0">
        </div>
      </div>

      <!-- Submit Action Bar -->
      <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:18px 24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div style="font-size:0.85rem; color:var(--admin-muted);">
          Changes are deployed immediately to the live frontend upon saving.
        </div>

        <div style="display:flex; gap:12px;">
          <button type="submit" class="btn btn-primary" style="background:#dc2626; color:#ffffff; font-weight:800; padding:10px 24px; border-radius:8px; border:none; cursor:pointer; font-size:0.95rem; box-shadow:0 4px 14px rgba(220,38,38,0.4); display:flex; align-items:center; gap:8px;">
            <span>💾</span> Save Notice & Publish Live
          </button>
        </div>
      </div>
    </form>
  </div>

  <style>
    .anim-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--admin-border);
      border-radius: 8px;
      padding: 12px 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: block;
    }
    .anim-card:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
    .anim-card.selected {
      background: rgba(220, 38, 38, 0.15);
      border-color: #dc2626;
      box-shadow: 0 0 12px rgba(220, 38, 38, 0.3);
    }
    .theme-preset-btn {
      color: #ffffff;
      border: 2px solid transparent;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s ease;
    }
    .theme-preset-btn:hover {
      transform: scale(1.03);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
    }
    .theme-preset-btn.active {
      border-color: #ffffff;
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.6);
    }
    
    /* Animation Keyframes in Admin Preview */
    .notice-anim-marquee {
      display: inline-block;
      white-space: nowrap;
      padding-left: 100%;
      animation: nd30NoticeMarquee 20s linear infinite;
    }
    @keyframes nd30NoticeMarquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-100%); }
    }
    .notice-anim-pulse-glow {
      display: inline-block;
      animation: nd30NoticePulseGlow 2.5s ease-in-out infinite;
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
    .notice-anim-typewriter {
      display: inline-block;
      border-right: 2px solid currentColor;
      white-space: pre-wrap;
      animation: nd30BlinkCursor 0.8s infinite;
    }
    @keyframes nd30BlinkCursor {
      0%, 100% { border-color: currentColor; }
      50% { border-color: transparent; }
    }
    .notice-anim-bounce-float {
      display: inline-block;
      animation: nd30NoticeBounceFloat 2.6s ease-in-out infinite;
    }
    @keyframes nd30NoticeBounceFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    .notice-anim-shimmer-shine {
      display: inline-block;
      background: linear-gradient(90deg, currentColor 0%, #ffffff 35%, #ffe600 50%, #ffffff 65%, currentColor 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: nd30NoticeShimmer 3.2s linear infinite;
    }
    @keyframes nd30NoticeShimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes nd30NoticeDotPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.6); opacity: 0.5; }
    }
    @keyframes nd30NoticeBlink {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
        text-shadow: 0 0 8px rgba(255, 255, 255, 0.95), 0 0 16px rgba(255, 225, 50, 0.75);
      }
      50% {
        opacity: 0.15;
        transform: scale(0.97);
        text-shadow: none;
      }
    }
  </style>

  <script>
    var currentAnimation = '${n.animation_type}';
    var currentTheme = '${n.bg_theme}';
    var themes = {
      'crimson-alert': 'linear-gradient(135deg, #881337 0%, #be123c 50%, #9f1239 100%)',
      'midnight-blue': 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #172554 100%)',
      'emerald-green': 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #065f46 100%)',
      'royal-gold': 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #92400e 100%)',
      'deep-velvet': 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #5b21b6 100%)',
      'glass-slate': 'linear-gradient(135deg, rgba(30,41,59,0.96) 0%, rgba(15,23,42,0.98) 100%)'
    };

    var fontSizes = {
      'normal': '0.95rem',
      'medium': '1.05rem',
      'large': '1.20rem',
      'xlarge': '1.35rem'
    };

    function selectAnimation(anim) {
      currentAnimation = anim;
      document.querySelectorAll('.anim-card').forEach(function(c) {
        c.classList.remove('selected');
        var input = c.querySelector('input[type="radio"]');
        if (input && input.value === anim) {
          input.checked = true;
          c.classList.add('selected');
        }
      });
      updateLivePreview();
    }

    function selectTheme(theme) {
      currentTheme = theme;
      document.getElementById('inputBgTheme').value = theme;
      document.querySelectorAll('.theme-preset-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      event.target.classList.add('active');
      updateLivePreview();
    }

    function syncColorInput(sourceId, targetId) {
      var val = document.getElementById(sourceId).value;
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        document.getElementById(targetId).value = val;
        updateLivePreview();
      }
    }

    function updateLivePreview() {
      var msg = document.getElementById('inputMessage').value || 'Enter notice message...';
      var badgeText = document.getElementById('inputBadgeText').value || '📢 জাননী / NOTICE';
      var badgeBg = document.getElementById('inputBadgeBg').value || '#dc2626';
      var textColor = document.getElementById('inputTextColor').value || '#ffffff';
      var fontSizeKey = document.getElementById('inputFontSize').value;
      var fontWeight = document.getElementById('inputFontWeight').value;
      var linkUrl = document.getElementById('inputLinkUrl').value;
      var linkText = document.getElementById('inputLinkText').value || 'পঢ়ক / Read More ➜';
      var showClose = document.getElementById('inputCloseBtn').checked;

      // Update Card Background
      document.getElementById('previewCard').style.background = themes[currentTheme] || themes['crimson-alert'];

      // Ensure Badge remains hidden
      var badgeEl = document.getElementById('previewBadge');
      if (badgeEl) badgeEl.style.display = 'none';

      // Update Text & Animation
      var textEl = document.getElementById('previewText');
      textEl.textContent = msg;
      textEl.className = 'notice-anim-' + currentAnimation;
      textEl.style.color = textColor;
      textEl.style.fontSize = fontSizes[fontSizeKey] || '1.05rem';
      textEl.style.fontWeight = fontWeight;

      // Ensure Action Button remains hidden
      var btn = document.getElementById('previewActionBtn');
      if (btn) btn.style.display = 'none';

      // Ensure Close Button remains hidden
      var closeBtn = document.getElementById('previewCloseBtn');
      if (closeBtn) closeBtn.style.display = 'none';
    }

    // Quick Live Ajax Toggle
    function toggleNoticeVisibility() {
      var currActive = document.getElementById('isActiveInput').value === '1';
      var newActive = !currActive;

      var btn = document.getElementById('quickToggleBtn');
      btn.disabled = true;
      btn.textContent = 'Updating...';

      fetch('/admin/notice/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActive ? 1 : 0 })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        btn.disabled = false;
        if (data.success) {
          var isNowActive = data.is_active === 1;
          document.getElementById('isActiveInput').value = isNowActive ? '1' : '0';
          
          var badge = document.getElementById('statusBadge');
          var text = document.getElementById('statusText');
          
          if (isNowActive) {
            badge.style.color = '#10b981';
            badge.querySelector('span:first-child').style.background = '#10b981';
            badge.querySelector('span:first-child').style.boxShadow = '0 0 8px #10b981';
            text.textContent = 'ACTIVE (ON FRONTEND)';
            btn.style.background = '#dc2626';
            btn.textContent = '⏸ Turn Notice OFF';
          } else {
            badge.style.color = '#9ca3af';
            badge.querySelector('span:first-child').style.background = '#6b7280';
            badge.querySelector('span:first-child').style.boxShadow = 'none';
            text.textContent = 'INACTIVE (HIDDEN)';
            btn.style.background = '#10b981';
            btn.textContent = '▶ Turn Notice ON';
          }
        }
      })
      .catch(function(err) {
        btn.disabled = false;
        alert('Error updating notice visibility: ' + err.message);
      });
    }

    // Initial Live Preview Render
    updateLivePreview();
  </script>
  `;

  return renderAdminLayout({
    title: 'Frontend Notice Panel Studio',
    activeNav: 'notice',
    content,
    currentUser
  });
}

module.exports = {
  renderNoticeAdmin
};

