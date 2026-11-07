/**
 * ND30 LIVE - Admin Notice Panel Manager View
 * Interactive control studio for frontend notice banner:
 * - Live On/Off toggle switch
 * - 3-Language Multilingual text editing (Assamese, Hindi, English)
 * - 1-Click Neural AI Auto-Translation across all 3 languages
 * - Badge Text configuration for AS, HI, EN with 1-click presets
 * - Badge Style Selector (Broadcast Pill, Solid Block, Neon Radiant, Gradient Gem)
 * - Badge Animation Selector (Neon Blink, Pulse Glow, Radar Ping, Shimmer, Steady)
 * - Message Animation Selector (Marquee Ticker, Pulse Glow, Typewriter, Bounce Float, Shimmer)
 * - Color Theme Selector (Crimson Alert, Midnight Navy, Emerald Green, Royal Gold, Deep Velvet, Glass Slate)
 * - Real-Time Interactive Live Preview with 3-language switcher
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
    badge_text: '📢 বিশেষ জাননী',
    badge_text_as: '📢 বিশেষ জাননী',
    badge_text_hi: '📢 विशेष सूचना',
    badge_text_en: '📢 SPECIAL NOTICE',
    badge_style: 'broadcast-pill',
    badge_anim: 'neon-blink',
    badge_bg: '#be123c',
    badge_color: '#ffffff',
    animation_type: 'marquee',
    bg_theme: 'crimson-alert',
    custom_bg: '',
    text_color: '#ffffff',
    font_size: 'medium',
    font_weight: '600',
    is_active: 1,
    link_url: '/as/',
    link_text: 'পঢ়ক / Read More',
    show_close_button: 0
  };

  const isActive = n.is_active === 1;
  const msgAs = n.message_as || n.message || 'উত্তৰ-পূবৰ নিৰ্ভীক আৰু নিৰপেক্ষ সংবাদ মাধ্যম ND30 LIVE লৈ স্বাগতম! Welcome to ND30 LIVE Digital Portal.';
  const msgHi = n.message_hi || 'पूर्वोत्तर के निर्भीक और निष्पक्ष समाचार माध्यम ND30 LIVE में आपका स्वागत है! ताज़ा समाचारों के लिए जुड़े रहें।';
  const msgEn = n.message_en || "Welcome to ND30 LIVE - Northeast India's Bold & Unbiased Digital News Portal. Stay tuned for live updates.";

  const badgeAs = n.badge_text_as || '📢 বিশেষ জাননী';
  const badgeHi = n.badge_text_hi || '📢 विशेष सूचना';
  const badgeEn = n.badge_text_en || '📢 SPECIAL NOTICE';

  const badgeStyle = n.badge_style || 'broadcast-pill';
  const badgeAnim = n.badge_anim || 'neon-blink';
  const animType = n.animation_type || 'marquee';
  const bgTheme = n.bg_theme || 'crimson-alert';

  const content = `
  <div class="admin-notice-studio">
    <!-- Top Action Bar -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--admin-border);">
      <div>
        <h1 style="font-size:1.6rem; font-weight:800; color:#ffffff; margin:0 0 6px 0; display:flex; align-items:center; gap:10px;">
          <span>🔔</span> Notice Section Studio & Customizer
        </h1>
        <p style="color:var(--admin-muted); margin:0; font-size:0.9rem;">
          Customize notice text, badge text, styling, badge animations, message animations, and themes in real-time.
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
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
        <span style="font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--admin-muted); display:flex; align-items:center; gap:8px;">
          <span>👁️</span> Real-Time Live Preview (Updates Instantly with Style & Animation)
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

      <!-- Preview Canvas: Full Width Container Shape -->
      <div id="previewCard" style="background:linear-gradient(135deg, #881337 0%, #be123c 50%, #9f1239 100%); color:#ffffff; border-radius:8px; border:1px solid rgba(255,255,255,0.18); display:flex; align-items:center; overflow:hidden; min-height:48px; box-shadow:0 4px 16px rgba(0,0,0,0.35);">
        <!-- Badge Element -->
        <div id="previewBadgeContainer" class="notice-badge-broadcast-pill">
          <span class="nd30-pulse-dot" style="width:7px; height:7px; background:#fff; border-radius:50%; display:inline-block;"></span>
          <span id="previewBadgeText" class="badge-anim-neon-blink" style="font-weight:800; font-size:0.84rem; letter-spacing:0.5px;">${escapeHtml(badgeAs)}</span>
        </div>

        <!-- Marquee / Animated Content -->
        <div style="flex:1; overflow:hidden; display:flex; align-items:center; padding:0 16px;">
          <div id="previewMarqueeTrack" style="display:flex; gap:40px; white-space:nowrap; animation:noticeMarqueeScroll 32s linear infinite;">
            <span style="display:inline-flex; align-items:center; gap:12px; font-size:0.95rem; font-weight:600; color:#ffffff;">
              <span id="previewMsgText1">${escapeHtml(msgAs)}</span>
              <span style="color:#eab308; font-size:0.85rem;">✦</span>
            </span>
            <span style="display:inline-flex; align-items:center; gap:12px; font-size:0.95rem; font-weight:600; color:#ffffff;">
              <span id="previewMsgText2">${escapeHtml(msgAs)}</span>
              <span style="color:#eab308; font-size:0.85rem;">✦</span>
            </span>
            <span style="display:inline-flex; align-items:center; gap:12px; font-size:0.95rem; font-weight:600; color:#ffffff;">
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
      <input type="hidden" name="badge_text" id="inputBadgeTextMain" value="${escapeHtml(badgeAs)}">
      <input type="hidden" name="badge_style" id="inputBadgeStyle" value="${badgeStyle}">
      <input type="hidden" name="badge_anim" id="inputBadgeAnim" value="${badgeAnim}">
      <input type="hidden" name="animation_type" id="inputAnimType" value="${animType}">
      <input type="hidden" name="bg_theme" id="inputBgTheme" value="${bgTheme}">
      <input type="hidden" name="badge_bg" id="inputBadgeBg" value="${n.badge_bg || '#be123c'}">
      <input type="hidden" name="text_color" value="${n.text_color || '#ffffff'}">
      <input type="hidden" name="show_close_button" value="0">

      <div class="admin-notice-grid" style="display:grid; grid-template-columns:1.15fr 0.85fr; gap:24px; margin-bottom:28px;">
        <!-- Column 1: Notice Text & Badge Text -->
        <div style="display:flex; flex-direction:column; gap:24px;">
          <!-- Card 1: 3-Language Notice Text -->
          <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:22px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
              <h2 style="font-size:1.1rem; font-weight:700; color:#ffffff; margin:0; display:flex; align-items:center; gap:8px;">
                <span>📝</span> 1. Multilingual Notice Message (3 Languages)
              </h2>
              
              <!-- Auto Translate Button -->
              <button type="button" onclick="autoTranslateNotice()" id="autoTransBtn" class="btn" style="background:linear-gradient(135deg, #2563eb, #3b82f6); color:#ffffff; font-weight:700; padding:6px 14px; border-radius:8px; border:none; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(37,99,235,0.35);">
                <span>⚡</span> Auto-Translate Messages
              </button>
            </div>

            <!-- Assamese Notice Text -->
            <div style="margin-bottom:16px;">
              <label style="display:flex; justify-content:space-between; align-items:center; font-size:0.83rem; font-weight:700; color:#10b981; margin-bottom:6px;">
                <span>🟢 Assamese Message (অসমীয়া বাৰ্তা) <span style="color:#ef4444;">*</span></span>
                <span style="font-size:0.72rem; color:var(--admin-muted); font-weight:500;">Shown on /as/</span>
              </label>
              <textarea name="message_as" id="inputMessageAs" rows="2" required oninput="handleTextChange('as')" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:8px; padding:9px 12px; font-size:0.92rem; line-height:1.4; resize:vertical;">${escapeHtml(msgAs)}</textarea>
            </div>

            <!-- Hindi Notice Text -->
            <div style="margin-bottom:16px;">
              <label style="display:flex; justify-content:space-between; align-items:center; font-size:0.83rem; font-weight:700; color:#f59e0b; margin-bottom:6px;">
                <span>🟠 Hindi Message (हिंदी संदेश) <span style="color:#ef4444;">*</span></span>
                <span style="font-size:0.72rem; color:var(--admin-muted); font-weight:500;">Shown on /hi/</span>
              </label>
              <textarea name="message_hi" id="inputMessageHi" rows="2" required oninput="handleTextChange('hi')" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:8px; padding:9px 12px; font-size:0.92rem; line-height:1.4; resize:vertical;">${escapeHtml(msgHi)}</textarea>
            </div>

            <!-- English Notice Text -->
            <div style="margin-bottom:16px;">
              <label style="display:flex; justify-content:space-between; align-items:center; font-size:0.83rem; font-weight:700; color:#38bdf8; margin-bottom:6px;">
                <span>🔵 English Message (English Notice) <span style="color:#ef4444;">*</span></span>
                <span style="font-size:0.72rem; color:var(--admin-muted); font-weight:500;">Shown on /en/</span>
              </label>
              <textarea name="message_en" id="inputMessageEn" rows="2" required oninput="handleTextChange('en')" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:8px; padding:9px 12px; font-size:0.92rem; line-height:1.4; resize:vertical;">${escapeHtml(msgEn)}</textarea>
            </div>

            <!-- Target Link URL -->
            <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--admin-border);">
              <label style="display:block; font-size:0.83rem; font-weight:700; color:var(--admin-text); margin-bottom:6px;">Target Link URL (ঐচ্ছিক লিংক - Destination)</label>
              <input type="text" name="link_url" id="inputLinkUrl" value="${escapeHtml(n.link_url)}" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:6px; padding:8px 12px; font-size:0.85rem;" placeholder="/as/ or /as/article/... or https://...">
            </div>
          </div>

          <!-- Card 2: Multilingual Badge / Tag Text -->
          <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:22px;">
            <h2 style="font-size:1.1rem; font-weight:700; color:#ffffff; margin:0 0 16px 0; display:flex; align-items:center; gap:8px;">
              <span>🏷️</span> 2. Badge Text (Left Tag on Notice Bar)
            </h2>

            <!-- Assamese Badge Text -->
            <div style="margin-bottom:16px;">
              <label style="display:block; font-size:0.82rem; font-weight:700; color:#10b981; margin-bottom:6px;">Assamese Badge Text (অসমীয়া টেগ)</label>
              <input type="text" name="badge_text_as" id="inputBadgeTextAs" value="${escapeHtml(badgeAs)}" oninput="handleBadgeChange('as')" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:6px; padding:8px 12px; font-size:0.88rem;">
              <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap;">
                <button type="button" onclick="setPresetBadge('as', '📢 বিশেষ জাননী')" class="preset-btn">📢 বিশেষ জাননী</button>
                <button type="button" onclick="setPresetBadge('as', '⚡ জাননী')" class="preset-btn">⚡ জাননী</button>
                <button type="button" onclick="setPresetBadge('as', '🚨 জৰুৰী জাননী')" class="preset-btn">🚨 জৰুৰী জাননী</button>
                <button type="button" onclick="setPresetBadge('as', '🔴 শেহতীয়া জাননী')" class="preset-btn">🔴 শেহতীয়া জাননী</button>
              </div>
            </div>

            <!-- Hindi Badge Text -->
            <div style="margin-bottom:16px;">
              <label style="display:block; font-size:0.82rem; font-weight:700; color:#f59e0b; margin-bottom:6px;">Hindi Badge Text (हिंदी टैग)</label>
              <input type="text" name="badge_text_hi" id="inputBadgeTextHi" value="${escapeHtml(badgeHi)}" oninput="handleBadgeChange('hi')" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:6px; padding:8px 12px; font-size:0.88rem;">
              <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap;">
                <button type="button" onclick="setPresetBadge('hi', '📢 विशेष सूचना')" class="preset-btn">📢 विशेष सूचना</button>
                <button type="button" onclick="setPresetBadge('hi', '⚡ सूचना')" class="preset-btn">⚡ सूचना</button>
                <button type="button" onclick="setPresetBadge('hi', '🚨 महत्वपूर्ण सूचना')" class="preset-btn">🚨 महत्वपूर्ण सूचना</button>
                <button type="button" onclick="setPresetBadge('hi', '🔴 लाइव सूचना')" class="preset-btn">🔴 लाइव सूचना</button>
              </div>
            </div>

            <!-- English Badge Text -->
            <div style="margin-bottom:8px;">
              <label style="display:block; font-size:0.82rem; font-weight:700; color:#38bdf8; margin-bottom:6px;">English Badge Text (English Tag)</label>
              <input type="text" name="badge_text_en" id="inputBadgeTextEn" value="${escapeHtml(badgeEn)}" oninput="handleBadgeChange('en')" style="width:100%; background:var(--admin-input-bg); color:#ffffff; border:1px solid var(--admin-border); border-radius:6px; padding:8px 12px; font-size:0.88rem;">
              <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap;">
                <button type="button" onclick="setPresetBadge('en', '📢 SPECIAL NOTICE')" class="preset-btn">📢 SPECIAL NOTICE</button>
                <button type="button" onclick="setPresetBadge('en', '⚡ NOTICE')" class="preset-btn">⚡ NOTICE</button>
                <button type="button" onclick="setPresetBadge('en', '🚨 URGENT ALERT')" class="preset-btn">🚨 URGENT ALERT</button>
                <button type="button" onclick="setPresetBadge('en', '🔴 LIVE NOTICE')" class="preset-btn">🔴 LIVE NOTICE</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 2: Style & Animation Customization -->
        <div style="display:flex; flex-direction:column; gap:24px;">
          <!-- Card 3: Badge Style Selector -->
          <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:22px;">
            <h2 style="font-size:1.1rem; font-weight:700; color:#ffffff; margin:0 0 14px 0; display:flex; align-items:center; gap:8px;">
              <span>💎</span> 3. Badge Style (Left Tag Shape)
            </h2>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <!-- Style 1: Broadcast Pill -->
              <div class="style-card ${badgeStyle === 'broadcast-pill' ? 'selected' : ''}" onclick="selectBadgeStyle('broadcast-pill')" id="cardStylePill">
                <div style="font-weight:700; font-size:0.88rem; color:#ffffff; display:flex; align-items:center; gap:6px;">
                  <span>💊</span> Broadcast Pill
                </div>
                <div style="font-size:0.73rem; color:var(--admin-muted); margin-top:3px;">
                  Modern dark HUD pill with rounded border & live dot.
                </div>
              </div>

              <!-- Style 2: Solid Block -->
              <div class="style-card ${badgeStyle === 'solid-block' ? 'selected' : ''}" onclick="selectBadgeStyle('solid-block')" id="cardStyleBlock">
                <div style="font-weight:700; font-size:0.88rem; color:#ffffff; display:flex; align-items:center; gap:6px;">
                  <span>🟥</span> Solid Block
                </div>
                <div style="font-size:0.73rem; color:var(--admin-muted); margin-top:3px;">
                  Flush left solid block matching Breaking News style.
                </div>
              </div>

              <!-- Style 3: Neon Radiant -->
              <div class="style-card ${badgeStyle === 'neon-glow' ? 'selected' : ''}" onclick="selectBadgeStyle('neon-glow')" id="cardStyleNeon">
                <div style="font-weight:700; font-size:0.88rem; color:#ffffff; display:flex; align-items:center; gap:6px;">
                  <span>⚡</span> Neon Radiant
                </div>
                <div style="font-size:0.73rem; color:var(--admin-muted); margin-top:3px;">
                  Futuristic neon glowing border with radiant aura.
                </div>
              </div>

              <!-- Style 4: Gradient Gem -->
              <div class="style-card ${badgeStyle === 'gradient-gem' ? 'selected' : ''}" onclick="selectBadgeStyle('gradient-gem')" id="cardStyleGem">
                <div style="font-weight:700; font-size:0.88rem; color:#ffffff; display:flex; align-items:center; gap:6px;">
                  <span>🌈</span> Gradient Gem
                </div>
                <div style="font-size:0.73rem; color:var(--admin-muted); margin-top:3px;">
                  Rich metallic ruby-to-crimson rounded gradient.
                </div>
              </div>
            </div>
          </div>

          <!-- Card 4: Badge Animation Selector -->
          <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:22px;">
            <h2 style="font-size:1.1rem; font-weight:700; color:#ffffff; margin:0 0 14px 0; display:flex; align-items:center; gap:8px;">
              <span>✨</span> 4. Badge Animation (Left Tag Motion)
            </h2>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <!-- Anim 1: Neon Blink -->
              <div class="anim-opt-card ${badgeAnim === 'neon-blink' ? 'selected' : ''}" onclick="selectBadgeAnim('neon-blink')" id="cardAnimBlink">
                <div style="font-weight:700; font-size:0.86rem; color:#ffffff;">👁️ Neon Blink</div>
                <div style="font-size:0.72rem; color:var(--admin-muted); margin-top:2px;">Eye-catching neon broadcast flash.</div>
              </div>

              <!-- Anim 2: Pulse Glow -->
              <div class="anim-opt-card ${badgeAnim === 'pulse-glow' ? 'selected' : ''}" onclick="selectBadgeAnim('pulse-glow')" id="cardAnimPulse">
                <div style="font-weight:700; font-size:0.86rem; color:#ffffff;">💡 Pulse & Glow</div>
                <div style="font-size:0.72rem; color:var(--admin-muted); margin-top:2px;">Rhythmic breathing scale & glow.</div>
              </div>

              <!-- Anim 3: Radar Ping -->
              <div class="anim-opt-card ${badgeAnim === 'radar-ping' ? 'selected' : ''}" onclick="selectBadgeAnim('radar-ping')" id="cardAnimRadar">
                <div style="font-weight:700; font-size:0.86rem; color:#ffffff;">📡 Radar Ping</div>
                <div style="font-size:0.72rem; color:var(--admin-muted); margin-top:2px;">Expanding radar ping ripple dot.</div>
              </div>

              <!-- Anim 4: Shimmer -->
              <div class="anim-opt-card ${badgeAnim === 'shimmer' ? 'selected' : ''}" onclick="selectBadgeAnim('shimmer')" id="cardAnimShimmer">
                <div style="font-weight:700; font-size:0.86rem; color:#ffffff;">✨ Light Shimmer</div>
                <div style="font-size:0.72rem; color:var(--admin-muted); margin-top:2px;">Golden metallic light sweep.</div>
              </div>

              <!-- Anim 5: Steady -->
              <div class="anim-opt-card ${badgeAnim === 'none' ? 'selected' : ''}" onclick="selectBadgeAnim('none')" id="cardAnimNone" style="grid-column: span 2;">
                <div style="font-weight:700; font-size:0.86rem; color:#ffffff;">⏸️ Steady / Static</div>
                <div style="font-size:0.72rem; color:var(--admin-muted); margin-top:2px;">Solid static display without active text motion.</div>
              </div>
            </div>
          </div>

          <!-- Card 5: Message Animation Selector -->
          <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:22px;">
            <h2 style="font-size:1.1rem; font-weight:700; color:#ffffff; margin:0 0 14px 0; display:flex; align-items:center; gap:8px;">
              <span>🏃</span> 5. Message Text Animation
            </h2>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div class="msg-anim-card ${animType === 'marquee' ? 'selected' : ''}" onclick="selectMsgAnim('marquee')" id="cardMsgMarquee">
                <div style="font-weight:700; font-size:0.86rem; color:#ffffff;">🏃 Marquee Ticker</div>
                <div style="font-size:0.72rem; color:var(--admin-muted); margin-top:2px;">Smooth horizontal continuous scroll.</div>
              </div>

              <div class="msg-anim-card ${animType === 'typewriter' ? 'selected' : ''}" onclick="selectMsgAnim('typewriter')" id="cardMsgTypewriter">
                <div style="font-weight:700; font-size:0.86rem; color:#ffffff;">⌨️ Typewriter</div>
                <div style="font-size:0.72rem; color:var(--admin-muted); margin-top:2px;">Dynamic live typing with cursor.</div>
              </div>

              <div class="msg-anim-card ${animType === 'pulse-glow' ? 'selected' : ''}" onclick="selectMsgAnim('pulse-glow')" id="cardMsgPulse">
                <div style="font-weight:700; font-size:0.86rem; color:#ffffff;">💡 Pulse & Glow</div>
                <div style="font-size:0.72rem; color:var(--admin-muted); margin-top:2px;">Neon breathing pulse on message.</div>
              </div>

              <div class="msg-anim-card ${animType === 'shimmer-shine' ? 'selected' : ''}" onclick="selectMsgAnim('shimmer-shine')" id="cardMsgShimmer">
                <div style="font-weight:700; font-size:0.86rem; color:#ffffff;">✨ Shimmer Sweep</div>
                <div style="font-size:0.72rem; color:var(--admin-muted); margin-top:2px;">Gliding light beam across text.</div>
              </div>
            </div>
          </div>

          <!-- Card 6: Color Theme Presets -->
          <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:22px;">
            <h2 style="font-size:1.1rem; font-weight:700; color:#ffffff; margin:0 0 14px 0; display:flex; align-items:center; gap:8px;">
              <span>🎨</span> 6. Banner Color Theme
            </h2>

            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
              <button type="button" onclick="selectTheme('crimson-alert')" class="theme-btn ${bgTheme === 'crimson-alert' ? 'active' : ''}" style="background:linear-gradient(135deg, #881337, #be123c);">
                🔴 Crimson
              </button>
              <button type="button" onclick="selectTheme('midnight-blue')" class="theme-btn ${bgTheme === 'midnight-blue' ? 'active' : ''}" style="background:linear-gradient(135deg, #0f172a, #1e3a8a);">
                🔵 Navy
              </button>
              <button type="button" onclick="selectTheme('emerald-green')" class="theme-btn ${bgTheme === 'emerald-green' ? 'active' : ''}" style="background:linear-gradient(135deg, #064e3b, #047857);">
                🟢 Emerald
              </button>
              <button type="button" onclick="selectTheme('royal-gold')" class="theme-btn ${bgTheme === 'royal-gold' ? 'active' : ''}" style="background:linear-gradient(135deg, #78350f, #b45309);">
                🟡 Gold
              </button>
              <button type="button" onclick="selectTheme('deep-velvet')" class="theme-btn ${bgTheme === 'deep-velvet' ? 'active' : ''}" style="background:linear-gradient(135deg, #4c1d95, #6d28d9);">
                🟣 Velvet
              </button>
              <button type="button" onclick="selectTheme('glass-slate')" class="theme-btn ${bgTheme === 'glass-slate' ? 'active' : ''}" style="background:linear-gradient(135deg, #1e293b, #0f172a);">
                ⬛ Slate
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit Action Bar -->
      <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); border-radius:12px; padding:18px 24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div style="font-size:0.85rem; color:var(--admin-muted);">
          All settings, styles, animations, and 3-language translations deploy immediately upon saving.
        </div>

        <div style="display:flex; gap:12px;">
          <button type="submit" class="btn btn-primary" style="background:#dc2626; color:#ffffff; font-weight:800; padding:10px 24px; border-radius:8px; border:none; cursor:pointer; font-size:0.95rem; box-shadow:0 4px 14px rgba(220,38,38,0.4); display:flex; align-items:center; gap:8px;">
            <span>💾</span> Save & Publish Notice Changes
          </button>
        </div>
      </div>
    </form>
  </div>

  <style>
    .preset-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--admin-border);
      color: var(--admin-muted);
      font-size: 0.72rem;
      padding: 3px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .preset-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.3);
    }
    .style-card, .anim-opt-card, .msg-anim-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--admin-border);
      border-radius: 8px;
      padding: 10px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .style-card:hover, .anim-opt-card:hover, .msg-anim-card:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
    .style-card.selected, .anim-opt-card.selected, .msg-anim-card.selected {
      background: rgba(220, 38, 38, 0.18);
      border-color: #dc2626;
      box-shadow: 0 0 12px rgba(220, 38, 38, 0.35);
    }
    .theme-btn {
      color: #fff;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      border: 1px solid rgba(255,255,255,0.2);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .theme-btn.active {
      outline: 2px solid #ffffff;
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.5);
    }

    /* Live Preview Badges */
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
      flex-shrink: 0;
    }
    .notice-badge-solid-block {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 18px;
      background: #be123c;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.85rem;
      white-space: nowrap;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
      flex-shrink: 0;
    }
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
      box-shadow: 0 0 14px rgba(244, 63, 94, 0.7);
      flex-shrink: 0;
    }
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
      box-shadow: 0 3px 12px rgba(225, 29, 72, 0.45);
      flex-shrink: 0;
    }

    /* Badge Animations */
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
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(255,255,255,0.5)); }
      50% { transform: scale(1.05); filter: drop-shadow(0 0 12px rgba(255,225,50,0.85)); }
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
    @keyframes nd30NoticeShimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    @keyframes noticeMarqueeScroll {
      0% { transform: translateX(0%); }
      100% { transform: translateX(-50%); }
    }
  </style>

  <script>
    var previewLang = 'as';
    var themes = {
      'crimson-alert': 'linear-gradient(135deg, #881337 0%, #be123c 50%, #9f1239 100%)',
      'midnight-blue': 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #172554 100%)',
      'emerald-green': 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #065f46 100%)',
      'royal-gold': 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #92400e 100%)',
      'deep-velvet': 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #5b21b6 100%)',
      'glass-slate': 'linear-gradient(135deg, rgba(30,41,59,0.96) 0%, rgba(15,23,42,0.98) 100%)'
    };

    var currentStyle = '${badgeStyle}';
    var currentBadgeAnim = '${badgeAnim}';
    var currentMsgAnim = '${animType}';
    var currentTheme = '${bgTheme}';

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

    function handleBadgeChange(lang) {
      var asBadge = document.getElementById('inputBadgeTextAs').value;
      document.getElementById('inputBadgeTextMain').value = asBadge || document.getElementById('inputBadgeTextEn').value || '';
      updatePreviewDisplay();
    }

    function setPresetBadge(lang, text) {
      if (lang === 'as') document.getElementById('inputBadgeTextAs').value = text;
      if (lang === 'hi') document.getElementById('inputBadgeTextHi').value = text;
      if (lang === 'en') document.getElementById('inputBadgeTextEn').value = text;
      handleBadgeChange(lang);
    }

    function selectBadgeStyle(styleKey) {
      currentStyle = styleKey;
      document.getElementById('inputBadgeStyle').value = styleKey;
      document.querySelectorAll('.style-card').forEach(function(c) { c.classList.remove('selected'); });
      var map = { 'broadcast-pill': 'cardStylePill', 'solid-block': 'cardStyleBlock', 'neon-glow': 'cardStyleNeon', 'gradient-gem': 'cardStyleGem' };
      var el = document.getElementById(map[styleKey]);
      if (el) el.classList.add('selected');
      updatePreviewDisplay();
    }

    function selectBadgeAnim(animKey) {
      currentBadgeAnim = animKey;
      document.getElementById('inputBadgeAnim').value = animKey;
      document.querySelectorAll('.anim-opt-card').forEach(function(c) { c.classList.remove('selected'); });
      var map = { 'neon-blink': 'cardAnimBlink', 'pulse-glow': 'cardAnimPulse', 'radar-ping': 'cardAnimRadar', 'shimmer': 'cardAnimShimmer', 'none': 'cardAnimNone' };
      var el = document.getElementById(map[animKey]);
      if (el) el.classList.add('selected');
      updatePreviewDisplay();
    }

    function selectMsgAnim(animKey) {
      currentMsgAnim = animKey;
      document.getElementById('inputAnimType').value = animKey;
      document.querySelectorAll('.msg-anim-card').forEach(function(c) { c.classList.remove('selected'); });
      var map = { 'marquee': 'cardMsgMarquee', 'typewriter': 'cardMsgTypewriter', 'pulse-glow': 'cardMsgPulse', 'shimmer-shine': 'cardMsgShimmer' };
      var el = document.getElementById(map[animKey]);
      if (el) el.classList.add('selected');
      updatePreviewDisplay();
    }

    function selectTheme(themeKey) {
      currentTheme = themeKey;
      document.getElementById('inputBgTheme').value = themeKey;
      document.querySelectorAll('.theme-btn').forEach(function(b) { b.classList.remove('active'); });
      if (event && event.target) event.target.classList.add('active');
      updatePreviewDisplay();
    }

    function updatePreviewDisplay() {
      var msgAs = document.getElementById('inputMessageAs').value || '';
      var msgHi = document.getElementById('inputMessageHi').value || '';
      var msgEn = document.getElementById('inputMessageEn').value || '';

      var badgeAs = document.getElementById('inputBadgeTextAs').value || '📢 বিশেষ জাননী';
      var badgeHi = document.getElementById('inputBadgeTextHi').value || '📢 विशेष सूचना';
      var badgeEn = document.getElementById('inputBadgeTextEn').value || '📢 SPECIAL NOTICE';

      var labelText = badgeAs;
      var activeMsg = msgAs;

      if (previewLang === 'as') {
        labelText = badgeAs;
        activeMsg = msgAs || 'অসমীয়া জাননীৰ পাঠ্য লিখক...';
      } else if (previewLang === 'hi') {
        labelText = badgeHi;
        activeMsg = msgHi || 'हिंदी सूचना का पाठ लिखें...';
      } else {
        labelText = badgeEn;
        activeMsg = msgEn || 'Enter English notice text...';
      }

      // Update Card Background Theme
      document.getElementById('previewCard').style.background = themes[currentTheme] || themes['crimson-alert'];

      // Update Badge Container Class & Text
      var badgeContainer = document.getElementById('previewBadgeContainer');
      badgeContainer.className = 'notice-badge-' + currentStyle;

      var badgeTextEl = document.getElementById('previewBadgeText');
      badgeTextEl.textContent = labelText;
      badgeTextEl.className = currentBadgeAnim !== 'none' ? 'badge-anim-' + currentBadgeAnim : '';

      // Update Marquee Messages
      document.getElementById('previewMsgText1').textContent = activeMsg;
      document.getElementById('previewMsgText2').textContent = activeMsg;
      document.getElementById('previewMsgText3').textContent = activeMsg;
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
    title: 'Frontend Notice Customizer | ND30 Admin',
    content,
    currentUser,
    activeRoute: '/admin/notice'
  });
}

module.exports = {
  renderNoticeAdmin
};
