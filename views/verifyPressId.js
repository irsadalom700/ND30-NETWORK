/**
 * ND30 LIVE - Public Press ID Verification Page
 * Displayed when anyone scans the QR code on a reporter's Press Card
 * or visits /verify-press-id/:pressIdCode
 */

const { renderLayout } = require('./layout');
const { renderPressCardHtml } = require('../services/pressCardService');

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
        width: 72mm !important;
        max-width: 72mm !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        background: transparent !important;
      }
      .no-print, header, footer, nav, .site-header, .site-footer {
        display: none !important;
      }
    }

    .nd30-id-card-container {
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
    }
    .nd30-id-card-container:hover {
      transform: translateY(-4px) scale(1.01);
      box-shadow: 0 24px 55px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(220, 38, 38, 0.5);
    }

    .id-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      padding: 12px 22px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.92rem;
      text-decoration: none;
      transition: all 0.2s ease;
      border: none;
    }
    .id-action-btn:hover {
      transform: translateY(-2px);
    }
  </style>

  <div class="container" style="padding:40px 16px; max-width:860px; margin:0 auto;">
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
        <span style="background:rgba(34, 197, 94, 0.2); border:1px solid #22c55e; color:#86efac; font-size:0.8rem; font-weight:800; padding:4px 12px; border-radius:6px; font-family:monospace; letter-spacing:0.8px;">
          ${escapeHtml(displayCode)}
        </span>
        <div style="font-size:0.7rem; color:#94a3b8; margin-top:4px;">
          Scanned: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
        </div>
      </div>
    </div>

    <!-- Official Press ID Card Display (Printable Zone) -->
    <div class="nd30-printable-card-area" style="margin-bottom:24px;">
      <h3 class="no-print" style="font-size:1.05rem; font-weight:800; color:#94a3b8; margin-bottom:16px; text-transform:uppercase; letter-spacing:1px; text-align:center;">
        Official Digital Press Card (PVC Standard)
      </h3>
      ${renderPressCardHtml(app)}
    </div>

    <!-- Action Buttons -->
    <div class="no-print" style="display:flex; justify-content:center; gap:14px; flex-wrap:wrap; margin-bottom:32px;">
      <button type="button" id="btnDownloadHdCard" onclick="downloadHdPressCard()" class="id-action-btn" style="background:linear-gradient(135deg, #dc2626, #991b1b); color:#ffffff; box-shadow:0 4px 14px rgba(220, 38, 38, 0.4);">
        <span>📥</span> Download HD ID Card (PNG)
      </button>
      <button type="button" onclick="window.print()" class="id-action-btn" style="background:#1e293b; color:#f8fafc; border:1px solid #334155; box-shadow:0 4px 12px rgba(0,0,0,0.3);">
        <span>🖨️</span> Print Press ID Card
      </button>
      <a href="/as/" class="id-action-btn" style="background:#0f172a; color:#38bdf8; border:1px solid rgba(56, 189, 248, 0.3);">
        <span>🌐</span> ND30 Portal Home
      </a>
    </div>

    <!-- Detailed Identity & Police Verification Sheet -->
    <div class="no-print" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:14px; padding:24px 28px; margin-bottom:28px; box-shadow:0 4px 20px rgba(0,0,0,0.25);">
      <h3 style="font-size:1.15rem; font-weight:800; color:var(--text-main); border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:18px; display:flex; align-items:center; gap:8px;">
        <span>📋</span> Accreditation & Verification Details
      </h3>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:18px; font-size:0.92rem;">
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Full Name</span>
          <strong style="color:var(--text-main); font-size:1.05rem;">${escapeHtml(app.full_name)}</strong>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Father's Name</span>
          <span style="color:var(--text-main); font-weight:600;">${escapeHtml(app.father_name)}</span>
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
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block;">Residential Address on Record</span>
          <span style="color:var(--text-main); line-height:1.5;">
            Vill/Town: ${escapeHtml(app.village_town || 'N/A')}, PO: ${escapeHtml(app.post_office || 'N/A')}, PS: ${escapeHtml(app.police_station || 'N/A')}, District: ${escapeHtml(app.district)}, State: ${escapeHtml(app.state)} - PIN: ${escapeHtml(app.pin_code)}
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

  <!-- Client-Side Instant High-Res ID Card PNG Generator -->
  <script>
    async function downloadHdPressCard() {
      const btn = document.getElementById('btnDownloadHdCard');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> Generating HD Card (663x1024)...';
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 663;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        const loadImage = (src) => new Promise((resolve) => {
          if (!src) return resolve(null);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        });

        // 1. Draw Template Background
        const templateImg = await loadImage('/images/nd30_id_card_template.png');
        if (templateImg) {
          ctx.drawImage(templateImg, 0, 0, 663, 1024);
        }

        // 2. Draw Photo
        const photoUrl = '${photoUrl}';
        let photoImg = await loadImage(photoUrl);
        if (!photoImg) {
          photoImg = await loadImage('/images/default_reporter_avatar.png');
        }

        const px = 204, py = 248, pw = 288, ph = 312, r = 14;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(px + r, py);
        ctx.lineTo(px + pw - r, py);
        ctx.quadraticCurveTo(px + pw, py, px + pw, py + r);
        ctx.lineTo(px + pw, py + ph - r);
        ctx.quadraticCurveTo(px + pw, py + ph, px + pw - r, py + ph);
        ctx.lineTo(px + r, py + ph);
        ctx.quadraticCurveTo(px, py + ph, px, py + ph - r);
        ctx.lineTo(px, py + r);
        ctx.quadraticCurveTo(px, py, px + r, py);
        ctx.closePath();
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
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(px + r, py);
        ctx.lineTo(px + pw - r, py);
        ctx.quadraticCurveTo(px + pw, py, px + pw, py + r);
        ctx.lineTo(px + pw, py + ph - r);
        ctx.quadraticCurveTo(px + pw, py + ph, px + pw - r, py + ph);
        ctx.lineTo(px + r, py + ph);
        ctx.quadraticCurveTo(px, py + ph, px, py + ph - r);
        ctx.lineTo(px, py + r);
        ctx.quadraticCurveTo(px, py, px + r, py);
        ctx.closePath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#dc2626';
        ctx.stroke();
        ctx.restore();

        // 3. Draw 5 Text Values (x: 354)
        ctx.fillStyle = '#0f172a';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';

        const drawTruncated = (text, x, y, maxWidth) => {
          let t = text || '';
          while (ctx.measureText(t).width > maxWidth && t.length > 3) {
            t = t.slice(0, -1);
          }
          if (t !== text) t += '...';
          ctx.fillText(t, x, y);
        };

        drawTruncated('${escapeHtml(app.full_name || 'Reporter')}', 354, 597, 245);
        drawTruncated('${escapeHtml(app.designation || app.join_as || 'Reporter')}', 354, 643, 245);
        
        ctx.font = 'bold 26px "Segoe UI", monospace';
        drawTruncated('${escapeHtml(displayCode)}', 354, 689, 245);

        ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
        drawTruncated('${escapeHtml(areaDisplay)}', 354, 735, 245);

        ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
        drawTruncated('${escapeHtml(app.mobile_no || 'N/A')}', 354, 781, 245);

        // 4. Draw QR Code
        const qrUrl = '${qrSrc}';
        if (qrUrl) {
          const qrImg = await loadImage(qrUrl);
          if (qrImg) {
            ctx.drawImage(qrImg, 38, 852, 116, 116);
          }
        }

        // Trigger Instant HD PNG Download
        const link = document.createElement('a');
        link.download = 'ND30_PRESS_ID_${displayCode}.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>✅</span> HD Card Downloaded!';
          setTimeout(() => {
            btn.innerHTML = '<span>📥</span> Download HD ID Card (PNG)';
          }, 3500);
        }
      } catch (err) {
        console.error('Download error:', err);
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>📥</span> Download HD ID Card (PNG)';
        }
        alert('Failed to generate image download: ' + err.message);
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
