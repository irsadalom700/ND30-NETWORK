/**
 * ND30 LIVE - Admin Notice Panel Manager View
 * Interactive control studio for frontend notice banner:
 * - Live On/Off toggle switch
 * - 3-Language Multilingual text editing (Assamese, Hindi, English)
 * - 1-Click Neural AI Auto-Translation across all 3 languages
 * - Exact Breaking News Ticker Design Real-Time Live Preview
 * - Typography and color/theme styling controls
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
    message_as: 'উত্তৰ-পূবৰ নিৰ্ভীক আৰু নিৰপেক্ষ সংবাদ মাধ্যম ND30 LIVE লৈ স্বাগতম! Welcome to ND30 LIVE Digital Portal.',
    message_hi: 'पूर्वोत्तर के निर्भीक और निष्पक्ष समाचार माध्यम ND30 LIVE में आपका स्वागत है! ताज़ा समाचारों के लिए जुड़े रहें।',
    message_en: "Welcome to ND30 LIVE - Northeast India's Bold & Unbiased Digital News Portal. Stay tuned for live updates.",
    image_url: '',
    link_url: '/as/',
    link_text: 'পঢ়ক / Read More',
    badge_text: 'জাননী / NOTICE',
    badge_bg: '#be123c',
    badge_color: '#ffffff',
    animation_type: 'marquee',
    bg_theme: 'crimson-alert',
    custom_bg: '',
    text_color: '#ffffff',
    font_size: 'medium',
    font_weight: '600',
    is_active: 1,
    show_close_button: 0
  };

  const isActive = n.is_active === 1;
  const msgAs = n.message_as || n.message || 'উত্তৰ-পূবৰ নিৰ্ভীক আৰু নিৰপেক্ষ সংবাদ মাধ্যম ND30 LIVE লৈ স্বাগতম! Welcome to ND30 LIVE Digital Portal.';
  const msgHi = n.message_hi || 'पूर्वोत्तर के निर्भीक और निष्पक्ष समाचार माध्यम ND30 LIVE में आपका स्वागत है! ताज़ा समाचारों के लिए जुड़े रहें।';
  const msgEn = n.message_en || "Welcome to ND30 LIVE - Northeast India's Bold & Unbiased Digital News Portal. Stay tuned for live updates.";

  const content = `
  <div class="admin-notice-studio">
    <!-- Top Action Bar -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--admin-border);">
      <div>
        <h1 style="font-size:1.6rem; font-weight:800; color:#ffffff; margin:0 0 6px 0; display:flex; align-items:center; gap:10px;">
          <span>🔔</span> Frontend Notice Section Studio
        </h1>
        <p style="color:var(--admin-muted); margin:0; font-size:0.9rem;">
          Matches the Breaking News ticker design. Supports multilingual text across Assamese, Hindi, and English with 1-click neural AI translation.
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

    <!-- REAL-TIME INTERACTIVE LIVE PREVIEW (MATCHES BREAKING NEWS TICKER EXACTLY) -->
    <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:20px; margin-bottom:28px; box-shadow:0 4px 16px rgba(0,0,0,0.3);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
        <span style="font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--admin-muted); display:flex; align-items:center; gap:8px;">
          <span>👁️</span> Real-Time Live Preview (Matches Breaking News Ticker Design)
        </span>
        
        <!-- Language Switcher for Preview -->
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:0.75rem; color:var(--admin-muted); font-weight:600;">Preview Language:</span>
          <button type="button" onclick="switchPreviewLang('as')" id="prevBtnAs" class="prev-lang-btn active" style="padding:4px 10px; border-radius:6px; font-size:0.78rem; font-weight:700; border:1px solid #10b981; background:rgba(16,185,129,0.2); color:#10b981; cursor:pointer;">
            অসমীয়া (AS)
          </button>
          <button type="button" onclick="switchPreviewLang('hi')" id="prevBtnHi" class="prev-lang-btn" style="padding:4px 10px; border-radius:6px; font-size:0.78rem; font-weight:700; border:1px solid var(--admin-border); background:rgba(255,255,255,0.06); color:var(--admin-muted); cursor:pointer;">
            हिंदी (HI)
          </button>
          <button type="button" onclick="switchPreviewLang('en')" id="prevBtnEn" class="prev-lang-btn" style="padding:4px 10px; border-radius:6px; font-size:0.78rem; font-weight:700; border:1px solid var(--admin-border); background:rgba(255,255,255,0.06); color:var(--admin-muted); cursor:pointer;">
            English (EN)
          </button>
        </div>
      </div>

      <!-- Preview Canvas: Full Width Ticker Shape (Matches Breaking News Section) -->
      <div id="previewTickerBar" style="background:var(--admin-input-bg); border:1px solid var(--admin-border); border-radius:8px; display:flex; align-items:stretch; overflow:hidden; min-height:44px; box-shadow:0 4px 14px rgba(0,0,0,0.35);">
        <!-- Ticker Label (Left Solid Block) -->
        <div id="previewTickerLabel" style="background:#be123c; color:#ffffff; padding:10px 18px; font-weight:800; font-size:0.85rem; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:8px; white-space:nowrap; box-shadow:2px 0 10px rgba(0,0,0,0.3); flex-shrink:0;">
          <span style="width:6px; height:6px; background:#fff; border-radius:50%; display:inline-block; animation:nd30Pulse 1.5s infinite;"></span>
          <span id="previewLabelText">জাননী</span>
        </div>

        <!-- Ticker Marquee Content -->
        <div style="flex:1; overflow:hidden; display:flex; align-items:center; padding:0 16px;">
          <div id="previewMarqueeTrack" style="display:flex; gap:40px; white-space:nowrap; animation:noticeMarqueeScroll 32s linear infinite;">
            <span style="display:inline-flex; align-items:center; gap:12px; font-size:0.90rem; font-weight:500; color:#f1f5f9;">
              <span id="previewMsgText1">${escapeHtml(msgAs)}</span>
              <span style="color:#eab308; font-size:0.85rem;">✦</span>
            </span>
            <span style="display:inline-flex; align-items:center; gap:12px; font-size:0.90rem; font-weight:500; color:#f1f5f9;">
              <span id="previewMsgText2">${escapeHtml(msgAs)}</span>
              <span style="color:#eab308; font-size:0.85rem;">✦</span>
            </span>
            <span style="display:inline-flex; align-items:center; gap:12px; font-size:0.90rem; font-weight:500; color:#f1f5f9;">
              <span id="previewMsgText3">${escapeHtml(msgAs)}</span>
              <span style="color:#eab308; font-size:0.85rem;">✦</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN CONFIGURATION FORM -->
    <form action="/admin/notice/save" method="POST" enctype="multipart/form-data" id="noticeForm">
      <input type="hidden" name="id" value="${n.id}">
      <input type="hidden" name="is_active" id="isActiveInput" value="${n.is_active}">
      <input type="hidden" name="message" id="inputMessage" value="${escapeHtml(msgAs)}">
      <input type="hidden" name="image_url" value="">
      <input type="hidden" name="badge_text" value="জাননী / NOTICE">
      <input type="hidden" name="badge_bg" value="#be123c">
      <input type="hidden" name="badge_color" value="#ffffff">
      <input type="hidden" name="show_close_button" value="0">
      <input type="hidden" name="animation_type" value="marquee">

      <div class="admin-notice-grid" style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:24px; margin-bottom:28px;">
        <!-- Column 1: 3-Language Notice Text & Translation Hub -->
        <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:22px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:10px;">
            <h2 style="font-size:1.15rem; font-weight:700; color:#ffffff; margin:0; display:flex; align-items:center; gap:8px;">
              <span>🌐</span> 1. Multilingual Notice Text (3 Languages)
            </h2>
            
            <!-- Auto Translate Button -->
            <button type="button" onclick="autoTranslateNotice()" id="autoTransBtn" class="btn" style="background:linear-gradient(135deg, #2563eb, #3b82f6); color:#ffffff; font-weight:700; padding:7px 16px; border-radius:8px; border:none; cursor:pointer; font-size:0.82rem; display:flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(37,99,235,0.35);">
              <span>⚡</span> Auto-Translate to All 3 Languages
            </button>
          </div>

          <div style="font-size:0.82rem; color:var(--admin-muted); margin-bottom:18px; line-height:1.5; background:rgba(255,255,255,0.03); padding:10px 14px; border-radius:8px; border:1px solid var(--admin-border);">
            💡 <strong>How Multilingual Notices Work:</strong> When readers switch language between Assamese (AS), Hindi (HI), and English (EN), the notice ticker automatically displays the respective language text below!
          </div>

          <!-- Assamese Notice Text -->
          <div style="margin-bottom:18px;">
            <label style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; font-weight:700; color:#10b981; margin-bottom:6px;">
              <span>🟢 1. Assamese (অসমীয়া জাননীৰ পাঠ্য) <span style="color:#ef4444;">*</span></span>
              <span style="font-size:0.72rem; color:var(--admin-muted); font-weight:500;">Shown on /as/ edition</span>
            </label>
            <textarea name="message_as" id="inputMessageAs" rows="3" required oninput="handleTextChange('as')" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:8px; padding:10px 14px; font-size:0.95rem; line-height:1.5; resize:vertical;" placeholder="অসমীয়া জাননীৰ পাঠ্য লিখক...">${escapeHtml(msgAs)}</textarea>
          </div>

          <!-- Hindi Notice Text -->
          <div style="margin-bottom:18px;">
            <label style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; font-weight:700; color:#f59e0b; margin-bottom:6px;">
              <span>🟠 2. Hindi (हिंदी सूचना का पाठ) <span style="color:#ef4444;">*</span></span>
              <span style="font-size:0.72rem; color:var(--admin-muted); font-weight:500;">Shown on /hi/ edition</span>
            </label>
            <textarea name="message_hi" id="inputMessageHi" rows="3" required oninput="handleTextChange('hi')" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:8px; padding:10px 14px; font-size:0.95rem; line-height:1.5; resize:vertical;" placeholder="हिंदी सूचना का पाठ लिखें...">${escapeHtml(msgHi)}</textarea>
          </div>

          <!-- English Notice Text -->
          <div style="margin-bottom:18px;">
            <label style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; font-weight:700; color:#38bdf8; margin-bottom:6px;">
              <span>🔵 3. English (English Notice Text) <span style="color:#ef4444;">*</span></span>
              <span style="font-size:0.72rem; color:var(--admin-muted); font-weight:500;">Shown on /en/ edition</span>
            </label>
            <textarea name="message_en" id="inputMessageEn" rows="3" required oninput="handleTextChange('en')" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:8px; padding:10px 14px; font-size:0.95rem; line-height:1.5; resize:vertical;" placeholder="Enter English notice text...">${escapeHtml(msgEn)}</textarea>
          </div>

          <!-- Target Link URL -->
          <div style="margin-top:14px; padding-top:14px; border-top:1px solid var(--admin-border);">
            <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--admin-text); margin-bottom:6px;">Target Link URL (ঐচ্ছিক লিংক - When Reader Clicks Notice)</label>
            <input type="text" name="link_url" id="inputLinkUrl" value="${escapeHtml(n.link_url)}" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:6px; padding:8px 12px; font-size:0.85rem;" placeholder="/as/ or /as/article/... or https://...">
            <div style="font-size:0.75rem; color:var(--admin-muted); margin-top:4px;">
              Tip: Using <code>/as/</code> or a relative path automatically adapts to the reader's active language (/as/, /hi/, /en/).
            </div>
          </div>
        </div>

        <!-- Column 2: Visual Styling & Settings -->
        <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:22px;">
          <h2 style="font-size:1.15rem; font-weight:700; color:#ffffff; margin:0 0 16px 0; display:flex; align-items:center; gap:8px;">
            <span>🎨</span> 2. Ticker Label & Style
          </h2>

          <!-- Background Theme Presets -->
          <div style="margin-bottom:16px;">
            <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--admin-text); margin-bottom:6px;">Label Accent Color</label>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
              <button type="button" onclick="selectTheme('crimson-alert', '#be123c')" class="theme-preset-btn ${n.bg_theme === 'crimson-alert' ? 'active' : ''}" style="background:#be123c; color:#fff; padding:8px 10px; border-radius:6px; font-size:0.8rem; font-weight:700; border:1px solid rgba(255,255,255,0.2); cursor:pointer;">
                🔴 Crimson
              </button>
              <button type="button" onclick="selectTheme('midnight-blue', '#1e3a8a')" class="theme-preset-btn ${n.bg_theme === 'midnight-blue' ? 'active' : ''}" style="background:#1e3a8a; color:#fff; padding:8px 10px; border-radius:6px; font-size:0.8rem; font-weight:700; border:1px solid rgba(255,255,255,0.2); cursor:pointer;">
                🔵 Navy
              </button>
              <button type="button" onclick="selectTheme('emerald-green', '#047857')" class="theme-preset-btn ${n.bg_theme === 'emerald-green' ? 'active' : ''}" style="background:#047857; color:#fff; padding:8px 10px; border-radius:6px; font-size:0.8rem; font-weight:700; border:1px solid rgba(255,255,255,0.2); cursor:pointer;">
                🟢 Emerald
              </button>
              <button type="button" onclick="selectTheme('royal-gold', '#b45309')" class="theme-preset-btn ${n.bg_theme === 'royal-gold' ? 'active' : ''}" style="background:#b45309; color:#fff; padding:8px 10px; border-radius:6px; font-size:0.8rem; font-weight:700; border:1px solid rgba(255,255,255,0.2); cursor:pointer;">
                🟡 Gold
              </button>
              <button type="button" onclick="selectTheme('deep-velvet', '#6d28d9')" class="theme-preset-btn ${n.bg_theme === 'deep-velvet' ? 'active' : ''}" style="background:#6d28d9; color:#fff; padding:8px 10px; border-radius:6px; font-size:0.8rem; font-weight:700; border:1px solid rgba(255,255,255,0.2); cursor:pointer;">
                🟣 Velvet
              </button>
              <button type="button" onclick="selectTheme('glass-slate', '#334155')" class="theme-preset-btn ${n.bg_theme === 'glass-slate' ? 'active' : ''}" style="background:#334155; color:#fff; padding:8px 10px; border-radius:6px; font-size:0.8rem; font-weight:700; border:1px solid rgba(255,255,255,0.2); cursor:pointer;">
                ⬛ Slate
              </button>
            </div>
            <input type="hidden" name="bg_theme" id="inputBgTheme" value="${n.bg_theme}">
          </div>

          <!-- Typography Details -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--admin-border); border-radius:8px; padding:14px; margin-top:20px;">
            <div style="font-weight:700; font-size:0.88rem; color:#ffffff; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
              <span>⚡</span> Breaking News Standard Sync
            </div>
            <p style="font-size:0.78rem; color:var(--admin-muted); margin:0; line-height:1.5;">
              The Notice Ticker automatically matches the exact line height, typography, pulse indicator, hover pause behavior, and responsive rules of the Breaking News Section above it.
            </p>
          </div>
        </div>
      </div>

      <!-- Submit Action Bar -->
      <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:18px 24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div style="font-size:0.85rem; color:var(--admin-muted);">
          All 3 language editions are deployed and updated live on the frontend immediately upon saving.
        </div>

        <div style="display:flex; gap:12px;">
          <button type="submit" class="btn btn-primary" style="background:#dc2626; color:#ffffff; font-weight:800; padding:10px 24px; border-radius:8px; border:none; cursor:pointer; font-size:0.95rem; box-shadow:0 4px 14px rgba(220,38,38,0.4); display:flex; align-items:center; gap:8px;">
            <span>💾</span> Save & Publish Live Notice Ticker
          </button>
        </div>
      </div>
    </form>
  </div>

  <style>
    .theme-preset-btn.active {
      outline: 2px solid #ffffff;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
    }
    @keyframes noticeMarqueeScroll {
      0% { transform: translateX(0%); }
      100% { transform: translateX(-50%); }
    }
    @keyframes nd30Pulse {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.4); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }
  </style>

  <script>
    var previewLang = 'as';
    var themeColors = {
      'crimson-alert': '#be123c',
      'midnight-blue': '#1e3a8a',
      'emerald-green': '#047857',
      'royal-gold': '#b45309',
      'deep-velvet': '#6d28d9',
      'glass-slate': '#334155'
    };

    var currentTheme = '${n.bg_theme || 'crimson-alert'}';

    function switchPreviewLang(lang) {
      previewLang = lang;
      document.querySelectorAll('.prev-lang-btn').forEach(function(b) {
        b.style.background = 'rgba(255,255,255,0.06)';
        b.style.color = 'var(--admin-muted)';
        b.style.borderColor = 'var(--admin-border)';
      });
      var activeBtn = document.getElementById('prevBtn' + lang.charAt(0).toUpperCase() + lang.slice(1));
      if (activeBtn) {
        var col = lang === 'as' ? '#10b981' : (lang === 'hi' ? '#f59e0b' : '#38bdf8');
        activeBtn.style.background = lang === 'as' ? 'rgba(16,185,129,0.2)' : (lang === 'hi' ? 'rgba(245,158,11,0.2)' : 'rgba(56,189,248,0.2)');
        activeBtn.style.color = col;
        activeBtn.style.borderColor = col;
      }
      updatePreviewDisplay();
    }

    function handleTextChange(lang) {
      var asText = document.getElementById('inputMessageAs').value;
      document.getElementById('inputMessage').value = asText || document.getElementById('inputMessageEn').value || '';
      updatePreviewDisplay();
    }

    function updatePreviewDisplay() {
      var msgAs = document.getElementById('inputMessageAs').value || '';
      var msgHi = document.getElementById('inputMessageHi').value || '';
      var msgEn = document.getElementById('inputMessageEn').value || '';

      var labelText = 'NOTICE';
      var activeMsg = msgEn;

      if (previewLang === 'as') {
        labelText = 'জাননী';
        activeMsg = msgAs || 'অসমীয়া জাননীৰ পাঠ্য লিখক...';
      } else if (previewLang === 'hi') {
        labelText = 'सूचना';
        activeMsg = msgHi || 'हिंदी सूचना का पाठ लिखें...';
      } else {
        labelText = 'NOTICE';
        activeMsg = msgEn || 'Enter English notice text...';
      }

      document.getElementById('previewLabelText').textContent = labelText;
      document.getElementById('previewMsgText1').textContent = activeMsg;
      document.getElementById('previewMsgText2').textContent = activeMsg;
      document.getElementById('previewMsgText3').textContent = activeMsg;

      var labelEl = document.getElementById('previewTickerLabel');
      if (labelEl) {
        labelEl.style.background = themeColors[currentTheme] || '#be123c';
      }
    }

    function selectTheme(themeKey, colorHex) {
      currentTheme = themeKey;
      document.getElementById('inputBgTheme').value = themeKey;
      document.querySelectorAll('.theme-preset-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      if (event && event.target) event.target.classList.add('active');
      updatePreviewDisplay();
    }

    // 1-Click Neural AI Auto-Translation
    async function autoTranslateNotice() {
      var asText = document.getElementById('inputMessageAs').value.trim();
      var enText = document.getElementById('inputMessageEn').value.trim();
      var hiText = document.getElementById('inputMessageHi').value.trim();

      var sourceText = asText || enText || hiText;
      var sourceLang = asText ? 'as' : (enText ? 'en' : 'hi');

      if (!sourceText) {
        alert('Please enter a notice message in at least one language first!');
        return;
      }

      var btn = document.getElementById('autoTransBtn');
      var originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Translating...';

      try {
        var res = await fetch('/admin/notice/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sourceText, sourceLang: sourceLang })
        });
        var data = await res.json();
        btn.disabled = false;
        btn.innerHTML = originalHtml;

        if (data.success && data.translations) {
          if (data.translations.as) document.getElementById('inputMessageAs').value = data.translations.as;
          if (data.translations.hi) document.getElementById('inputMessageHi').value = data.translations.hi;
          if (data.translations.en) document.getElementById('inputMessageEn').value = data.translations.en;
          document.getElementById('inputMessage').value = document.getElementById('inputMessageAs').value;
          updatePreviewDisplay();
        } else {
          alert('Translation error: ' + (data.error || 'Unable to translate.'));
        }
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        alert('Translation request failed: ' + err.message);
      }
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
        btn.textContent = currActive ? '⏸ Turn Notice OFF' : '▶ Turn Notice ON';
        alert('Toggle failed: ' + err.message);
      });
    }

    // Initialize display on load
    updatePreviewDisplay();
  </script>
  `;

  return renderAdminLayout({
    title: 'Frontend Notice Section Studio | ND30 Admin',
    content,
    currentUser,
    activeRoute: '/admin/notice'
  });
}

module.exports = {
  renderNoticeAdmin
};
