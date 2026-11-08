/**
 * ND30 LIVE - Press ID Card & QR Code Service
 * Generates official Digital Press ID Cards, creates secured QR codes for public verification,
 * and handles automatic email notifications on application approval/rejection.
 */

const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { db } = require('../database/db');

const OFFICIAL_EMAIL = 'nd30team@gmail.com';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3030';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'reporters');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Configure email transporter
 */
function getEmailTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  return null;
}

/**
 * Generate a unique Press ID Code (matching official format e.g. ND30001)
 */
function generatePressIdCode(applicationId) {
  const paddedId = String(applicationId).padStart(3, '0');
  return `ND30${paddedId}`;
}

/**
 * Generate Secured QR Code for Press ID verification
 * Encodes the direct verification URL: ${BASE_URL}/verify-press-id/${pressIdCode}
 */
async function generatePressIdQrCode(pressIdCode) {
  const verifyUrl = `${BASE_URL}/verify-press-id/${pressIdCode}`;
  const filename = `qr_${pressIdCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
  const filePath = path.join(uploadDir, filename);

  // Generate PNG file with high contrast black/white for instant smartphone scanning
  await QRCode.toFile(filePath, verifyUrl, {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    width: 320
  });

  // Generate Data URL for direct inline embedding
  const dataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    width: 320
  });

  return {
    filePath,
    webPath: `/uploads/reporters/${filename}`,
    dataUrl,
    verifyUrl
  };
}

/**
 * Render Official ND30 LIVE Press ID Card - FRONT SIDE
 * Crisp, vector-built PVC vertical format with 3D logo, vertical PRESS ribbon,
 * bordered photo frame, 5 stylized detail rows, and authentic authorized signature.
 */
function renderPressCardFrontHtml(app) {
  if (!app) return '';

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
    ? (app.photo_file.startsWith('http') ? app.photo_file : `${BASE_URL}${app.photo_file}`) 
    : `${BASE_URL}/images/default_reporter_avatar.png`;

  return `
  <div class="nd30-pvc-card nd30-pvc-card-front" style="
    position: relative;
    width: 100%;
    aspect-ratio: 663 / 1024;
    background: #ffffff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 16px 45px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(220, 38, 38, 0.35);
    user-select: none;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
    box-sizing: border-box;
  ">
    <!-- Background Watermark Pattern -->
    <div style="position:absolute; inset:0; pointer-events:none; z-index:1; opacity:0.04; background-image:radial-gradient(#0f172a 1px, transparent 1px); background-size:16px 16px;"></div>

    <!-- Top Left Dynamic Red Swoosh with White Piping -->
    <svg style="position:absolute; top:0; left:0; width:65%; height:28%; z-index:2; pointer-events:none;" viewBox="0 0 380 200" fill="none" preserveAspectRatio="none">
      <path d="M0,0 L260,0 C180,60 120,130 0,160 Z" fill="url(#gradTopRed)" />
      <path d="M0,0 L260,0 C180,60 120,130 0,160 Z" stroke="#ffffff" stroke-width="3" opacity="0.8" />
      <path d="M0,0 L280,0 C200,70 140,145 0,180 Z" fill="none" stroke="#dc2626" stroke-width="2" opacity="0.4" />
      <defs>
        <linearGradient id="gradTopRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#b91c1c" />
          <stop offset="50%" stop-color="#dc2626" />
          <stop offset="100%" stop-color="#ef4444" />
        </linearGradient>
      </defs>
    </svg>

    <!-- Top Right Globe Map Watermark -->
    <svg style="position:absolute; top:8px; right:8px; width:44%; height:26%; z-index:2; opacity:0.18; pointer-events:none;" viewBox="0 0 200 160" fill="none">
      <circle cx="120" cy="70" r="60" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3 3" />
      <ellipse cx="120" cy="70" rx="60" ry="25" stroke="#0284c7" stroke-width="1.2" />
      <ellipse cx="120" cy="70" rx="60" ry="45" stroke="#0284c7" stroke-width="1.2" />
      <line x1="120" y1="10" x2="120" y2="130" stroke="#0284c7" stroke-width="1.5" />
      <line x1="60" y1="70" x2="180" y2="70" stroke="#0284c7" stroke-width="1.5" />
    </svg>

    <!-- Header Section: Official Logo & Tagline Banner -->
    <div style="position:relative; z-index:3; padding-top:14px; text-align:center;">
      <img 
        src="${BASE_URL}/images/nd30_live_logo.png" 
        alt="ND30 LIVE" 
        style="height:62px; max-width:82%; object-fit:contain; margin:0 auto; display:block; filter:drop-shadow(0 4px 10px rgba(220, 38, 38, 0.35));"
      >

      <!-- Tagline Ribbon Banner -->
      <div style="margin-top:6px; display:inline-flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(90deg, #1e40af, #2563eb, #1e3a8a); padding:5px 16px; border-radius:4px; box-shadow:0 3px 8px rgba(30, 64, 175, 0.35); max-width:90%;">
        <span style="color:#ef4444; font-weight:900; font-size:0.85rem; letter-spacing:1px;">//</span>
        <span style="color:#ffffff; font-weight:800; font-size:0.75rem; letter-spacing:0.4px; white-space:nowrap;">উত্তৰ-পূবৰ কণ্ঠস্বৰ • নিৰ্ভীক আৰু নিৰপেক্ষ</span>
        <span style="color:#ef4444; font-weight:900; font-size:0.85rem; letter-spacing:1px;">//</span>
      </div>
    </div>

    <!-- Left Curved "PRESS" Ribbon -->
    <div style="
      position: absolute;
      left: 0;
      top: 22.5%;
      bottom: 24.5%;
      width: 14.5%;
      background: linear-gradient(180deg, #b91c1c 0%, #dc2626 50%, #991b1b 100%);
      border-top-right-radius: 30px;
      border-bottom-right-radius: 30px;
      border-right: 3.5px solid #facc15;
      box-shadow: inset -2px 0 6px rgba(0,0,0,0.25), 4px 0 14px rgba(220, 38, 38, 0.3);
      z-index: 4;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-around;
      padding: 18px 0;
      box-sizing: border-box;
    ">
      <span style="color:#ffffff; font-weight:900; font-size:1.45rem; line-height:1; text-shadow:0 2px 4px rgba(0,0,0,0.6);">P</span>
      <span style="color:#ffffff; font-weight:900; font-size:1.45rem; line-height:1; text-shadow:0 2px 4px rgba(0,0,0,0.6);">R</span>
      <span style="color:#ffffff; font-weight:900; font-size:1.45rem; line-height:1; text-shadow:0 2px 4px rgba(0,0,0,0.6);">E</span>
      <span style="color:#ffffff; font-weight:900; font-size:1.45rem; line-height:1; text-shadow:0 2px 4px rgba(0,0,0,0.6);">S</span>
      <span style="color:#ffffff; font-weight:900; font-size:1.45rem; line-height:1; text-shadow:0 2px 4px rgba(0,0,0,0.6);">S</span>
    </div>

    <!-- Center Photo Slot with Crisp Frame -->
    <div style="
      position: absolute;
      top: 23%;
      left: 28.5%;
      right: 18%;
      height: 31%;
      z-index: 4;
      display: flex;
      justify-content: center;
      align-items: center;
    ">
      <div style="
        width: 100%;
        max-width: 195px;
        height: 100%;
        border-radius: 14px;
        border: 3.5px solid #dc2626;
        box-shadow: 0 8px 24px rgba(220, 38, 38, 0.25), 0 3px 8px rgba(0,0,0,0.2);
        overflow: hidden;
        background: #2ca9ed;
        box-sizing: border-box;
      ">
        <img 
          src="${photoUrl}" 
          alt="${escapeHtml(fullName)}" 
          style="width:100%; height:100%; object-fit:cover; display:block;"
          onerror="this.onerror=null; this.src='${BASE_URL}/images/default_reporter_avatar.png';"
        >
      </div>
    </div>

    <!-- 5 Clean Detail Rows (Vector Engineered, No Blur, No Misalignment) -->
    <div style="
      position: absolute;
      top: 55.5%;
      left: 17%;
      right: 4.5%;
      z-index: 4;
      display: flex;
      flex-direction: column;
      gap: 6.5px;
    ">
      <!-- Row 1: NAME -->
      <div style="display:flex; align-items:center;">
        <div style="background:linear-gradient(135deg, #b91c1c, #dc2626); color:#fff; font-weight:900; font-size:0.72rem; letter-spacing:0.6px; padding:5px 12px; clip-path:polygon(0 0, 100% 0, 88% 100%, 0 100%); border-radius:5px 0 0 5px; width:98px; flex-shrink:0; text-transform:uppercase;">
          NAME
        </div>
        <span style="color:#dc2626; font-weight:900; font-size:0.95rem; margin:0 4px;">:</span>
        <div style="flex:1; background:#ffffff; border:1.5px solid #dc2626; border-radius:0 7px 7px 0; padding:4px 10px; font-weight:800; color:#0f172a; font-size:0.86rem; box-shadow:0 1px 3px rgba(220,38,38,0.06); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(fullName)}">
          ${escapeHtml(fullName)}
        </div>
      </div>

      <!-- Row 2: DESIGNATION -->
      <div style="display:flex; align-items:center;">
        <div style="background:linear-gradient(135deg, #b91c1c, #dc2626); color:#fff; font-weight:900; font-size:0.72rem; letter-spacing:0.6px; padding:5px 12px; clip-path:polygon(0 0, 100% 0, 88% 100%, 0 100%); border-radius:5px 0 0 5px; width:98px; flex-shrink:0; text-transform:uppercase;">
          DESIGNATION
        </div>
        <span style="color:#dc2626; font-weight:900; font-size:0.95rem; margin:0 4px;">:</span>
        <div style="flex:1; background:#ffffff; border:1.5px solid #dc2626; border-radius:0 7px 7px 0; padding:4px 10px; font-weight:800; color:#0f172a; font-size:0.86rem; box-shadow:0 1px 3px rgba(220,38,38,0.06); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(designation)}">
          ${escapeHtml(designation)}
        </div>
      </div>

      <!-- Row 3: CODE -->
      <div style="display:flex; align-items:center;">
        <div style="background:linear-gradient(135deg, #b91c1c, #dc2626); color:#fff; font-weight:900; font-size:0.72rem; letter-spacing:0.6px; padding:5px 12px; clip-path:polygon(0 0, 100% 0, 88% 100%, 0 100%); border-radius:5px 0 0 5px; width:98px; flex-shrink:0; text-transform:uppercase;">
          CODE
        </div>
        <span style="color:#dc2626; font-weight:900; font-size:0.95rem; margin:0 4px;">:</span>
        <div style="flex:1; background:#ffffff; border:1.5px solid #dc2626; border-radius:0 7px 7px 0; padding:4px 10px; font-weight:900; color:#b91c1c; font-family:'Segoe UI', monospace; font-size:0.92rem; letter-spacing:0.8px; box-shadow:0 1px 3px rgba(220,38,38,0.06); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(displayCode)}">
          ${escapeHtml(displayCode)}
        </div>
      </div>

      <!-- Row 4: AREA -->
      <div style="display:flex; align-items:center;">
        <div style="background:linear-gradient(135deg, #b91c1c, #dc2626); color:#fff; font-weight:900; font-size:0.72rem; letter-spacing:0.6px; padding:5px 12px; clip-path:polygon(0 0, 100% 0, 88% 100%, 0 100%); border-radius:5px 0 0 5px; width:98px; flex-shrink:0; text-transform:uppercase;">
          AREA
        </div>
        <span style="color:#dc2626; font-weight:900; font-size:0.95rem; margin:0 4px;">:</span>
        <div style="flex:1; background:#ffffff; border:1.5px solid #dc2626; border-radius:0 7px 7px 0; padding:4px 10px; font-weight:800; color:#0f172a; font-size:0.84rem; box-shadow:0 1px 3px rgba(220,38,38,0.06); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(areaDisplay)}">
          ${escapeHtml(areaDisplay)}
        </div>
      </div>

      <!-- Row 5: MOB.NO -->
      <div style="display:flex; align-items:center;">
        <div style="background:linear-gradient(135deg, #b91c1c, #dc2626); color:#fff; font-weight:900; font-size:0.72rem; letter-spacing:0.6px; padding:5px 12px; clip-path:polygon(0 0, 100% 0, 88% 100%, 0 100%); border-radius:5px 0 0 5px; width:98px; flex-shrink:0; text-transform:uppercase;">
          MOB.NO
        </div>
        <span style="color:#dc2626; font-weight:900; font-size:0.95rem; margin:0 4px;">:</span>
        <div style="flex:1; background:#ffffff; border:1.5px solid #dc2626; border-radius:0 7px 7px 0; padding:4px 10px; font-weight:800; color:#0f172a; font-size:0.86rem; letter-spacing:0.5px; box-shadow:0 1px 3px rgba(220,38,38,0.06); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(mobileNo)}">
          ${escapeHtml(mobileNo)}
        </div>
      </div>
    </div>

    <!-- Bottom Wave Footer with Official Signatory -->
    <div style="
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 22%;
      background: linear-gradient(135deg, #991b1b 0%, #dc2626 55%, #881337 100%);
      clip-path: polygon(0 28%, 100% 0%, 100% 100%, 0% 100%);
      z-index: 4;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 0 16px 6px 16px;
      box-sizing: border-box;
    ">
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:8px; padding:0 8px;">
        <!-- Left Hologram / Official Pass Emblem -->
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, #facc15, #ca8a04); border:2px solid #ffffff; box-shadow:0 2px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#0f172a; font-size:0.62rem; font-weight:900; text-align:center; line-height:1;">
            ND30<br>PASS
          </div>
          <span style="font-size:0.6rem; color:#fef08a; font-weight:800; background:rgba(0,0,0,0.3); padding:3px 8px; border-radius:4px; border:1px solid rgba(250,204,21,0.4); text-transform:uppercase; letter-spacing:0.5px;">
            Dual Sided PVC Card
          </span>
        </div>

        <!-- Right Authentic Authorized Signature -->
        <div style="text-align:right;">
          <img src="${BASE_URL}/images/nd30_sign_transparent.png" alt="Signature" style="height:32px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); display:inline-block;">
          <div style="color:#ffffff; font-weight:800; font-size:0.68rem; letter-spacing:0.4px;">Authorised Signatory</div>
          <div style="color:#fecdd3; font-weight:700; font-size:0.6rem; letter-spacing:0.8px;">ND30 LIVE NETWORK</div>
        </div>
      </div>

      <!-- Bottom Edge Banner -->
      <div style="background:rgba(0,0,0,0.35); color:#fef08a; font-size:0.58rem; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; text-align:center; padding:3px 6px; border-radius:4px; border-top:1px solid rgba(255,255,255,0.15);">
        SCAN REVERSE QR CODE FOR LIVE AUTHENTICATION
      </div>
    </div>
  </div>
  `;
}

/**
 * Render Official ND30 LIVE Press ID Card - BACK SIDE (Reverse Side)
 * Features live secured verification QR code, detailed personnel credentials,
 * administration/police authority notice, and newsroom jurisdiction details.
 */
function renderPressCardBackHtml(app, qrDataUrl, verifyUrl) {
  if (!app) return '';

  const displayCode = app.press_id_code 
    ? (app.press_id_code.includes('-') ? `ND30${String(app.id).padStart(3, '0')}` : app.press_id_code)
    : `ND30${String(app.id || 1).padStart(3, '0')}`;

  const issueDateFormatted = app.press_id_issued_at 
    ? new Date(app.press_id_issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const expiryDateFormatted = app.press_id_expires_at 
    ? new Date(app.press_id_expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
    : '1 Year from Issue';

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

  const qrSrc = qrDataUrl || (app.press_id_qr ? (app.press_id_qr.startsWith('http') ? app.press_id_qr : `${BASE_URL}${app.press_id_qr}`) : '');

  return `
  <div class="nd30-pvc-card nd30-pvc-card-back" style="
    position: relative;
    width: 100%;
    aspect-ratio: 663 / 1024;
    background: #ffffff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 16px 45px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(220, 38, 38, 0.35);
    user-select: none;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  ">
    <!-- Header Section: Directorate of Accreditation -->
    <div style="background:linear-gradient(135deg, #090d16 0%, #1e293b 70%, #991b1b 100%); padding:14px 18px; border-bottom:3.5px solid #dc2626; color:#ffffff;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${BASE_URL}/images/nd30_live_logo.png" alt="ND30 LIVE" style="height:32px; object-fit:contain;">
          <div>
            <div style="font-size:0.72rem; color:#facc15; font-weight:900; letter-spacing:0.8px; text-transform:uppercase;">
              PRESS ACCREDITATION PASS
            </div>
            <div style="font-size:0.6rem; color:#94a3b8; font-weight:700; letter-spacing:0.4px;">
              DIRECTORATE OF NEWS & FIELD COVERAGE
            </div>
          </div>
        </div>
        <span style="background:#dc2626; color:#ffffff; font-size:0.68rem; font-weight:900; padding:3px 10px; border-radius:4px; letter-spacing:0.6px; text-transform:uppercase;">
          REVERSE
        </span>
      </div>
    </div>

    <!-- Center Body Section -->
    <div style="padding:14px 18px; display:flex; flex-direction:column; gap:12px; flex:1;">
      <!-- QR Code & Security Unit -->
      <div style="display:flex; align-items:center; gap:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px;">
        <div style="background:#ffffff; border:2.5px solid #dc2626; border-radius:10px; padding:5px; box-shadow:0 4px 12px rgba(220,38,38,0.18); width:94px; height:94px; flex-shrink:0;">
          <img src="${qrSrc}" alt="Secured QR Code" style="width:100%; height:100%; object-fit:contain; display:block;">
        </div>
        <div>
          <div style="font-size:0.78rem; font-weight:900; color:#15803d; display:flex; align-items:center; gap:5px;">
            <span>🔒</span> SECURED DIGITAL QR CODE
          </div>
          <div style="font-size:0.65rem; color:#64748b; line-height:1.35; margin:4px 0 6px 0;">
            Scan with smartphone camera to view live accreditation status, validity period, and authorized police verification sheet online.
          </div>
          <div style="display:inline-block; font-size:0.82rem; font-weight:900; font-family:'Segoe UI', monospace; color:#dc2626; background:rgba(220,38,38,0.08); border:1px dashed #dc2626; padding:2px 8px; border-radius:4px;">
            ID: ${displayCode}
          </div>
        </div>
      </div>

      <!-- Personnel Accreditation Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:6px 10px;">
          <span style="font-size:0.62rem; color:#64748b; font-weight:800; text-transform:uppercase; display:block;">Father's Name</span>
          <strong style="color:#0f172a; font-size:0.78rem; font-weight:800;">${escapeHtml(app.father_name || 'Record on File')}</strong>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:6px 10px;">
          <span style="font-size:0.62rem; color:#64748b; font-weight:800; text-transform:uppercase; display:block;">Accredited Role</span>
          <strong style="color:#b91c1c; font-size:0.78rem; font-weight:800;">${escapeHtml(designation)}</strong>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:6px 10px;">
          <span style="font-size:0.62rem; color:#64748b; font-weight:800; text-transform:uppercase; display:block;">Date of Issue</span>
          <span style="color:#0f172a; font-size:0.78rem; font-weight:700;">${issueDateFormatted}</span>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:6px 10px;">
          <span style="font-size:0.62rem; color:#64748b; font-weight:800; text-transform:uppercase; display:block;">Validity Period</span>
          <strong style="color:#15803d; font-size:0.78rem; font-weight:800;">Until ${expiryDateFormatted}</strong>
        </div>
      </div>

      <!-- Residential Address on File -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 10px;">
        <span style="font-size:0.62rem; color:#64748b; font-weight:800; text-transform:uppercase; display:block; margin-bottom:2px;">Residential Address on Record</span>
        <div style="color:#1e293b; font-size:0.72rem; line-height:1.4; font-weight:600;">
          ${escapeHtml(app.village_town || 'N/A')}, PO: ${escapeHtml(app.post_office || 'N/A')}, PS: ${escapeHtml(app.police_station || 'N/A')}, Dist: ${escapeHtml(app.district)}, ${escapeHtml(app.state || 'Assam')} - PIN: ${escapeHtml(app.pin_code || 'N/A')}
        </div>
      </div>

      <!-- Legal Notice & Authority Privileges -->
      <div style="background:rgba(220,38,38,0.05); border-left:3.5px solid #dc2626; border-radius:0 8px 8px 0; padding:8px 12px; font-size:0.65rem; color:#334155; line-height:1.45;">
        <strong style="color:#b91c1c; font-size:0.68rem; display:block; margin-bottom:2px;">NOTICE FOR POLICE, PARAMILITARY & CIVIL AUTHORITIES:</strong>
        This Press Card is the official property of ND30 LIVE Network. The bearer is an accredited media correspondent authorized for field coverage. Civil, Police, and Security Authorities are respectfully requested to extend all customary cooperation and unhindered passage in the performance of duty.
      </div>
    </div>

    <!-- Back Footer: Central Newsroom Desk & Barcode Strip -->
    <div>
      <div style="background:#0f172a; color:#cbd5e1; padding:8px 18px; display:flex; justify-content:space-between; align-items:center; font-size:0.65rem; border-top:1px solid #1e293b;">
        <div><strong>Editorial Desk:</strong> <span style="color:#38bdf8;">nd30team@gmail.com</span></div>
        <div><strong>Bureau:</strong> Guwahati, Assam</div>
      </div>
      <div style="background:#000000; color:#94a3b8; font-family:monospace; font-size:0.62rem; letter-spacing:2.5px; text-align:center; padding:3px 0; user-select:none;">
        ||||||| | ||||| |||||| | |||||||| |||| | ||||||| |||||||
      </div>
    </div>
  </div>
  `;
}

/**
 * Render Complete Press Card Component (Supports Interactive 3D Flip, Side-by-Side, Front & Back)
 */
function renderPressCardHtml(app, qrDataUrl, verifyUrl, mode = 'flip') {
  if (!app) return '';

  const frontHtml = renderPressCardFrontHtml(app);
  const backHtml = renderPressCardBackHtml(app, qrDataUrl, verifyUrl);

  if (mode === 'front') return frontHtml;
  if (mode === 'back') return backHtml;

  if (mode === 'side-by-side') {
    return `
    <div class="nd30-dual-cards-row" style="display:flex; justify-content:center; gap:24px; flex-wrap:wrap; max-width:880px; margin:0 auto;">
      <div style="flex:1; min-width:300px; max-width:390px;">
        <div style="font-size:0.8rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; text-align:center;">
          FRONT SIDE (PVC STANDARD)
        </div>
        ${frontHtml}
      </div>
      <div style="flex:1; min-width:300px; max-width:390px;">
        <div style="font-size:0.8rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; text-align:center;">
          BACK SIDE (ACCREDITATION & QR)
        </div>
        ${backHtml}
      </div>
    </div>
    `;
  }

  // Default: Interactive 3D Flip Card
  return `
  <div class="nd30-flip-card-wrapper" style="max-width:390px; margin:0 auto; perspective:1200px;">
    <!-- Flip Trigger Helper -->
    <div style="text-align:center; margin-bottom:10px;">
      <button type="button" onclick="toggleCard3DFlip()" class="btn-flip-hint" style="background:rgba(220,38,38,0.12); border:1px solid #dc2626; color:#ef4444; font-size:0.75rem; font-weight:800; padding:5px 14px; border-radius:20px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
        <span>🔄</span> Click to Flip Card (Front / Back)
      </button>
    </div>

    <!-- 3D Card Container -->
    <div class="nd30-flip-card-stage" id="nd30FlipCardStage" onclick="toggleCard3DFlip()" style="
      position: relative;
      width: 100%;
      aspect-ratio: 663 / 1024;
      transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform-style: preserve-3d;
      cursor: pointer;
    ">
      <!-- FRONT FACE -->
      <div class="nd30-card-face nd30-face-front" style="
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      ">
        ${frontHtml}
      </div>

      <!-- BACK FACE -->
      <div class="nd30-card-face nd30-face-back" style="
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        transform: rotateY(180deg);
      ">
        ${backHtml}
      </div>
    </div>
  </div>

  <script>
    function toggleCard3DFlip() {
      const stage = document.getElementById('nd30FlipCardStage');
      if (!stage) return;
      if (stage.style.transform === 'rotateY(180deg)') {
        stage.style.transform = 'rotateY(0deg)';
      } else {
        stage.style.transform = 'rotateY(180deg)';
      }
    }
  </script>
  `;
}

/**
 * Handle Application Approval:
 * 1. Generate Press ID code (if not yet generated)
 * 2. Generate QR code pointing to ${BASE_URL}/verify-press-id/${pressIdCode}
 * 3. Update database
 * 4. Dispatch Approval Email to applicant with Press Card & QR Code
 */
async function approveReporterApplication(applicationId) {
  let app = db.prepare('SELECT * FROM reporter_applications WHERE id = ?').get(applicationId);
  if (!app) throw new Error('Reporter application not found.');

  // Generate press id code if missing
  let pressIdCode = app.press_id_code;
  if (!pressIdCode) {
    pressIdCode = generatePressIdCode(app.id);
  }

  // Issue date & Expiry date (1 year)
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  // Generate Secured QR Code
  const qrResult = await generatePressIdQrCode(pressIdCode);

  const designation = app.join_as || app.designation || 'Reporter';

  // Update Database
  db.prepare(`
    UPDATE reporter_applications
    SET status = 'approved',
        press_id_code = ?,
        press_id_qr = ?,
        press_id_issued_at = ?,
        press_id_expires_at = ?,
        designation = ?
    WHERE id = ?
  `).run(pressIdCode, qrResult.webPath, issuedAt, expiresAt, designation, applicationId);

  // Reload updated row
  app = db.prepare('SELECT * FROM reporter_applications WHERE id = ?').get(applicationId);

  // Dispatch Email to Applicant
  const transporter = getEmailTransporter();
  const cardHtml = renderPressCardHtml(app, qrResult.dataUrl, qrResult.verifyUrl);

  const emailHtml = `
  <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:680px; margin:0 auto; background:#0d1117; color:#e6edf3; border:1px solid #30363d; border-radius:12px; overflow:hidden;">
    <div style="background:linear-gradient(135deg, #15803d, #16a34a); padding:26px 28px; text-align:center;">
      <img src="${BASE_URL}/images/nd30_live_logo.png" alt="ND30 LIVE" style="height:54px; max-width:180px; object-fit:contain; margin-bottom:8px; display:inline-block;"><br>
      <p style="margin:6px 0 0 0; color:#dcfce7; font-size:1rem; font-weight:600;">
        🎉 Congratulations! Your Reporter Application is Approved
      </p>
    </div>

    <div style="padding:28px 24px;">
      <p style="font-size:1.05rem; line-height:1.6; color:#f0f6fc; margin-top:0;">
        Dear <strong>${escapeHtml(app.full_name)}</strong>,
      </p>
      <p style="font-size:0.95rem; line-height:1.6; color:#c9d1d9;">
        We are thrilled to inform you that after reviewing your credentials, the Editorial Board of <strong>ND30 LIVE</strong> has officially approved your appointment as an accredited <strong>${escapeHtml(designation)}</strong> for <strong>${escapeHtml(app.area ? `${app.area}, ${app.district}` : app.district)}, ${escapeHtml(app.state)}</strong>!
      </p>

      <div style="background:rgba(34, 197, 94, 0.1); border-left:4px solid #22c55e; padding:14px 18px; border-radius:0 8px 8px 0; margin:22px 0;">
        <div style="font-size:0.85rem; color:#86efac; text-transform:uppercase; font-weight:700;">Official Press Card Issued</div>
        <div style="font-size:1.2rem; font-weight:800; color:#fff; margin-top:2px;">
          Press ID: <code style="color:#facc15;">${escapeHtml(pressIdCode)}</code>
        </div>
        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">
          Your digital Press ID Card is rendered below with a <strong>Secured QR Code</strong> for on-ground verification by authorities and the public.
        </div>
      </div>

      <!-- Rendered Digital Press ID Card -->
      <div style="margin:28px 0;">
        ${cardHtml}
      </div>

      <!-- Action Buttons -->
      <div style="text-align:center; margin:28px 0 16px 0;">
        <a href="${qrResult.verifyUrl}" target="_blank" style="display:inline-block; background:linear-gradient(135deg, #dc2626, #991b1b); color:#ffffff; font-weight:800; font-size:0.95rem; padding:14px 28px; border-radius:8px; text-decoration:none; box-shadow:0 4px 14px rgba(220, 38, 38, 0.5);">
          🔍 Verify Digital Press ID Card Online ↗
        </a>
      </div>

      <div style="background:#161b22; border:1px solid #30363d; border-radius:8px; padding:16px 18px; margin-top:24px; font-size:0.85rem; color:#8b949e; line-height:1.6;">
        <strong style="color:#f0f6fc; display:block; margin-bottom:4px;">📌 Important Guidelines for ND30 LIVE Reporters:</strong>
        1. Always maintain journalistic ethics, objectivity, and truth in all field coverage.<br>
        2. Keep this Digital Press ID Card accessible on your smartphone during fieldwork.<br>
        3. Civil and police authorities can scan the secured QR code anytime to verify your live accreditation status.
      </div>
    </div>

    <div style="background:#090d16; padding:18px 24px; border-top:1px solid #30363d; text-align:center; font-size:0.8rem; color:#8b949e;">
      Official Communication from <strong>ND30 LIVE Editorial Board</strong><br>
      Newsroom: <a href="mailto:${OFFICIAL_EMAIL}" style="color:#38bdf8;">${OFFICIAL_EMAIL}</a> | Guwahati, Assam
    </div>
  </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"ND30 LIVE Newsroom" <${process.env.SMTP_FROM || process.env.SMTP_USER || OFFICIAL_EMAIL}>`,
        to: app.email,
        replyTo: OFFICIAL_EMAIL,
        subject: `🎉 Congratulations! Your ND30 LIVE Press ID Card & Accreditation are Approved (ID: ${pressIdCode})`,
        html: emailHtml,
        attachments: [
          {
            filename: `ND30_Press_ID_QR_${pressIdCode}.png`,
            path: qrResult.filePath
          }
        ]
      });

      db.prepare('UPDATE reporter_applications SET status_email_sent = 1, status_email_error = NULL WHERE id = ?').run(app.id);
      console.log(`[Press ID Service] Approval email with Press ID & QR sent to ${app.email} for ID: ${pressIdCode}`);
      return { success: true, pressIdCode, emailSent: true, verifyUrl: qrResult.verifyUrl };
    } catch (err) {
      console.error('[Press ID Service] Email sending error:', err);
      db.prepare('UPDATE reporter_applications SET status_email_sent = 0, status_email_error = ? WHERE id = ?').run(err.message, app.id);
      return { success: true, pressIdCode, emailSent: false, emailError: err.message, verifyUrl: qrResult.verifyUrl };
    }
  } else {
    console.log(`[Press ID Service] Transporter not configured. Press ID ${pressIdCode} generated and saved. Configure SMTP in .env to dispatch live emails.`);
    db.prepare('UPDATE reporter_applications SET status_email_sent = 0, status_email_error = ? WHERE id = ?').run('SMTP credentials not configured in .env', app.id);
    return { success: true, pressIdCode, emailSent: false, note: 'Saved in database. SMTP configuration pending.', verifyUrl: qrResult.verifyUrl };
  }
}

/**
 * Handle Application Rejection:
 * 1. Update status to 'rejected'
 * 2. Dispatch polite notification email to applicant
 */
async function rejectReporterApplication(applicationId, reason = '') {
  let app = db.prepare('SELECT * FROM reporter_applications WHERE id = ?').get(applicationId);
  if (!app) throw new Error('Reporter application not found.');

  db.prepare("UPDATE reporter_applications SET status = 'rejected' WHERE id = ?").run(applicationId);

  const transporter = getEmailTransporter();

  const emailHtml = `
  <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:620px; margin:0 auto; background:#0d1117; color:#e6edf3; border:1px solid #30363d; border-radius:10px; overflow:hidden;">
    <div style="background:linear-gradient(135deg, #1f2937, #374151); padding:22px 26px; text-align:center;">
      <img src="${BASE_URL}/images/nd30_live_logo.png" alt="ND30 LIVE" style="height:48px; max-width:160px; object-fit:contain; margin-bottom:6px; display:inline-block;"><br>
      <p style="margin:4px 0 0 0; color:#9ca3af; font-size:0.9rem;">Reporter Application Status Update</p>
    </div>

    <div style="padding:26px 24px;">
      <p style="font-size:1rem; line-height:1.6; color:#f0f6fc; margin-top:0;">
        Dear <strong>${escapeHtml(app.full_name)}</strong>,
      </p>
      <p style="font-size:0.92rem; line-height:1.6; color:#c9d1d9;">
        Thank you for your interest in joining <strong>ND30 LIVE</strong> as a Field Reporter and for submitting your credentials.
      </p>
      <p style="font-size:0.92rem; line-height:1.6; color:#c9d1d9;">
        After careful review by our recruitment desk and taking into account current district allocation limits for <strong>${escapeHtml(app.district)}</strong>, we regret to inform you that we are unable to approve your application at this time.
      </p>
      ${reason ? `<div style="background:rgba(255,255,255,0.04); border-left:3px solid #f87171; padding:12px 16px; margin:18px 0; font-size:0.85rem; color:#cbd5e1;"><strong>Note:</strong> ${escapeHtml(reason)}</div>` : ''}
      <p style="font-size:0.92rem; line-height:1.6; color:#c9d1d9;">
        We appreciate the time you took to apply and encourage you to re-apply during our next vacancy cycle.
      </p>
    </div>

    <div style="background:#090d16; padding:16px 24px; border-top:1px solid #30363d; text-align:center; font-size:0.8rem; color:#8b949e;">
      Official Communication from <strong>ND30 LIVE Newsroom</strong><br>
      <a href="mailto:${OFFICIAL_EMAIL}" style="color:#38bdf8;">${OFFICIAL_EMAIL}</a> | Guwahati, Assam
    </div>
  </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"ND30 LIVE Newsroom" <${process.env.SMTP_FROM || process.env.SMTP_USER || OFFICIAL_EMAIL}>`,
        to: app.email,
        replyTo: OFFICIAL_EMAIL,
        subject: 'ND30 LIVE - Update on your Reporter Application',
        html: emailHtml
      });
      db.prepare('UPDATE reporter_applications SET status_email_sent = 1, status_email_error = NULL WHERE id = ?').run(app.id);
      return { success: true, emailSent: true };
    } catch (err) {
      console.error('[Press ID Service] Rejection email error:', err);
      db.prepare('UPDATE reporter_applications SET status_email_sent = 0, status_email_error = ? WHERE id = ?').run(err.message, app.id);
      return { success: true, emailSent: false, emailError: err.message };
    }
  } else {
    db.prepare('UPDATE reporter_applications SET status_email_sent = 0, status_email_error = ? WHERE id = ?').run('SMTP credentials not configured in .env', app.id);
    return { success: true, emailSent: false, note: 'Saved in database. SMTP configuration pending.' };
  }
}

/**
 * Get Application by Press ID code (Supports ND30001, ND30-REP-2026-0001, and ID lookup)
 */
function getReporterByPressId(pressIdCode) {
  if (!pressIdCode) return null;
  const clean = String(pressIdCode).trim();

  // 1. Exact match in database
  let app = db.prepare('SELECT * FROM reporter_applications WHERE press_id_code = ?').get(clean);
  if (app) return app;

  // 2. Case-insensitive match
  app = db.prepare('SELECT * FROM reporter_applications WHERE LOWER(press_id_code) = LOWER(?)').get(clean);
  if (app) return app;

  // 3. Short code like ND30001 or ND30003 -> lookup by numeric application id
  const m = clean.match(/^ND300*(\d+)$/i);
  if (m) {
    const id = parseInt(m[1], 10);
    app = db.prepare('SELECT * FROM reporter_applications WHERE id = ?').get(id);
    if (app) return app;
  }

  // 4. Substring / legacy format match
  return db.prepare('SELECT * FROM reporter_applications WHERE press_id_code LIKE ?').get(`%${clean}%`);
}

const { execFile } = require('child_process');

/**
 * Generate High-Resolution 663x1024 Official Press ID Card PNG file
 */
function generatePressCardPng(app) {
  return new Promise((resolve) => {
    if (!app) return resolve(null);
    const displayCode = app.press_id_code 
      ? (app.press_id_code.includes('-') ? `ND30${String(app.id).padStart(3, '0')}` : app.press_id_code)
      : `ND30${String(app.id || 1).padStart(3, '0')}`;
    const filename = `idcard_${displayCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
    const outputPath = path.join(uploadDir, filename);

    // If cached image already exists, return immediately
    if (fs.existsSync(outputPath)) {
      return resolve(outputPath);
    }

    if (process.platform !== 'win32') {
      return resolve(null);
    }

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

    const templatePath = path.join(__dirname, '..', 'public', 'images', 'nd30_id_card_template.png');
    const avatarPath = path.join(__dirname, '..', 'public', 'images', 'default_reporter_avatar.png');
    let photoPath = '';
    if (app.photo_file && !app.photo_file.startsWith('http')) {
      photoPath = path.join(__dirname, '..', 'public', app.photo_file);
    }
    let qrPath = '';
    if (app.press_id_qr && !app.press_id_qr.startsWith('http')) {
      qrPath = path.join(__dirname, '..', 'public', app.press_id_qr);
    }

    const psScript = `
      [System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null
      $template = [System.Drawing.Bitmap]::FromFile('${templatePath.replace(/'/g, "''")}')
      $bmp = New-Object System.Drawing.Bitmap($template.Width, $template.Height)
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
      $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.DrawImage($template, 0, 0, $template.Width, $template.Height)
      $template.Dispose()

      $photoRect = New-Object System.Drawing.Rectangle(204, 248, 288, 312)
      $radius = 14
      $diameter = $radius * 2
      $path = New-Object System.Drawing.Drawing2D.GraphicsPath
      $arc = New-Object System.Drawing.Rectangle($photoRect.X, $photoRect.Y, $diameter, $diameter)
      $path.AddArc($arc, 180, 90)
      $arc.X = $photoRect.Right - $diameter
      $path.AddArc($arc, 270, 90)
      $arc.Y = $photoRect.Bottom - $diameter
      $path.AddArc($arc, 0, 90)
      $arc.X = $photoRect.Left
      $path.AddArc($arc, 90, 90)
      $path.CloseFigure()

      $hasPhoto = $false
      $pPath = '${photoPath.replace(/'/g, "''")}'
      if ($pPath -and [System.IO.File]::Exists($pPath)) {
        try {
          $photo = [System.Drawing.Bitmap]::FromFile($pPath)
          $g.SetClip($path)
          $srcRatio = $photo.Width / $photo.Height
          $dstRatio = $photoRect.Width / $photoRect.Height
          $srcCrop = New-Object System.Drawing.Rectangle(0, 0, $photo.Width, $photo.Height)
          if ($srcRatio -gt $dstRatio) {
            $cropW = [int]($photo.Height * $dstRatio)
            $srcCrop.X = [int](($photo.Width - $cropW) / 2)
            $srcCrop.Width = $cropW
          } else {
            $cropH = [int]($photo.Width / $dstRatio)
            $srcCrop.Y = [int](($photo.Height - $cropH) / 2)
            $srcCrop.Height = $cropH
          }
          $g.DrawImage($photo, $photoRect, $srcCrop, [System.Drawing.GraphicsUnit]::Pixel)
          $g.ResetClip()
          $photo.Dispose()
          $hasPhoto = $true
        } catch {}
      }

      if (-not $hasPhoto) {
        $avPath = '${avatarPath.replace(/'/g, "''")}'
        if ([System.IO.File]::Exists($avPath)) {
          $avatar = [System.Drawing.Bitmap]::FromFile($avPath)
          $g.SetClip($path)
          $g.DrawImage($avatar, $photoRect)
          $g.ResetClip()
          $avatar.Dispose()
        }
      }

      $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 38, 38), 4)
      $g.DrawPath($pen, $path)
      $pen.Dispose()
      $path.Dispose()

      $font = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Bold)
      $fontMono = New-Object System.Drawing.Font('Consolas', 19, [System.Drawing.FontStyle]::Bold)
      $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))

      $g.DrawString('${fullName.replace(/'/g, "''")}', $font, $brush, 354, 579)
      $g.DrawString('${designation.replace(/'/g, "''")}', $font, $brush, 354, 625)
      $g.DrawString('${displayCode.replace(/'/g, "''")}', $fontMono, $brush, 354, 671)
      $g.DrawString('${areaDisplay.replace(/'/g, "''")}', $font, $brush, 354, 717)
      $g.DrawString('${mobileNo.replace(/'/g, "''")}', $font, $brush, 354, 763)

      $font.Dispose()
      $fontMono.Dispose()
      $brush.Dispose()

      $qPath = '${qrPath.replace(/'/g, "''")}'
      if ($qPath -and [System.IO.File]::Exists($qPath)) {
        try {
          $qr = [System.Drawing.Bitmap]::FromFile($qPath)
          $g.DrawImage($qr, 38, 852, 116, 116)
          $qr.Dispose()
        } catch {}
      }

      $g.Dispose()
      $bmp.Save('${outputPath.replace(/'/g, "''")}', [System.Drawing.Imaging.ImageFormat]::Png)
      $bmp.Dispose()
    `;

    execFile('powershell', ['-NoProfile', '-Command', psScript], (err) => {
      if (err) {
        console.error('[GeneratePressCardPng Error]', err.message);
        return resolve(null);
      }
      resolve(outputPath);
    });
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
  generatePressIdCode,
  generatePressIdQrCode,
  renderPressCardHtml,
  renderPressCardFrontHtml,
  renderPressCardBackHtml,
  generatePressCardPng,
  approveReporterApplication,
  rejectReporterApplication,
  getReporterByPressId
};

