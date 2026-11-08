/**
 * ND30 LIVE - Public Press ID Verification Page
 * Displayed when anyone scans the QR code on a reporter's Press Card
 * or visits /verify-press-id/:pressIdCode
 */

const { renderLayout } = require('./layout');
const { renderPressCardFrontHtml, renderPressCardBackHtml, renderPressCardHtml } = require('../services/pressCardService');

function renderVerifyPressIdPage(app, pressIdCode) {
  const isValid = !!app && app.status === 'approved';

  if (!isValid) {
    const content = `
    <div class="container" style="padding:60px 20px; max-width:680px; margin:0 auto; text-align:center;">
      <div style="font-size:3.5rem; margin-bottom:12px;">⚠️</div>
      <h1 style="color:#ef4444; font-size:1.8rem; font-weight:800; margin-bottom:12px;">
        Unverified or Inactive Press Credential
      </h1>
      <div style="background:#1e1b2e; border:1px solid #7f1d1d; border-radius:12px; padding:24px; margin-bottom:24px; text-align:left;">
        <p style="color:#fecaca; font-size:0.95rem; line-height:1.6; margin:0 0 12px 0;">
          The Press ID Number <code>${escapeHtml(pressIdCode)}</code> is <strong>NOT verified</strong> or has not been accredited in the official <strong>ND30 LIVE</strong> reporter registry.
        </p>
        <p style="color:#94a3b8; font-size:0.85rem; line-height:1.6; margin:0;">
          If an individual is presenting this credential representing ND30 LIVE, please alert the central newsroom desk immediately at <a href="mailto:nd30team@gmail.com" style="color:#38bdf8; font-weight:600;">nd30team@gmail.com</a>.
        </p>
      </div>
      <a href="/as/" class="btn btn-primary">Return to ND30 LIVE Home</a>
    </div>
    `;

    return renderLayout({
      title: 'Unverified Press Card | ND30 LIVE Verification',
      description: 'Official digital Press ID verification portal for ND30 LIVE.',
      lang: 'en',
      content
    });
  }

  // Valid Credential
  const issueDateFormatted = app.press_id_issued_at ? new Date(app.press_id_issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Active';
  const expiryDateFormatted = app.press_id_expires_at ? new Date(app.press_id_expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '1 Year from Issue';

  const displayCode = app.press_id_code 
    ? (app.press_id_code.includes('-') ? `ND30${String(app.id).padStart(3, '0')}` : app.press_id_code)
    : `ND30${String(app.id || 1).padStart(3, '0')}`;

  let areaDisplay = 'Dhubri, Assam';
  if (app.area) {
    if (app.district && !app.area.toLowerCase().includes(app.district.toLowerCase())) {
      areaDisplay = `${app.area}, ${app.district}`;
    } else {
      areaDisplay = `${app.area}, ${app.state || 'Assam'}`;
    }
  } else if (app.district) {
    areaDisplay = `${app.district}, ${app.state || 'Assam'}`;
  }

  const photoUrl = app.photo_file 
    ? (app.photo_file.startsWith('http') ? app.photo_file : app.photo_file) 
    : '/images/default_reporter_avatar.png';

  const qrSrc = app.press_id_qr 
    ? (app.press_id_qr.startsWith('http') ? app.press_id_qr : app.press_id_qr)
    : '';

  const frontHtml = renderPressCardFrontHtml(app);
  const backHtml = renderPressCardBackHtml(app);

  const content = `
  <style>
    @media print {
      body * {
        visibility: hidden !important;
      }
      .nd30-printable-card-area, .nd30-printable-card-area * {
        visibility: visible !important;
      }
      .nd30-printable-card-area {
        position: fixed !important;
        left: 50% !important;
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 100% !important;
        max-width: 820px !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        background: transparent !important;
      }
      .no-print, header, footer, nav, .site-header, .site-footer {
        display: none !important;
      }
      .nd30-view-container {
        display: flex !important;
        flex-direction: row !important;
        gap: 20px !important;
      }
    }

    .id-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      padding: 10px 18px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.88rem;
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid transparent;
      user-select: none;
    }
    .id-action-btn:hover {
      transform: translateY(-2px);
    }

    .view-tab-btn {
      padding: 8px 16px;
      font-size: 0.84rem;
      font-weight: 700;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.04);
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .view-tab-btn.active {
      background: #dc2626;
      color: #ffffff;
      border-color: #ef4444;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
    }
  </style>

  <div class="container" style="padding:36px 16px; max-width:920px; margin:0 auto;">
    <!-- Live Verification Shield Banner -->
    <div class="no-print" style="background:linear-gradient(135deg, rgba(22, 101, 52, 0.25), rgba(21, 128, 61, 0.15)); border:2px solid #22c55e; border-radius:14px; padding:18px 22px; margin-bottom:26px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; box-shadow:0 8px 24px rgba(34, 197, 94, 0.15);">
      <div style="display:flex; align-items:center; gap:14px;">
        <span style="display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; background:#22c55e; color:#fff; border-radius:50%; font-size:1.6rem; box-shadow:0 4px 12px rgba(34, 197, 94, 0.4);">
          ✓
        </span>
        <div>
          <span style="font-size:0.72rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#86efac; display:block;">
            OFFICIAL DIGITAL VERIFICATION
          </span>
          <h2 style="margin:2px 0 0 0; font-size:1.25rem; font-weight:800; color:#ffffff;">
            Genuine & Verified ND30 LIVE Press Credential
          </h2>
          <span style="font-size:0.8rem; color:#cbd5e1; margin-top:2px; display:block;">
            Accredited Field Correspondent • Status: <strong style="color:#22c55e;">● ACTIVE & VALID</strong>
          </span>
        </div>
      </div>
      <div style="text-align:right;">
        <span style="background:rgba(34, 197, 94, 0.2); border:1px solid #22c55e; color:#86efac; font-size:0.85rem; font-weight:900; padding:4px 12px; border-radius:6px; font-family:monospace; letter-spacing:0.8px;">
          ${escapeHtml(displayCode)}
        </span>
        <div style="font-size:0.7rem; color:#94a3b8; margin-top:4px;">
          Scanned: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
        </div>
      </div>
    </div>

    <!-- View Mode Switcher -->
    <div class="no-print" style="display:flex; justify-content:center; gap:8px; margin-bottom:20px; flex-wrap:wrap;">
      <button type="button" class="view-tab-btn active" id="tabFlip" onclick="switchView('flip')">
        🎴 3D Flip Card
      </button>
      <button type="button" class="view-tab-btn" id="tabDual" onclick="switchView('dual')">
        📑 Side-by-Side (Both Sides)
      </button>
      <button type="button" class="view-tab-btn" id="tabFront" onclick="switchView('front')">
        🪪 Front Side
      </button>
      <button type="button" class="view-tab-btn" id="tabBack" onclick="switchView('back')">
        🔄 Back Side
      </button>
    </div>

    <!-- Official Press ID Card Display Zone -->
    <div class="nd30-printable-card-area" style="margin-bottom:28px;">
      
      <!-- MODE 1: Interactive 3D Flip Card (Default) -->
      <div id="viewFlip" class="nd30-view-container" style="display:block; width:100%; max-width:440px; margin:0 auto; perspective:1200px;">
        <div id="nd30CardFlipperPage" style="
          position: relative;
          width: 100%;
          transform-style: preserve-3d;
          transition: transform 0.65s cubic-bezier(0.4, 0.2, 0.2, 1);
          cursor: pointer;
        " onclick="togglePageCardFlip()" title="Click to Flip Card">
          <!-- Front Face -->
          <div style="width:100%; backface-visibility:hidden; -webkit-backface-visibility:hidden; container-type:inline-size;">
            ${frontHtml}
          </div>
          <!-- Back Face -->
          <div style="position:absolute; top:0; left:0; width:100%; height:100%; backface-visibility:hidden; -webkit-backface-visibility:hidden; transform:rotateY(180deg); container-type:inline-size;">
            ${backHtml}
          </div>
        </div>

        <div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-top:14px;" class="no-print">
          <button type="button" onclick="togglePageCardFlip()" style="
            background:rgba(220, 38, 38, 0.15);
            border:1px solid #dc2626;
            color:#f87171;
            font-weight:700;
            font-size:0.84rem;
            padding:7px 18px;
            border-radius:20px;
            cursor:pointer;
            display:inline-flex;
            align-items:center;
            gap:6px;
          ">
            <span>🔄</span> <span id="flipHintLabel">Click Card to Flip between Front & Back</span>
          </button>
        </div>
      </div>

      <!-- MODE 2: Side-by-Side Dual View -->
      <div id="viewDual" class="nd30-view-container" style="display:none; width:100%; max-width:920px; margin:0 auto;">
        <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:26px;">
          <div style="flex:1; min-width:320px; max-width:440px; container-type:inline-size;">
            <div class="no-print" style="font-size:0.82rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; text-align:center; margin-bottom:8px;">
              🪪 Front Side
            </div>
            ${frontHtml}
          </div>
          <div style="flex:1; min-width:320px; max-width:440px; container-type:inline-size;">
            <div class="no-print" style="font-size:0.82rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; text-align:center; margin-bottom:8px;">
              🔄 Back Side
            </div>
            ${backHtml}
          </div>
        </div>
      </div>

      <!-- MODE 3: Front Only -->
      <div id="viewFront" class="nd30-view-container" style="display:none; width:100%; max-width:440px; margin:0 auto; container-type:inline-size;">
        ${frontHtml}
      </div>

      <!-- MODE 4: Back Only -->
      <div id="viewBack" class="nd30-view-container" style="display:none; width:100%; max-width:440px; margin:0 auto; container-type:inline-size;">
        ${backHtml}
      </div>
    </div>

    <!-- High-Resolution Download & Action Buttons -->
    <div class="no-print" style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap; margin-bottom:34px;">
      <button type="button" id="btnDownloadFront" onclick="downloadHdPressCard('front')" class="id-action-btn" style="background:linear-gradient(135deg, #dc2626, #991b1b); color:#ffffff; box-shadow:0 4px 14px rgba(220, 38, 38, 0.4);">
        <span>📥</span> Download Front (HD PNG)
      </button>
      <button type="button" id="btnDownloadBack" onclick="downloadHdPressCard('back')" class="id-action-btn" style="background:linear-gradient(135deg, #1e293b, #0f172a); color:#f8fafc; border:1px solid #334155; box-shadow:0 4px 12px rgba(0,0,0,0.3);">
        <span>📥</span> Download Back (HD PNG)
      </button>
      <button type="button" id="btnDownloadBoth" onclick="downloadHdPressCard('both')" class="id-action-btn" style="background:linear-gradient(135deg, #1e3a8a, #1d4ed8); color:#ffffff; box-shadow:0 4px 14px rgba(30, 58, 138, 0.4);">
        <span>📑</span> Download Complete Card (Both Sides)
      </button>
      <button type="button" onclick="window.print()" class="id-action-btn" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155;">
        <span>🖨️</span> Print Card
      </button>
      <a href="/as/" class="id-action-btn" style="background:#0f172a; color:#38bdf8; border:1px solid rgba(56, 189, 248, 0.3);">
        <span>🌐</span> ND30 Portal Home
      </a>
    </div>

    <!-- Detailed Identity & Police Verification Sheet -->
    <div class="no-print" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:14px; padding:24px 28px; margin-bottom:28px; box-shadow:0 4px 20px rgba(0,0,0,0.25);">
      <h3 style="font-size:1.15rem; font-weight:800; color:var(--text-main); border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:18px; display:flex; align-items:center; gap:8px;">
        <span>📋</span> Accreditation & Verification Record
      </h3>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:18px; font-size:0.92rem;">
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Full Name</span>
          <strong style="color:var(--text-main); font-size:1.05rem;">${escapeHtml(app.full_name)}</strong>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Father's Name</span>
          <span style="color:var(--text-main); font-weight:600;">${escapeHtml(app.father_name || 'N/A')}</span>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Designation / Role</span>
          <span style="display:inline-block; background:#dc2626; color:#fff; font-size:0.8rem; font-weight:800; padding:3px 12px; border-radius:14px; text-transform:uppercase; letter-spacing:0.6px; margin-top:2px;">
            ${escapeHtml(app.designation || app.join_as || 'Reporter')}
          </span>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Assigned Area & Territory</span>
          <strong style="color:#facc15; font-size:1rem;">📍 ${escapeHtml(areaDisplay)}</strong>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Official Press ID Code</span>
          <code style="color:#38bdf8; font-weight:900; font-size:1.05rem; letter-spacing:0.8px;">${escapeHtml(displayCode)}</code>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Verified Mobile Contact</span>
          <a href="tel:${escapeHtml(app.mobile_no)}" style="color:#22c55e; font-weight:700; text-decoration:none; font-size:1rem;">
            📞 ${escapeHtml(app.mobile_no)}
          </a>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Issue Date</span>
          <span style="color:var(--text-main); font-weight:600;">${issueDateFormatted}</span>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Accreditation Validity</span>
          <strong style="color:#22c55e;">Valid Until ${expiryDateFormatted}</strong>
        </div>

        <div style="grid-column: 1 / -1; border-top:1px solid var(--border-color); padding-top:14px; margin-top:4px;">
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Permanent Residential Address</span>
          <span style="color:var(--text-main); line-height:1.5;">
            Vill/Town: ${escapeHtml(app.village_town || 'N/A')}, PO: ${escapeHtml(app.post_office || 'N/A')}, PS: ${escapeHtml(app.police_station || 'N/A')}, District: ${escapeHtml(app.district)}, State: ${escapeHtml(app.state || 'Assam')} - PIN: ${escapeHtml(app.pin_code || 'N/A')}
          </span>
        </div>
      </div>
    </div>

    <!-- Official Press Privileges Notice for Police & Public Authorities -->
    <div class="no-print" style="background:#090d15; border:1px solid rgba(220, 38, 38, 0.35); border-radius:12px; padding:22px; font-size:0.88rem; color:#94a3b8; line-height:1.6; margin-bottom:28px;">
      <strong style="color:#f87171; display:flex; align-items:center; gap:6px; margin-bottom:8px; font-size:1rem;">
        <span>🏛️</span> Notice for Civil Administration, Police & Public Authorities:
      </strong>
      The accredited bearer of this credential, <strong>${escapeHtml(app.full_name)}</strong> (Press ID: <code>${escapeHtml(displayCode)}</code>), is an authorized and accredited news correspondent representing <strong>ND30 LIVE</strong>. All civil, judicial, and law enforcement authorities, public administration officials, and emergency personnel are respectfully requested to extend all customary courtesies and cooperation to allow unhindered journalistic coverage and news gathering.
      <br><br>
      For urgent institutional inquiries, live registry verification, or newsroom confirmation, please contact the Chief Editor's desk directly at <a href="mailto:nd30team@gmail.com" style="color:#38bdf8; font-weight:700;">nd30team@gmail.com</a>.
    </div>
  </div>

  <!-- Interactive View Switcher & Client-Side HD Canvas Generator -->
  <script>
    let pageFlipped = false;

    function togglePageCardFlip() {
      const flipper = document.getElementById('nd30CardFlipperPage');
      const label = document.getElementById('flipHintLabel');
      if (!flipper) return;
      pageFlipped = !pageFlipped;
      flipper.style.transform = pageFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
      if (label) {
        label.innerText = pageFlipped ? 'Showing Back Side (Click to Flip to Front)' : 'Showing Front Side (Click to Flip to Back)';
      }
    }

    function switchView(mode) {
      const views = ['Flip', 'Dual', 'Front', 'Back'];
      views.forEach(v => {
        const el = document.getElementById('view' + v);
        const tab = document.getElementById('tab' + v);
        if (el) el.style.display = (v.toLowerCase() === mode) ? 'block' : 'none';
        if (tab) {
          if (v.toLowerCase() === mode) {
            tab.classList.add('active');
          } else {
            tab.classList.remove('active');
          }
        }
      });
    }

    const loadImageHelper = (src) => new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

    /**
     * Render Front Side onto 663x1024 Canvas at Ultra-Crisp Quality
     */
    async function renderFrontCanvas(ctx, W, H) {
      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Repeating "ND30" Watermark Pattern
      ctx.save();
      ctx.font = '900 13px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.042)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let y = -40; y < H + 80; y += 46) {
        const xOffset = (Math.floor((y + 40) / 46) % 2 === 0) ? 0 : 40;
        for (let x = -40; x < W + 80; x += 80) {
          ctx.save();
          ctx.translate(x + xOffset, y);
          ctx.rotate(-22 * Math.PI / 180);
          ctx.fillText('ND30', 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();

      // Top Red Swoosh
      ctx.save();
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(320, 0);
      ctx.bezierCurveTo(420, 0, 520, 25, 580, 65);
      ctx.bezierCurveTo(625, 95, 645, 125, W, 150);
      ctx.lineTo(W, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.moveTo(420, 0);
      ctx.bezierCurveTo(490, 0, 560, 20, 600, 50);
      ctx.lineTo(W, 110);
      ctx.lineTo(W, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Top Title: PRESS ID CARD (Deep Slate Navy)
      ctx.save();
      ctx.font = '900 17px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PRESS ID CARD', W / 2, 22);
      ctx.restore();

      // Official Uploaded ND30 LIVE Logo (Tight crop, enlarged to fill marked box)
      const logoImg = await loadImageHelper('/images/nd30_live_logo_tight.png?v=1') || await loadImageHelper('/images/nd30_live_logo.png');
      if (logoImg) {
        ctx.drawImage(logoImg, (W - 350) / 2, 34, 350, 116);
      }

      // Slogan Ribbon (Decreased Compact Size)
      ctx.save();
      const rX = 70, rY = 152, rW = W - 140, rH = 24;
      const ribbonGrad = ctx.createLinearGradient(rX, 0, rX + rW, 0);
      ribbonGrad.addColorStop(0, '#1e3a8a');
      ribbonGrad.addColorStop(0.5, '#2563eb');
      ribbonGrad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = ribbonGrad;
      ctx.beginPath();
      ctx.roundRect(rX, rY, rW, rH, 4);
      ctx.fill();

      // Red end borders
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(rX, rY, 4, rH);
      ctx.fillRect(rX + rW - 4, rY, 4, rH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('//  উত্তৰ-পূবৰ কণ্ঠস্বৰ • নিৰ্ভীক আৰু নিৰপেক্ষ  //', W / 2, rY + (rH / 2));
      ctx.restore();

      // Left Vertical Curved Red PRESS Ribbon
      ctx.save();
      const prW = 100, prH = 560, prY = 176;
      const pressGrad = ctx.createLinearGradient(0, prY, 0, prY + prH);
      pressGrad.addColorStop(0, '#ef4444');
      pressGrad.addColorStop(0.5, '#dc2626');
      pressGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = pressGrad;
      ctx.beginPath();
      ctx.moveTo(0, prY);
      ctx.lineTo(prW - 30, prY);
      ctx.quadraticCurveTo(prW, prY + 50, prW, prY + 120);
      ctx.lineTo(prW, prY + prH - 60);
      ctx.quadraticCurveTo(prW, prY + prH, prW - 30, prY + prH);
      ctx.lineTo(0, prY + prH);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Letters P R E S S
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px "Arial Black", Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const letters = ['P', 'R', 'E', 'S', 'S'];
      letters.forEach((l, i) => {
        ctx.fillText(l, 46, prY + 65 + i * 95);
      });
      ctx.restore();

      // Passport Photo
      const px = 240, py = 186, pw = 280, ph = 310, pr = 16;
      ctx.save();
      ctx.fillStyle = '#2ca9ed';
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, pr);
      ctx.fill();
      ctx.clip();

      const photoImg = await loadImageHelper('${photoUrl}') || await loadImageHelper('/images/default_reporter_avatar.png');
      if (photoImg) {
        const sRatio = photoImg.width / photoImg.height;
        const dRatio = pw / ph;
        let sx = 0, sy = 0, sw = photoImg.width, sh = photoImg.height;
        if (sRatio > dRatio) {
          sw = photoImg.height * dRatio;
          sx = (photoImg.width - sw) / 2;
        } else {
          sh = photoImg.width / dRatio;
          sy = (photoImg.height - sh) / 2;
        }
        ctx.drawImage(photoImg, sx, sy, sw, sh, px, py, pw, ph);
      }
      ctx.restore();

      // Photo Frame Red Border
      ctx.save();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, pr);
      ctx.stroke();
      ctx.restore();

      // 5 Rows Details
      const labels = ['NAME', 'DESIGNATION', 'CODE', 'AREA', 'MOB.NO'];
      const values = [
        '${escapeHtml(app.full_name || 'Reporter')}',
        '${escapeHtml(app.designation || app.join_as || 'Reporter')}',
        '${escapeHtml(displayCode)}',
        '${escapeHtml(areaDisplay)}',
        '${escapeHtml(app.mobile_no || 'N/A')}'
      ];

      const startY = 525, rowH = 44, rowSpacing = 9;
      const leftX = 135, totalW = W - leftX - 35;
      const tagW = 165;

      for (let i = 0; i < 5; i++) {
        const ry = startY + i * (rowH + rowSpacing);

        // Red Label Pill
        ctx.save();
        const tagGrad = ctx.createLinearGradient(leftX, 0, leftX + tagW, 0);
        tagGrad.addColorStop(0, '#dc2626');
        tagGrad.addColorStop(1, '#b91c1c');
        ctx.fillStyle = tagGrad;
        ctx.beginPath();
        ctx.roundRect(leftX, ry, tagW, rowH, [8, 0, 0, 8]);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[i], leftX + (tagW / 2), ry + (rowH / 2));
        ctx.restore();

        // White Value Slot
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(leftX + tagW, ry, totalW - tagW, rowH, [0, 8, 8, 0]);
        ctx.fill();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = (i === 2) ? 'bold 22px monospace' : 'bold 20px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Truncate if long
        let valText = ': ' + values[i];
        const maxTextW = totalW - tagW - 20;
        while (ctx.measureText(valText).width > maxTextW && valText.length > 5) {
          valText = valText.slice(0, -1);
        }
        if (valText !== (': ' + values[i])) valText += '...';
        ctx.fillText(valText, leftX + tagW + 10, ry + (rowH / 2));
        ctx.restore();
      }

      // Bottom Wave Container
      ctx.save();
      const waveY = 820;
      const waveGrad = ctx.createLinearGradient(0, waveY, W, H);
      waveGrad.addColorStop(0, '#dc2626');
      waveGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = waveGrad;
      ctx.beginPath();
      ctx.moveTo(0, waveY + 30);
      ctx.quadraticCurveTo(W / 2, waveY - 20, W, waveY + 25);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Bottom Left: QR Code Box
      const qrBoxX = 35, qrBoxY = 852, qrBoxSize = 118;
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 12);
      ctx.fill();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 10;

      const qrImg = await loadImageHelper('${qrSrc}');
      if (qrImg) {
        ctx.drawImage(qrImg, qrBoxX + 6, qrBoxY + 6, qrBoxSize - 12, qrBoxSize - 12);
      }
      ctx.restore();

      // Bottom Right: Signatory & ND30 LIVE
      ctx.save();
      const signImg = await loadImageHelper('/images/nd30_sign_transparent.png?v=2');
      if (signImg) {
        // Draw white signature
        ctx.drawImage(signImg, W - 245, 856, 180, 55);
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Authorised Signatory', W - 150, 924);

      ctx.fillStyle = '#fef08a';
      ctx.font = '900 21px "Arial Black", Impact, sans-serif';
      ctx.fillText('ND30 LIVE', W - 150, 948);
      ctx.restore();

      // Very Bottom Banner Strip: "Scan the QR for Live Verification"
      ctx.save();
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, H - 36, W, 36);

      ctx.fillStyle = '#fef08a';
      ctx.font = '900 16px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('● SCAN THE QR FOR LIVE VERIFICATION ●', W / 2, H - 18);
      ctx.restore();
    }

    /**
     * Render Back Side onto 663x1024 Canvas at Ultra-Crisp Quality
     */
    async function renderBackCanvas(ctx, W, H) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Repeating "ND30" Watermark Pattern
      ctx.save();
      ctx.font = '900 13px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.038)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let y = -40; y < H + 80; y += 46) {
        const xOffset = (Math.floor((y + 40) / 46) % 2 === 0) ? 0 : 40;
        for (let x = -40; x < W + 80; x += 80) {
          ctx.save();
          ctx.translate(x + xOffset, y);
          ctx.rotate(-22 * Math.PI / 180);
          ctx.fillText('ND30', 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();

      // Top Back Header
      ctx.save();
      const hGrad = ctx.createLinearGradient(0, 0, W, 0);
      hGrad.addColorStop(0, '#b91c1c');
      hGrad.addColorStop(0.5, '#dc2626');
      hGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = hGrad;
      ctx.fillRect(0, 0, W, 95);

      ctx.fillStyle = '#fef08a';
      ctx.font = '900 28px "Arial Black", Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ND30 LIVE  •  PVC STANDARD', W / 2, 38);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.fillText('OFFICIAL PRESS ACCREDITATION CREDENTIAL', W / 2, 68);
      ctx.restore();

      // Police & Authorities Notice Box
      ctx.save();
      const nbX = 35, nbY = 120, nbW = W - 70, nbH = 200;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(nbX, nbY, nbW, nbH, 12);
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#b91c1c';
      ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🏛️ NOTICE TO CIVIL, POLICE & EMERGENCY AUTHORITIES', nbX + 16, nbY + 30);

      ctx.fillStyle = '#334155';
      ctx.font = '600 15px "Segoe UI", Arial, sans-serif';
      const noticeLines = [
        "The accredited bearer is an authorized press correspondent representing ND30 LIVE Network.",
        "Under constitutional protection of freedom of the press, all civil administration, security forces,",
        "police departments, and emergency personnel are respectfully requested to extend customary",
        "professional courtesies and unhindered passage for lawful news gathering and field reporting.",
        "",
        "For urgent editorial or registry confirmation: nd30team@gmail.com | Guwahati, Assam"
      ];
      noticeLines.forEach((line, idx) => {
        ctx.fillText(line, nbX + 16, nbY + 62 + idx * 23);
      });
      ctx.restore();

      // Holder Particulars Box
      ctx.save();
      const pbX = 35, pbY = 345, pbW = W - 70, pbH = 290;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(pbX, pbY, pbW, pbH, 12);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 19px "Segoe UI", Arial, sans-serif';
      ctx.fillText('📋 HOLDER PROFILE & PERMANENT RECORD', pbX + 16, pbY + 32);

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('${escapeHtml(displayCode)}', pbX + pbW - 16, pbY + 32);

      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pbX + 16, pbY + 45);
      ctx.lineTo(pbX + pbW - 16, pbY + 45);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '16px "Segoe UI", Arial, sans-serif';
      const details = [
        ['Full Name:', '${escapeHtml(app.full_name || 'Reporter')}'],
        ['Father\\'s Name:', '${escapeHtml(app.father_name || 'N/A')}'],
        ['Designation:', '${escapeHtml(app.designation || app.join_as || 'Reporter')}'],
        ['Contact Mobile:', '${escapeHtml(app.mobile_no || 'N/A')}'],
        ['Date of Issue:', '${issueDateFormatted}'],
        ['Valid Until:', 'Valid Until ${expiryDateFormatted}']
      ];

      for (let i = 0; i < details.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const dx = pbX + 16 + col * (pbW / 2);
        const dy = pbY + 75 + row * 45;

        ctx.fillStyle = '#64748b';
        ctx.font = '600 14px "Segoe UI", Arial, sans-serif';
        ctx.fillText(details[i][0], dx, dy);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
        ctx.fillText(details[i][1], dx, dy + 20);
      }

      // Address line
      const ady = pbY + 225;
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(pbX + 16, ady - 12);
      ctx.lineTo(pbX + pbW - 16, ady - 12);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '600 14px "Segoe UI", Arial, sans-serif';
      ctx.fillText('Permanent Address:', pbX + 16, ady + 4);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
      ctx.fillText('Vill/Town: ${escapeHtml(app.village_town || 'N/A')}, PO: ${escapeHtml(app.post_office || 'N/A')}, PS: ${escapeHtml(app.police_station || 'N/A')}', pbX + 16, ady + 26);
      ctx.fillText('District: ${escapeHtml(app.district || 'Assam')}, State: ${escapeHtml(app.state || 'Assam')} - PIN: ${escapeHtml(app.pin_code || 'N/A')}', pbX + 16, ady + 48);
      ctx.restore();

      // Security Seal & Barcode Strip
      ctx.save();
      const sbX = 35, sbY = 655, sbW = W - 70, sbH = 140;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(sbX, sbY, sbW, sbH, 12);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      // Draw Barcode lines
      const bcX = sbX + 24, bcY = sbY + 22, bcW = 380, bcH = 65;
      ctx.fillStyle = '#0f172a';
      for (let i = 0; i < 48; i++) {
        const lw = (i % 3 === 0 ? 5 : (i % 2 === 0 ? 2 : 3));
        const lx = bcX + i * 7.8;
        ctx.fillRect(lx, bcY, lw, bcH);
      }

      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('*${escapeHtml(displayCode)}*', bcX + (bcW / 2), bcY + bcH + 24);

      // Circular Seal Stamp
      const sealX = sbX + sbW - 85, sealY = sbY + (sbH / 2), sealR = 50;
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
      ctx.fillStyle = '#fee2e2';
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR - 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#b91c1c';
      ctx.font = '900 12px "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ND30 LIVE', sealX, sealY - 18);
      ctx.font = '16px serif';
      ctx.fillText('★', sealX, sealY);
      ctx.font = 'bold 10px "Segoe UI", sans-serif';
      ctx.fillText('VERIFIED', sealX, sealY + 16);
      ctx.restore();

      // Legal Disclaimer
      ctx.save();
      ctx.fillStyle = '#64748b';
      ctx.font = '600 13px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('This credential remains the exclusive property of ND30 LIVE. Misuse or forgery is strictly punishable by law.', W / 2, 850);
      ctx.fillText('If found, please return to: ND30 LIVE Newsroom Desk, Guwahati, Assam - 781001', W / 2, 874);
      ctx.restore();

      // Bottom Back Strip
      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, H - 45, W, 45);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, H - 45, W, 4);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ND30 LIVE DIGITAL NETWORK  •  GUWAHATI, ASSAM  •  WWW.ND30LIVE.IN', W / 2, H - 21);
      ctx.restore();
    }

    /**
     * Download High-Definition (HD) Press Card PNG
     * @param {'front' | 'back' | 'both'} side
     */
    async function downloadHdPressCard(side) {
      const btn = document.getElementById(side === 'front' ? 'btnDownloadFront' : (side === 'back' ? 'btnDownloadBack' : 'btnDownloadBoth'));
      const origText = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> Generating HD PNG...';
      }

      try {
        const W = 663, H = 1024;
        const canvas = document.createElement('canvas');

        if (side === 'both') {
          // Double width canvas for side-by-side export
          canvas.width = W * 2 + 40;
          canvas.height = H;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#0b0f19';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw Front
          const frontCanvas = document.createElement('canvas');
          frontCanvas.width = W;
          frontCanvas.height = H;
          await renderFrontCanvas(frontCanvas.getContext('2d'), W, H);
          ctx.drawImage(frontCanvas, 0, 0);

          // Draw Back
          const backCanvas = document.createElement('canvas');
          backCanvas.width = W;
          backCanvas.height = H;
          await renderBackCanvas(backCanvas.getContext('2d'), W, H);
          ctx.drawImage(backCanvas, W + 40, 0);

        } else if (side === 'back') {
          canvas.width = W;
          canvas.height = H;
          await renderBackCanvas(canvas.getContext('2d'), W, H);
        } else {
          // Front
          canvas.width = W;
          canvas.height = H;
          await renderFrontCanvas(canvas.getContext('2d'), W, H);
        }

        const link = document.createElement('a');
        link.download = 'ND30_PRESS_ID_' + side.toUpperCase() + '_${displayCode}.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>✅</span> Downloaded!';
          setTimeout(() => {
            btn.innerHTML = origText;
          }, 3500);
        }
      } catch (err) {
        console.error('Download error:', err);
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = origText;
        }
        alert('Failed to generate HD card download: ' + err.message);
      }
    }
  </script>
  `;

  return renderLayout({
    title: `✓ Verified Press ID: ${app.full_name} (${displayCode}) | ND30 LIVE`,
    description: `Official digital press verification for ND30 LIVE Field Reporter ${app.full_name}. Press ID: ${displayCode}.`,
    lang: 'en',
    content
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = {
  renderVerifyPressIdPage
};
