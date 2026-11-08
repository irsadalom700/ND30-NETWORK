/**
 * ND30 LIVE - Public Press ID Verification Page
 * Features Dual-Sided Official PVC Press ID Card (Front & Back),
 * Interactive 3D Flip Viewer, Side-by-Side View, Instant HD PNG Downloads (Front, Back, Both Sides),
 * and standard dual-sided badge print layout.
 */

const { renderLayout } = require('./layout');
const { 
  renderPressCardHtml, 
  renderPressCardFrontHtml, 
  renderPressCardBackHtml 
} = require('../services/pressCardService');

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

  // Valid Credential Data
  const issueDateFormatted = app.press_id_issued_at 
    ? new Date(app.press_id_issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) 
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const expiryDateFormatted = app.press_id_expires_at 
    ? new Date(app.press_id_expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) 
    : '1 Year from Issue';

  const displayCode = app.press_id_code 
    ? (app.press_id_code.includes('-') ? `ND30${String(app.id).padStart(3, '0')}` : app.press_id_code)
    : `ND30${String(app.id || 1).padStart(3, '0')}`;

  const designation = app.designation || app.join_as || 'Reporter';
  const fullName = app.full_name || 'Reporter';
  const mobileNo = app.mobile_no || 'N/A';

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

  const frontCardHtml = renderPressCardFrontHtml(app);
  const backCardHtml = renderPressCardBackHtml(app, '', '');

  const content = `
  <style>
    /* Print Styles: Isolates Both Sides for Direct PVC Card Printing */
    @media print {
      body * {
        visibility: hidden !important;
      }
      .nd30-print-dualsided-area, .nd30-print-dualsided-area * {
        visibility: visible !important;
      }
      .nd30-print-dualsided-area {
        display: flex !important;
        flex-direction: row !important;
        justify-content: center !important;
        gap: 15mm !important;
        position: fixed !important;
        left: 50% !important;
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 170mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }
      .nd30-print-card-col {
        width: 74mm !important;
        max-width: 74mm !important;
        box-shadow: none !important;
        border: 1px solid #ccc !important;
      }
      .no-print, header, footer, nav, .site-header, .site-footer, .nd30-interactive-view {
        display: none !important;
      }
    }

    /* Interactive 3D Card Stage */
    .nd30-card-stage-container {
      perspective: 1200px;
      max-width: 400px;
      margin: 0 auto;
    }
    .nd30-flip-inner {
      position: relative;
      width: 100%;
      aspect-ratio: 663 / 1024;
      transition: transform 0.75s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform-style: preserve-3d;
      cursor: pointer;
    }
    .nd30-flip-inner.is-flipped {
      transform: rotateY(180deg);
    }
    .nd30-flip-face {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      border-radius: 20px;
    }
    .nd30-face-back {
      transform: rotateY(180deg);
    }

    /* Action Buttons & Pills */
    .view-mode-pill {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #94a3b8;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .view-mode-pill:hover, .view-mode-pill.active {
      background: #dc2626;
      border-color: #dc2626;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
    }

    .id-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      padding: 11px 20px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.88rem;
      text-decoration: none;
      transition: all 0.2s ease;
      border: none;
    }
    .id-action-btn:hover {
      transform: translateY(-2px);
    }
  </style>

  <div class="container" style="padding:40px 16px; max-width:960px; margin:0 auto;">
    <!-- Live Verification Shield Banner -->
    <div class="no-print" style="background:linear-gradient(135deg, rgba(22, 101, 52, 0.25), rgba(21, 128, 61, 0.15)); border:2px solid #22c55e; border-radius:14px; padding:18px 24px; margin-bottom:28px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; box-shadow:0 8px 24px rgba(34, 197, 94, 0.15);">
      <div style="display:flex; align-items:center; gap:14px;">
        <span style="display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; background:#22c55e; color:#fff; border-radius:50%; font-size:1.6rem; box-shadow:0 4px 12px rgba(34, 197, 94, 0.4);">
          ✓
        </span>
        <div>
          <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#86efac; display:block;">
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
        <span style="background:rgba(34, 197, 94, 0.2); border:1px solid #22c55e; color:#86efac; font-size:0.82rem; font-weight:900; padding:5px 14px; border-radius:6px; font-family:monospace; letter-spacing:0.8px;">
          ${escapeHtml(displayCode)}
        </span>
        <div style="font-size:0.7rem; color:#94a3b8; margin-top:4px;">
          Scanned: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
        </div>
      </div>
    </div>

    <!-- Dual-Sided View Mode Switcher -->
    <div class="no-print" style="display:flex; justify-content:center; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
      <button type="button" class="view-mode-pill active" id="pillFlip" onclick="setViewMode('flip')">
        <span>🔄</span> 3D Flip Card (Interactive)
      </button>
      <button type="button" class="view-mode-pill" id="pillSideBySide" onclick="setViewMode('side-by-side')">
        <span>👥</span> Side-by-Side (Both Sides)
      </button>
      <button type="button" class="view-mode-pill" id="pillFrontOnly" onclick="setViewMode('front-only')">
        <span>📄</span> Front Side
      </button>
      <button type="button" class="view-mode-pill" id="pillBackOnly" onclick="setViewMode('back-only')">
        <span>📑</span> Back Side
      </button>
    </div>

    <!-- Mode 1: 3D Flip Card View -->
    <div id="view3dFlip" class="nd30-interactive-view" style="margin-bottom:28px;">
      <div style="text-align:center; margin-bottom:10px;">
        <span style="font-size:0.78rem; color:#94a3b8; background:rgba(255,255,255,0.06); padding:4px 12px; border-radius:14px; display:inline-flex; align-items:center; gap:6px;">
          <span>💡</span> Click anywhere on card or flip button to rotate Front &amp; Back
        </span>
      </div>
      <div class="nd30-card-stage-container">
        <div class="nd30-flip-inner" id="nd30FlipStage" onclick="toggle3DFlip()">
          <!-- FRONT FACE -->
          <div class="nd30-flip-face nd30-face-front">
            ${frontCardHtml}
          </div>
          <!-- BACK FACE -->
          <div class="nd30-flip-face nd30-face-back">
            ${backCardHtml}
          </div>
        </div>
      </div>
    </div>

    <!-- Mode 2: Side-by-Side View -->
    <div id="viewSideBySide" class="nd30-interactive-view" style="display:none; margin-bottom:28px;">
      <div style="display:flex; justify-content:center; gap:24px; flex-wrap:wrap;">
        <div style="flex:1; min-width:300px; max-width:400px;">
          <div style="font-size:0.8rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; text-align:center;">
            FRONT SIDE (PVC STANDARD)
          </div>
          ${frontCardHtml}
        </div>
        <div style="flex:1; min-width:300px; max-width:400px;">
          <div style="font-size:0.8rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; text-align:center;">
            BACK SIDE (ACCREDITATION &amp; QR)
          </div>
          ${backCardHtml}
        </div>
      </div>
    </div>

    <!-- Mode 3: Front Only -->
    <div id="viewFrontOnly" class="nd30-interactive-view" style="display:none; margin-bottom:28px; max-width:400px; margin-left:auto; margin-right:auto;">
      <div style="font-size:0.8rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; text-align:center;">
        FRONT SIDE (OFFICIAL BROADCAST BADGE)
      </div>
      ${frontCardHtml}
    </div>

    <!-- Mode 4: Back Only -->
    <div id="viewBackOnly" class="nd30-interactive-view" style="display:none; margin-bottom:28px; max-width:400px; margin-left:auto; margin-right:auto;">
      <div style="font-size:0.8rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; text-align:center;">
        BACK SIDE (SECURITY &amp; QR CODE VERIFICATION)
      </div>
      ${backCardHtml}
    </div>

    <!-- Hidden Dual-Sided Print Container (Only visible during window.print) -->
    <div class="nd30-print-dualsided-area" style="display:none;">
      <div class="nd30-print-card-col">
        ${frontCardHtml}
      </div>
      <div class="nd30-print-card-col">
        ${backCardHtml}
      </div>
    </div>

    <!-- Multi-Format Action Buttons -->
    <div class="no-print" style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap; margin-bottom:34px;">
      <button type="button" onclick="downloadSideHd('front')" class="id-action-btn" style="background:linear-gradient(135deg, #dc2626, #991b1b); color:#ffffff; box-shadow:0 4px 14px rgba(220, 38, 38, 0.4);">
        <span>📥</span> Download Front (HD PNG)
      </button>
      <button type="button" onclick="downloadSideHd('back')" class="id-action-btn" style="background:linear-gradient(135deg, #1e40af, #1e293b); color:#ffffff; box-shadow:0 4px 14px rgba(30, 64, 175, 0.35);">
        <span>📥</span> Download Back (HD PNG)
      </button>
      <button type="button" onclick="downloadBothSidesHd()" class="id-action-btn" style="background:linear-gradient(135deg, #15803d, #166534); color:#ffffff; box-shadow:0 4px 14px rgba(22, 101, 52, 0.35);">
        <span>🪪</span> Download Both Sides (PNG)
      </button>
      <button type="button" onclick="window.print()" class="id-action-btn" style="background:#1e293b; color:#f8fafc; border:1px solid #334155; box-shadow:0 4px 12px rgba(0,0,0,0.3);">
        <span>🖨️</span> Print Dual-Sided Card
      </button>
      <a href="/as/" class="id-action-btn" style="background:#0f172a; color:#38bdf8; border:1px solid rgba(56, 189, 248, 0.3);">
        <span>🌐</span> Portal Home
      </a>
    </div>

    <!-- Detailed Identity & Police Verification Sheet -->
    <div class="no-print" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:14px; padding:24px 28px; margin-bottom:28px; box-shadow:0 4px 20px rgba(0,0,0,0.25);">
      <h3 style="font-size:1.15rem; font-weight:800; color:var(--text-main); border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:18px; display:flex; align-items:center; gap:8px;">
        <span>📋</span> Complete Accreditation &amp; Registry Verification
      </h3>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:18px; font-size:0.92rem;">
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Full Name</span>
          <strong style="color:var(--text-main); font-size:1.05rem;">${escapeHtml(fullName)}</strong>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Father's Name</span>
          <span style="color:var(--text-main); font-weight:600;">${escapeHtml(app.father_name || 'N/A')}</span>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Designation / Role</span>
          <span style="display:inline-block; background:#dc2626; color:#fff; font-size:0.8rem; font-weight:800; padding:3px 12px; border-radius:14px; text-transform:uppercase; letter-spacing:0.6px; margin-top:2px;">
            ${escapeHtml(designation)}
          </span>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Assigned Territory</span>
          <strong style="color:#facc15; font-size:1rem;">📍 ${escapeHtml(areaDisplay)}</strong>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Official Press ID Code</span>
          <code style="color:#38bdf8; font-weight:900; font-size:1.05rem; letter-spacing:0.8px;">${escapeHtml(displayCode)}</code>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Verified Mobile Contact</span>
          <a href="tel:${escapeHtml(mobileNo)}" style="color:#22c55e; font-weight:700; text-decoration:none; font-size:1rem;">
            📞 ${escapeHtml(mobileNo)}
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
            Vill/Town: ${escapeHtml(app.village_town || 'N/A')}, PO: ${escapeHtml(app.post_office || 'N/A')}, PS: ${escapeHtml(app.police_station || 'N/A')}, District: ${escapeHtml(app.district)}, State: ${escapeHtml(app.state)} - PIN: ${escapeHtml(app.pin_code)}
          </span>
        </div>
      </div>
    </div>

    <!-- Official Press Privileges Notice for Police & Public Authorities -->
    <div class="no-print" style="background:#090d15; border:1px solid rgba(220, 38, 38, 0.35); border-radius:12px; padding:22px; font-size:0.88rem; color:#94a3b8; line-height:1.6; margin-bottom:28px;">
      <strong style="color:#f87171; display:flex; align-items:center; gap:6px; margin-bottom:8px; font-size:1rem;">
        <span>🏛️</span> Notice for Civil Administration, Police &amp; Public Authorities:
      </strong>
      The accredited bearer of this dual-sided PVC credential, <strong>${escapeHtml(fullName)}</strong> (Press ID: <code>${escapeHtml(displayCode)}</code>), is an authorized and accredited news correspondent representing <strong>ND30 LIVE</strong>. All civil, judicial, and law enforcement authorities, public administration officials, and emergency personnel are respectfully requested to extend all customary courtesies and cooperation to allow unhindered journalistic coverage and news gathering.
      <br><br>
      For urgent institutional inquiries, live registry verification, or newsroom confirmation, please contact the Chief Editor's desk directly at <a href="mailto:nd30team@gmail.com" style="color:#38bdf8; font-weight:700;">nd30team@gmail.com</a>.
    </div>
  </div>

  <!-- Client-Side Instant High-Res Dual-Sided PNG Generator -->
  <script>
    function toggle3DFlip() {
      const stage = document.getElementById('nd30FlipStage');
      if (stage) {
        stage.classList.toggle('is-flipped');
      }
    }

    function setViewMode(mode) {
      document.querySelectorAll('.view-mode-pill').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nd30-interactive-view').forEach(v => v.style.display = 'none');

      if (mode === 'flip') {
        document.getElementById('pillFlip').classList.add('active');
        document.getElementById('view3dFlip').style.display = 'block';
      } else if (mode === 'side-by-side') {
        document.getElementById('pillSideBySide').classList.add('active');
        document.getElementById('viewSideBySide').style.display = 'block';
      } else if (mode === 'front-only') {
        document.getElementById('pillFrontOnly').classList.add('active');
        document.getElementById('viewFrontOnly').style.display = 'block';
      } else if (mode === 'back-only') {
        document.getElementById('pillBackOnly').classList.add('active');
        document.getElementById('viewBackOnly').style.display = 'block';
      }
    }

    const loadImage = (src) => new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

    // Draw Front Side onto a 2D canvas context
    async function drawFrontSideToCanvas(ctx, ox = 0, oy = 0, cw = 663, ch = 1024) {
      // White Base
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ox, oy, cw, ch);

      // Top Red Swoosh
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + 430, oy);
      ctx.bezierCurveTo(ox + 300, oy + 100, ox + 180, oy + 210, ox, oy + 250);
      ctx.closePath();
      const gradRed = ctx.createLinearGradient(ox, oy, ox + 400, oy + 250);
      gradRed.addColorStop(0, '#b91c1c');
      gradRed.addColorStop(0.5, '#dc2626');
      gradRed.addColorStop(1, '#ef4444');
      ctx.fillStyle = gradRed;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();

      // Logo
      const logoImg = await loadImage('/images/nd30_live_logo.png');
      if (logoImg) {
        ctx.drawImage(logoImg, ox + 80, oy + 22, 500, 105);
      }

      // Blue Tagline Banner
      const bGrad = ctx.createLinearGradient(ox + 60, oy + 138, ox + 600, oy + 138);
      bGrad.addColorStop(0, '#1e40af');
      bGrad.addColorStop(0.5, '#2563eb');
      bGrad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.roundRect(ox + 65, oy + 138, 533, 40, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('// উত্তৰ-পূবৰ কণ্ঠস্বৰ • নিৰ্ভীক আৰু নিৰপেক্ষ //', ox + 331, oy + 158);

      // Left PRESS Ribbon
      const pGrad = ctx.createLinearGradient(ox, oy + 230, ox, oy + 770);
      pGrad.addColorStop(0, '#b91c1c');
      pGrad.addColorStop(0.5, '#dc2626');
      pGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.moveTo(ox, oy + 230);
      ctx.lineTo(ox + 95, oy + 230);
      ctx.bezierCurveTo(ox + 105, oy + 320, ox + 105, oy + 680, ox + 95, oy + 770);
      ctx.lineTo(ox, oy + 770);
      ctx.closePath();
      ctx.fill();

      // Gold Border on PRESS Ribbon
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#facc15';
      ctx.stroke();

      // Letters P R E S S
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      const letters = ['P', 'R', 'E', 'S', 'S'];
      letters.forEach((l, i) => {
        ctx.fillText(l, ox + 48, oy + 310 + (i * 96));
      });

      // Reporter Photo
      const photoUrl = '${photoUrl}';
      let photoImg = await loadImage(photoUrl);
      if (!photoImg) {
        photoImg = await loadImage('/images/default_reporter_avatar.png');
      }

      const px = ox + 204, py = oy + 238, pw = 288, ph = 312, r = 14;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, r);
      ctx.clip();
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

      // Red border on photo
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, r);
      ctx.stroke();

      // 5 Detail Rows
      const rowLabels = ['NAME', 'DESIGNATION', 'CODE', 'AREA', 'MOB.NO'];
      const rowValues = [
        '${escapeHtml(fullName)}',
        '${escapeHtml(designation)}',
        '${escapeHtml(displayCode)}',
        '${escapeHtml(areaDisplay)}',
        '${escapeHtml(mobileNo)}'
      ];

      rowLabels.forEach((label, i) => {
        const ry = oy + 574 + (i * 44);
        
        // Red Label Tag
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(ox + 124, ry);
        ctx.lineTo(ox + 275, ry);
        ctx.lineTo(ox + 258, ry + 36);
        ctx.lineTo(ox + 124, ry + 36);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, ox + 138, ry + 18);

        // Colon
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
        ctx.fillText(':', ox + 282, ry + 18);

        // Value Box
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1.8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(ox + 296, ry, 335, 36, [0, 8, 8, 0]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = (i === 2) ? '#b91c1c' : '#0f172a';
        ctx.font = (i === 2) ? '900 19px "Segoe UI", monospace' : 'bold 18px "Segoe UI", Arial, sans-serif';
        let valText = rowValues[i];
        while (ctx.measureText(valText).width > 310 && valText.length > 3) {
          valText = valText.slice(0, -1);
        }
        if (valText !== rowValues[i]) valText += '...';
        ctx.fillText(valText, ox + 310, ry + 18);
      });

      // Bottom Red Wave
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ox, oy + ch);
      ctx.lineTo(ox, oy + 825);
      ctx.bezierCurveTo(ox + 220, oy + 795, ox + 450, oy + 815, ox + cw, oy + 785);
      ctx.lineTo(ox + cw, oy + ch);
      ctx.closePath();
      const waveGrad = ctx.createLinearGradient(ox, oy + 780, ox + cw, oy + ch);
      waveGrad.addColorStop(0, '#991b1b');
      waveGrad.addColorStop(0.5, '#dc2626');
      waveGrad.addColorStop(1, '#881337');
      ctx.fillStyle = waveGrad;
      ctx.fill();
      ctx.restore();

      // Signature & Signatory
      const signImg = await loadImage('/images/nd30_sign_transparent.png');
      if (signImg) {
        ctx.drawImage(signImg, ox + 420, oy + 845, 190, 55);
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Authorised Signatory', ox + 615, oy + 920);
      ctx.fillStyle = '#fecdd3';
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillText('ND30 LIVE NETWORK', ox + 615, oy + 940);

      // Gold Seal on Left
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(ox + 85, oy + 890, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = '#090d16';
      ctx.font = '900 11px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ND30', ox + 85, oy + 885);
      ctx.fillText('PASS', ox + 85, oy + 898);

      // Bottom edge banner
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(ox, oy + ch - 30, cw, 30);
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFFICIAL MEDIA ACCREDITATION CARD', ox + 331, oy + ch - 15);
    }

    // Draw Back Side onto a 2D canvas context
    async function drawBackSideToCanvas(ctx, ox = 0, oy = 0, cw = 663, ch = 1024) {
      // White Base
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ox, oy, cw, ch);

      // Header Navy Banner
      const navGrad = ctx.createLinearGradient(ox, oy, ox + cw, oy + 120);
      navGrad.addColorStop(0, '#090d16');
      navGrad.addColorStop(0.7, '#1e293b');
      navGrad.addColorStop(1, '#881337');
      ctx.fillStyle = navGrad;
      ctx.fillRect(ox, oy, cw, 120);

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(ox, oy + 120, cw, 4);

      const logoImg = await loadImage('/images/nd30_live_logo.png');
      if (logoImg) {
        ctx.drawImage(logoImg, ox + 24, oy + 26, 170, 48);
      }

      ctx.fillStyle = '#facc15';
      ctx.font = '900 17px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('PRESS ACCREDITATION PASS', ox + 210, oy + 42);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
      ctx.fillText('DIRECTORATE OF NEWS & FIELD COVERAGE', ox + 210, oy + 64);

      // QR Code Box
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(ox + 24, oy + 145, cw - 48, 175, 12);
      ctx.fill();
      ctx.stroke();

      // Inner white QR box
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(ox + 42, oy + 160, 140, 140, 10);
      ctx.fill();
      ctx.stroke();

      const qrUrl = '${qrSrc}';
      if (qrUrl) {
        const qrImg = await loadImage(qrUrl);
        if (qrImg) {
          ctx.drawImage(qrImg, ox + 48, oy + 166, 128, 128);
        }
      }

      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 17px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🔒 SECURED DIGITAL QR CODE', ox + 204, oy + 185);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px "Segoe UI", Arial, sans-serif';
      ctx.fillText('Scan with smartphone camera to view live accreditation', ox + 204, oy + 214);
      ctx.fillText('registry, validity period, and police verification online.', ox + 204, oy + 234);

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 16px "Segoe UI", monospace';
      ctx.fillText('PRESS ID: ${escapeHtml(displayCode)}', ox + 204, oy + 272);

      // 4 Grid Pills
      const gridItems = [
        { label: "Father's Name", val: "${escapeHtml(app.father_name || 'Record on File')}" },
        { label: "Accredited Role", val: "${escapeHtml(designation)}" },
        { label: "Date of Issue", val: "${issueDateFormatted}" },
        { label: "Validity Period", val: "Until ${expiryDateFormatted}" }
      ];

      const gw = (cw - 48 - 14) / 2;
      gridItems.forEach((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const gx = ox + 24 + (col * (gw + 14));
        const gy = oy + 340 + (row * 72);

        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(gx, gy, gw, 60, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
        ctx.fillText(item.label.toUpperCase(), gx + 14, gy + 20);

        ctx.fillStyle = (idx === 1) ? '#b91c1c' : (idx === 3 ? '#15803d' : '#0f172a');
        ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
        ctx.fillText(item.val, gx + 14, gy + 42);
      });

      // Residential Address Box
      const ay = oy + 500;
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(ox + 24, ay, cw - 48, 110, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
      ctx.fillText('RESIDENTIAL ADDRESS ON RECORD', ox + 40, ay + 24);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
      const addrLine1 = 'Vill/Town: ${escapeHtml(app.village_town || 'N/A')}, PO: ${escapeHtml(app.post_office || 'N/A')}';
      const addrLine2 = 'PS: ${escapeHtml(app.police_station || 'N/A')}, Dist: ${escapeHtml(app.district)}, ${escapeHtml(app.state || 'Assam')} - ${escapeHtml(app.pin_code || 'N/A')}';
      ctx.fillText(addrLine1, ox + 40, ay + 52);
      ctx.fillText(addrLine2, ox + 40, ay + 78);

      // Police & Authority Notice Box
      const ny = oy + 630;
      ctx.fillStyle = 'rgba(220, 38, 38, 0.05)';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(ox + 24, ny, cw - 48, 140, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
      ctx.fillText('NOTICE FOR POLICE, PARAMILITARY & CIVIL AUTHORITIES:', ox + 42, ny + 26);

      ctx.fillStyle = '#334155';
      ctx.font = '13px "Segoe UI", Arial, sans-serif';
      ctx.fillText('This Press Card is the official property of ND30 LIVE Network. The bearer', ox + 42, ny + 54);
      ctx.fillText('is an accredited media correspondent authorized for field news coverage.', ox + 42, ny + 74);
      ctx.fillText('Police and Administrative authorities are respectfully requested to extend all', ox + 42, ny + 94);
      ctx.fillText('customary cooperation and unhindered passage in the performance of duty.', ox + 42, ny + 114);

      // Bureau Desk & Barcode
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ox, oy + ch - 70, cw, 42);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillText('Editorial Desk: nd30team@gmail.com', ox + 30, oy + ch - 44);
      ctx.textAlign = 'right';
      ctx.fillText('Central Bureau: Guwahati, Assam', ox + cw - 30, oy + ch - 44);

      ctx.fillStyle = '#000000';
      ctx.fillRect(ox, oy + ch - 28, cw, 28);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('||||||| | ||||| |||||| | |||||||| |||| | ||||||| |||||||', ox + 331, oy + ch - 10);
    }

    // Trigger Download for Front or Back
    async function downloadSideHd(side) {
      const canvas = document.createElement('canvas');
      canvas.width = 663;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      if (side === 'front') {
        await drawFrontSideToCanvas(ctx, 0, 0, 663, 1024);
      } else {
        await drawBackSideToCanvas(ctx, 0, 0, 663, 1024);
      }

      const link = document.createElement('a');
      link.download = 'ND30_PRESS_CARD_' + side.toUpperCase() + '_${displayCode}.png';
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Trigger Download for Both Sides (Dual Side Studio Canvas)
    async function downloadBothSidesHd() {
      const canvas = document.createElement('canvas');
      canvas.width = 1440;
      canvas.height = 1140;
      const ctx = canvas.getContext('2d');

      // Studio Dark Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1440, 1140);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1440, 1140);

      // Header Bar
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ND30 LIVE OFFICIAL DUAL-SIDED PRESS ACCREDITATION BADGE', 720, 45);

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
      ctx.fillText('Accredited Field Correspondent: ${escapeHtml(fullName)} (${displayCode}) • Directorate of News', 720, 72);

      // Draw Front on Left (x: 45, y: 95)
      await drawFrontSideToCanvas(ctx, 45, 95, 663, 1024);

      // Draw Back on Right (x: 732, y: 95)
      await drawBackSideToCanvas(ctx, 732, 95, 663, 1024);

      const link = document.createElement('a');
      link.download = 'ND30_DUAL_SIDED_PRESS_BADGE_${displayCode}.png';
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
