/**
 * ND30 LIVE - Press ID Card & QR Code Service
 * Generates official Digital Press ID Cards (Dual-Sided with Live Verification QR Code),
 * creates secured QR codes for public verification, and handles email notifications.
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
 * Render Front Side HTML of the Official ND30 LIVE Press ID Card
 * Includes 3D ND30 LIVE header logo, Assamese slogan ribbon, vertical PRESS ribbon,
 * bordered photo frame, 5 crisp details rows, live QR code on bottom-left,
 * authorised signature on bottom-right, and bottom text "Scan the QR for Live Verification".
 */
function renderPressCardFrontHtml(app, qrDataUrl, verifyUrl) {
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

  const qrSrc = qrDataUrl || (app.press_id_qr ? (app.press_id_qr.startsWith('http') ? app.press_id_qr : `${BASE_URL}${app.press_id_qr}`) : '');

  return `
  <div class="nd30-card-front" style="
    position: relative;
    width: 100%;
    aspect-ratio: 663 / 1024;
    border-radius: 20px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 16px 45px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(220, 38, 38, 0.35);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    user-select: none;
    box-sizing: border-box;
  ">
    <!-- Seamless "ND30" Repeating Watermark Background -->
    <div style="
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='46' viewBox='0 0 80 46'%3E%3Ctext x='40' y='28' font-family='Arial Black, Impact, sans-serif' font-weight='900' font-size='13' fill='%23000000' fill-opacity='0.042' text-anchor='middle' transform='rotate(-22 40 28)'%3END30%3C/text%3E%3C/svg%3E&quot;);
      pointer-events: none;
      z-index: 1;
    "></div>

    <!-- Top Header Corner Curve Swoosh -->
    <svg style="position:absolute; top:0; right:0; width:100%; height:95px; z-index:1; pointer-events:none;" viewBox="0 0 663 150" fill="none" preserveAspectRatio="none">
      <path d="M663 0H320C420 0 520 25 580 65C625 95 645 125 663 150V0Z" fill="url(#topWaveGrad)" />
      <path d="M663 0H420C490 0 560 20 600 50C635 80 650 110 663 130V0Z" fill="#dc2626" fill-opacity="0.25" />
      <defs>
        <linearGradient id="topWaveGrad" x1="320" y1="0" x2="663" y2="150" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ef4444"/>
          <stop offset="1" stop-color="#b91c1c"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- HEADER BLOCK -->
    <div style="position:relative; z-index:2; padding:8px 16px 2px 16px; text-align:center;">
      <!-- Top Title: PRESS ID CARD (Deep Slate Navy) -->
      <div style="
        font-family:'Arial Black', Impact, -apple-system, sans-serif;
        font-size:clamp(0.75rem, 3.8cqw, 1.0rem);
        font-weight:900;
        color:#0f172a;
        letter-spacing:4px;
        text-transform:uppercase;
        margin-bottom:2px;
        text-shadow:0 1px 1px rgba(255, 255, 255, 0.9);
      ">
        PRESS ID CARD
      </div>

      <!-- Official Uploaded ND30 LIVE Logo (Enlarged to match marked box) -->
      <div style="display:flex; align-items:center; justify-content:center; height:clamp(68px, 17cqw, 94px); margin:3px auto 5px auto; width:100%;">
        <img 
          src="${BASE_URL}/images/nd30_live_logo_tight.png?v=1" 
          alt="ND30 LIVE" 
          style="height:100%; width:auto; max-width:85%; object-fit:contain; display:block; filter:drop-shadow(0 3px 6px rgba(0,0,0,0.22));"
          onerror="this.onerror=null; this.src='${BASE_URL}/images/nd30_live_logo.png';"
        >
      </div>

      <!-- Assamese Official Slogan Ribbon (Decreased Compact Size) -->
      <div style="
        background:linear-gradient(90deg, #1e3a8a 0%, #2563eb 50%, #1e3a8a 100%);
        border-radius:4px;
        padding:2.5px 8px;
        margin:3px auto 0 auto;
        max-width:78%;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:5px;
        box-shadow:0 2px 6px rgba(30, 58, 138, 0.3);
        border-left:3px solid #dc2626;
        border-right:3px solid #dc2626;
      ">
        <span style="color:#ef4444; font-weight:900; font-size:clamp(0.55rem, 2.7cqw, 0.72rem);">//</span>
        <span style="
          color:#ffffff;
          font-weight:800;
          font-size:clamp(0.52rem, 2.6cqw, 0.7rem);
          letter-spacing:0.2px;
          text-shadow:0 1px 2px rgba(0,0,0,0.5);
          white-space:nowrap;
        ">
          উত্তৰ-পূবৰ কণ্ঠস্বৰ • নিৰ্ভীক আৰু নিৰপেক্ষ
        </span>
        <span style="color:#ef4444; font-weight:900; font-size:clamp(0.55rem, 2.7cqw, 0.72rem);">//</span>
      </div>
    </div>

    <!-- MIDDLE BODY: PRESS Ribbon (Left) + Photo & Details (Right) -->
    <div style="position:relative; z-index:2; display:flex; flex:1; padding:4px 14px 4px 0; align-items:stretch;">
      <!-- Vertical Curved Red PRESS Ribbon on Left -->
      <div style="
        width:17%;
        min-width:48px;
        background:linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #991b1b 100%);
        border-radius:0 26px 26px 0;
        border-right:3px solid #fbbf24;
        box-shadow:3px 4px 14px rgba(220, 38, 38, 0.35);
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        padding:12px 0;
        margin-bottom:8px;
      ">
        <div style="
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:space-around;
          height:88%;
          color:#ffffff;
          font-family:'Arial Black', Impact, sans-serif;
          font-weight:900;
          font-size:clamp(1.2rem, 6.5cqw, 2rem);
          line-height:1.25;
          letter-spacing:2px;
          text-shadow:0 2px 4px rgba(0,0,0,0.4);
        ">
          <span>P</span>
          <span>R</span>
          <span>E</span>
          <span>S</span>
          <span>S</span>
        </div>
      </div>

      <!-- Right Main Column: Photo + 5 Details Rows -->
      <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:2px 0 2px 14px; box-sizing:border-box;">
        <!-- Passport Photo Container with Red Frame -->
        <div style="
          width:52%;
          aspect-ratio: 1 / 1.15;
          max-height:170px;
          border-radius:14px;
          overflow:hidden;
          border:3.5px solid #dc2626;
          background:#2ca9ed;
          box-shadow:0 6px 16px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(251, 191, 36, 0.6);
          margin-bottom:10px;
          box-sizing:border-box;
          position:relative;
        ">
          <img 
            src="${photoUrl}" 
            alt="${escapeHtml(fullName)}" 
            style="width:100%; height:100%; object-fit:cover; display:block;"
            onerror="this.onerror=null; this.src='${BASE_URL}/images/default_reporter_avatar.png';"
          >
        </div>

        <!-- 5 High-Definition Details Rows -->
        <div style="width:100%; display:flex; flex-direction:column; gap:5px; margin-top:2px;">
          <!-- Row 1: NAME -->
          <div style="display:flex; align-items:center; height:27px; width:100%; box-shadow:0 2px 4px rgba(0,0,0,0.06);">
            <div style="
              width:35%;
              min-width:88px;
              height:100%;
              background:linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
              color:#ffffff;
              font-weight:900;
              font-size:clamp(0.62rem, 3.0cqw, 0.8rem);
              letter-spacing:0.8px;
              display:flex;
              align-items:center;
              justify-content:center;
              border-radius:6px 0 0 6px;
              text-transform:uppercase;
            ">NAME</div>
            <div style="
              flex:1;
              height:100%;
              background:#ffffff;
              border:1.5px solid #dc2626;
              border-left:none;
              border-radius:0 6px 6px 0;
              display:flex;
              align-items:center;
              padding:0 8px;
              font-weight:800;
              color:#0f172a;
              font-size:clamp(0.72rem, 3.6cqw, 0.95rem);
              white-space:nowrap;
              overflow:hidden;
              text-overflow:ellipsis;
            " title="${escapeHtml(fullName)}">
              <span style="color:#dc2626; margin-right:5px; font-weight:900;">:</span> ${escapeHtml(fullName)}
            </div>
          </div>

          <!-- Row 2: DESIGNATION -->
          <div style="display:flex; align-items:center; height:27px; width:100%; box-shadow:0 2px 4px rgba(0,0,0,0.06);">
            <div style="
              width:35%;
              min-width:88px;
              height:100%;
              background:linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
              color:#ffffff;
              font-weight:900;
              font-size:clamp(0.58rem, 2.8cqw, 0.74rem);
              letter-spacing:0.6px;
              display:flex;
              align-items:center;
              justify-content:center;
              border-radius:6px 0 0 6px;
              text-transform:uppercase;
            ">DESIGNATION</div>
            <div style="
              flex:1;
              height:100%;
              background:#ffffff;
              border:1.5px solid #dc2626;
              border-left:none;
              border-radius:0 6px 6px 0;
              display:flex;
              align-items:center;
              padding:0 8px;
              font-weight:800;
              color:#0f172a;
              font-size:clamp(0.72rem, 3.6cqw, 0.95rem);
              white-space:nowrap;
              overflow:hidden;
              text-overflow:ellipsis;
            " title="${escapeHtml(designation)}">
              <span style="color:#dc2626; margin-right:5px; font-weight:900;">:</span> ${escapeHtml(designation)}
            </div>
          </div>

          <!-- Row 3: CODE -->
          <div style="display:flex; align-items:center; height:27px; width:100%; box-shadow:0 2px 4px rgba(0,0,0,0.06);">
            <div style="
              width:35%;
              min-width:88px;
              height:100%;
              background:linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
              color:#ffffff;
              font-weight:900;
              font-size:clamp(0.62rem, 3.0cqw, 0.8rem);
              letter-spacing:0.8px;
              display:flex;
              align-items:center;
              justify-content:center;
              border-radius:6px 0 0 6px;
              text-transform:uppercase;
            ">CODE</div>
            <div style="
              flex:1;
              height:100%;
              background:#ffffff;
              border:1.5px solid #dc2626;
              border-left:none;
              border-radius:0 6px 6px 0;
              display:flex;
              align-items:center;
              padding:0 8px;
              font-family:'Segoe UI', monospace;
              font-weight:900;
              color:#0f172a;
              font-size:clamp(0.75rem, 3.8cqw, 1.02rem);
              letter-spacing:0.8px;
              white-space:nowrap;
              overflow:hidden;
            " title="${escapeHtml(displayCode)}">
              <span style="color:#dc2626; margin-right:5px; font-weight:900;">:</span> ${escapeHtml(displayCode)}
            </div>
          </div>

          <!-- Row 4: AREA -->
          <div style="display:flex; align-items:center; height:27px; width:100%; box-shadow:0 2px 4px rgba(0,0,0,0.06);">
            <div style="
              width:35%;
              min-width:88px;
              height:100%;
              background:linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
              color:#ffffff;
              font-weight:900;
              font-size:clamp(0.62rem, 3.0cqw, 0.8rem);
              letter-spacing:0.8px;
              display:flex;
              align-items:center;
              justify-content:center;
              border-radius:6px 0 0 6px;
              text-transform:uppercase;
            ">AREA</div>
            <div style="
              flex:1;
              height:100%;
              background:#ffffff;
              border:1.5px solid #dc2626;
              border-left:none;
              border-radius:0 6px 6px 0;
              display:flex;
              align-items:center;
              padding:0 8px;
              font-weight:800;
              color:#0f172a;
              font-size:clamp(0.68rem, 3.4cqw, 0.92rem);
              white-space:nowrap;
              overflow:hidden;
              text-overflow:ellipsis;
            " title="${escapeHtml(areaDisplay)}">
              <span style="color:#dc2626; margin-right:5px; font-weight:900;">:</span> ${escapeHtml(areaDisplay)}
            </div>
          </div>

          <!-- Row 5: MOB.NO -->
          <div style="display:flex; align-items:center; height:27px; width:100%; box-shadow:0 2px 4px rgba(0,0,0,0.06);">
            <div style="
              width:35%;
              min-width:88px;
              height:100%;
              background:linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
              color:#ffffff;
              font-weight:900;
              font-size:clamp(0.62rem, 3.0cqw, 0.8rem);
              letter-spacing:0.8px;
              display:flex;
              align-items:center;
              justify-content:center;
              border-radius:6px 0 0 6px;
              text-transform:uppercase;
            ">MOB.NO</div>
            <div style="
              flex:1;
              height:100%;
              background:#ffffff;
              border:1.5px solid #dc2626;
              border-left:none;
              border-radius:0 6px 6px 0;
              display:flex;
              align-items:center;
              padding:0 8px;
              font-weight:800;
              color:#0f172a;
              font-size:clamp(0.72rem, 3.6cqw, 0.95rem);
              letter-spacing:0.5px;
              white-space:nowrap;
              overflow:hidden;
            " title="${escapeHtml(mobileNo)}">
              <span style="color:#dc2626; margin-right:5px; font-weight:900;">:</span> ${escapeHtml(mobileNo)}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- BOTTOM WAVE & VERIFICATION ZONE -->
    <div style="
      position:relative;
      z-index:2;
      background:linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      border-radius:28px 28px 0 0;
      box-shadow:0 -4px 18px rgba(220, 38, 38, 0.25);
      margin-top:4px;
    ">
      <!-- QR Code + Signatory Row -->
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:10px 18px 8px 18px;
      ">
        <!-- Live Verification QR Code Box on Bottom Left -->
        <div style="
          background:#ffffff;
          padding:4px;
          border-radius:8px;
          box-shadow:0 4px 12px rgba(0,0,0,0.3);
          width:clamp(66px, 18cqw, 88px);
          height:clamp(66px, 18cqw, 88px);
          display:flex;
          align-items:center;
          justify-content:center;
          box-sizing:border-box;
          flex-shrink:0;
        ">
          ${qrSrc ? `
            <img 
              src="${qrSrc}" 
              alt="Scan the QR for Live Verification" 
              style="width:100%; height:100%; object-fit:contain; display:block;"
            >
          ` : `
            <div style="font-size:0.6rem; color:#dc2626; font-weight:800; text-align:center;">QR VERIFY</div>
          `}
        </div>

        <!-- Authorized Signatory on Bottom Right -->
        <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; justify-content:center;">
          <img 
            src="${BASE_URL}/images/nd30_sign_transparent.png?v=2" 
            alt="Authorised Signatory" 
            style="height:clamp(28px, 7cqw, 40px); max-width:140px; object-fit:contain; display:block; filter:brightness(0) invert(1);"
            onerror="this.style.display='none';"
          >
          <div style="
            color:#ffffff;
            font-weight:800;
            font-size:clamp(0.68rem, 3.2cqw, 0.88rem);
            margin-top:2px;
            letter-spacing:0.4px;
            text-shadow:0 1px 3px rgba(0,0,0,0.5);
          ">
            Authorised Signatory
          </div>
          <div style="
            color:#fef08a;
            font-weight:900;
            font-size:clamp(0.72rem, 3.4cqw, 0.95rem);
            letter-spacing:1px;
            text-shadow:0 1px 3px rgba(0,0,0,0.5);
          ">
            ND30 LIVE
          </div>
        </div>
      </div>

      <!-- BOTTOM EDGE BANNER: "Scan the QR for Live Verification" -->
      <div style="
        background:#7f1d1d;
        color:#fef08a;
        font-weight:900;
        font-size:clamp(0.62rem, 2.9cqw, 0.78rem);
        text-align:center;
        padding:5px 8px;
        letter-spacing:0.8px;
        text-transform:uppercase;
        border-top:1px solid rgba(254, 240, 138, 0.3);
      ">
        ● Scan the QR for Live Verification ●
      </div>
    </div>
  </div>
  `;
}

/**
 * Render Back Side HTML of the Official ND30 LIVE Press ID Card
 * Includes official accreditation terms, instructions for police & civil authorities,
 * verified residential address, validity dates, official security seal, and barcode.
 */
function renderPressCardBackHtml(app, qrDataUrl, verifyUrl) {
  if (!app) return '';

  const displayCode = app.press_id_code 
    ? (app.press_id_code.includes('-') ? `ND30${String(app.id).padStart(3, '0')}` : app.press_id_code)
    : `ND30${String(app.id || 1).padStart(3, '0')}`;
  
  const designation = app.designation || app.join_as || 'Reporter';
  const fullName = app.full_name || 'Reporter';
  const fatherName = app.father_name || 'N/A';
  const mobileNo = app.mobile_no || 'N/A';
  
  const issueDateFormatted = app.press_id_issued_at 
    ? new Date(app.press_id_issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Active';

  const expiryDateFormatted = app.press_id_expires_at 
    ? new Date(app.press_id_expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '1 Year from Issue';

  const fullAddress = `Vill/Town: ${app.village_town || 'N/A'}, PO: ${app.post_office || 'N/A'}, PS: ${app.police_station || 'N/A'}, Dist: ${app.district || 'Assam'}, State: ${app.state || 'Assam'} - PIN: ${app.pin_code || 'N/A'}`;

  return `
  <div class="nd30-card-back" style="
    position: relative;
    width: 100%;
    aspect-ratio: 663 / 1024;
    border-radius: 20px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 16px 45px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(220, 38, 38, 0.35);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    user-select: none;
    box-sizing: border-box;
  ">
    <!-- Seamless "ND30" Repeating Watermark Background -->
    <div style="
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='46' viewBox='0 0 80 46'%3E%3Ctext x='40' y='28' font-family='Arial Black, Impact, sans-serif' font-weight='900' font-size='13' fill='%23000000' fill-opacity='0.038' text-anchor='middle' transform='rotate(-22 40 28)'%3END30%3C/text%3E%3C/svg%3E&quot;);
      pointer-events: none;
      z-index: 1;
    "></div>

    <!-- BACK HEADER -->
    <div style="
      position:relative;
      z-index:2;
      background:linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #991b1b 100%);
      padding:10px 16px 8px 16px;
      text-align:center;
      color:#ffffff;
      box-shadow:0 3px 10px rgba(0,0,0,0.18);
    ">
      <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
        <span style="font-family:'Arial Black', Impact, sans-serif; font-size:1.15rem; font-weight:900; letter-spacing:1px; color:#fef08a;">ND30 LIVE</span>
        <span style="background:#ffffff; color:#dc2626; font-size:0.65rem; font-weight:900; padding:2px 8px; border-radius:12px; letter-spacing:0.8px;">PVC STANDARD</span>
      </div>
      <div style="font-size:0.82rem; font-weight:800; letter-spacing:1px; text-transform:uppercase; margin-top:2px;">
        Official Press Accreditation Credential
      </div>
      <div style="font-size:0.68rem; color:#fecaca; margin-top:1px;">
        Identity Verification & Legal Authority Terms
      </div>
    </div>

    <!-- BACK CONTENT BODY -->
    <div style="position:relative; z-index:2; padding:10px 14px 4px 14px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
      
      <!-- Police & Administration Notice Box -->
      <div style="
        background:#f8fafc;
        border:1.5px solid #dc2626;
        border-radius:10px;
        padding:8px 10px;
        box-shadow:0 2px 6px rgba(0,0,0,0.05);
      ">
        <div style="
          color:#b91c1c;
          font-weight:900;
          font-size:clamp(0.68rem, 3.1cqw, 0.8rem);
          text-transform:uppercase;
          letter-spacing:0.5px;
          display:flex;
          align-items:center;
          gap:5px;
          margin-bottom:3px;
        ">
          <span>🏛️</span> Notice to Civil, Police & Emergency Authorities:
        </div>
        <p style="
          margin:0;
          font-size:clamp(0.62rem, 2.7cqw, 0.72rem);
          line-height:1.45;
          color:#334155;
          font-weight:600;
          text-align:justify;
        ">
          The accredited bearer is an authorized press correspondent of <strong>ND30 LIVE Network</strong>. Under the protection of constitutional freedom of the press, all civil administration, security forces, police departments, and emergency personnel are respectfully requested to extend customary professional courtesies and unhindered passage for lawful news gathering and public coverage.
        </p>
      </div>

      <!-- Reporter Particulars Table -->
      <div style="
        background:#ffffff;
        border:1px solid #e2e8f0;
        border-radius:10px;
        padding:8px 10px;
        box-shadow:0 2px 6px rgba(0,0,0,0.04);
        margin:6px 0;
      ">
        <div style="font-size:0.75rem; font-weight:900; color:#0f172a; text-transform:uppercase; margin-bottom:6px; border-bottom:1px solid #f1f5f9; padding-bottom:4px; display:flex; justify-content:space-between;">
          <span>📋 Holder Record</span>
          <span style="color:#dc2626; font-family:monospace;">${escapeHtml(displayCode)}</span>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px 10px; font-size:clamp(0.62rem, 2.7cqw, 0.74rem); line-height:1.4;">
          <div>
            <span style="color:#64748b; font-weight:700; display:block;">Full Name:</span>
            <strong style="color:#0f172a;">${escapeHtml(fullName)}</strong>
          </div>
          <div>
            <span style="color:#64748b; font-weight:700; display:block;">Father's Name:</span>
            <span style="color:#0f172a; font-weight:600;">${escapeHtml(fatherName)}</span>
          </div>
          <div>
            <span style="color:#64748b; font-weight:700; display:block;">Designation:</span>
            <span style="color:#dc2626; font-weight:800;">${escapeHtml(designation)}</span>
          </div>
          <div>
            <span style="color:#64748b; font-weight:700; display:block;">Contact:</span>
            <span style="color:#0f172a; font-weight:700;">${escapeHtml(mobileNo)}</span>
          </div>
          <div>
            <span style="color:#64748b; font-weight:700; display:block;">Date of Issue:</span>
            <span style="color:#0f172a; font-weight:600;">${issueDateFormatted}</span>
          </div>
          <div>
            <span style="color:#64748b; font-weight:700; display:block;">Valid Until:</span>
            <strong style="color:#16a34a;">${expiryDateFormatted}</strong>
          </div>
          <div style="grid-column: 1 / -1; margin-top:3px; padding-top:4px; border-top:1px dashed #e2e8f0;">
            <span style="color:#64748b; font-weight:700; display:block;">Permanent Residential Address:</span>
            <span style="color:#1e293b; font-weight:600; line-height:1.35;">${escapeHtml(fullAddress)}</span>
          </div>
        </div>
      </div>

      <!-- Security Seal & Barcode Strip -->
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:10px;
        padding:6px 10px;
        gap:10px;
      ">
        <!-- Security Barcode Representation -->
        <div style="flex:1; display:flex; flex-direction:column; align-items:flex-start;">
          <div style="
            display:flex;
            gap:2px;
            align-items:center;
            height:28px;
            width:100%;
            overflow:hidden;
          ">
            ${Array.from({ length: 42 }).map((_, i) => `
              <div style="
                flex: ${(i % 3 === 0 ? 3 : (i % 2 === 0 ? 1 : 2))};
                height: 100%;
                background: #0f172a;
              "></div>
            `).join('')}
          </div>
          <div style="font-family:monospace; font-size:0.68rem; font-weight:900; color:#334155; margin-top:2px; letter-spacing:1px;">
            *${escapeHtml(displayCode)}*
          </div>
        </div>

        <!-- Official Circular Golden/Red Stamp -->
        <div style="
          width:56px;
          height:56px;
          border-radius:50%;
          border:2px dashed #b91c1c;
          padding:2px;
          box-sizing:border-box;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#fff;
          box-shadow:0 2px 6px rgba(185, 28, 28, 0.15);
          flex-shrink:0;
        ">
          <div style="
            width:100%;
            height:100%;
            border-radius:50%;
            background:linear-gradient(135deg, #fef2f2, #fee2e2);
            border:1px solid #dc2626;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            text-align:center;
            padding:2px;
            box-sizing:border-box;
          ">
            <span style="font-size:0.5rem; font-weight:900; color:#b91c1c; line-height:1;">ND30 LIVE</span>
            <span style="font-size:0.65rem; color:#dc2626;">★</span>
            <span style="font-size:0.42rem; font-weight:800; color:#0f172a; text-transform:uppercase; line-height:1;">VERIFIED</span>
          </div>
        </div>
      </div>

      <!-- Legal Disclaimer & Instructions -->
      <div style="
        font-size:clamp(0.55rem, 2.4cqw, 0.65rem);
        line-height:1.4;
        color:#64748b;
        text-align:center;
        margin:4px 0 2px 0;
      ">
        This card is non-transferable and remains the exclusive property of <strong>ND30 LIVE</strong>. If lost or found, please return to: <em>ND30 LIVE Newsroom Desk, Guwahati, Assam</em>. Emergency Desk: <strong>${OFFICIAL_EMAIL}</strong>
      </div>
    </div>

    <!-- BACK FOOTER STRIP -->
    <div style="
      position:relative;
      z-index:2;
      background:#0f172a;
      color:#e2e8f0;
      font-weight:700;
      font-size:clamp(0.6rem, 2.8cqw, 0.74rem);
      text-align:center;
      padding:6px 10px;
      letter-spacing:0.5px;
      border-top:2px solid #dc2626;
    ">
      ND30 LIVE DIGITAL NETWORK • GUWAHATI, ASSAM • WWW.ND30LIVE.IN
    </div>
  </div>
  `;
}

/**
 * Render Complete ND30 LIVE Dual-Sided Press ID Card Component
 * Supports interactive 3D Flip, side-by-side view, or standalone front/back rendering.
 */
function renderPressCardHtml(app, qrDataUrl, verifyUrl, mode = 'flip') {
  if (!app) return '';

  const frontHtml = renderPressCardFrontHtml(app, qrDataUrl, verifyUrl);
  const backHtml = renderPressCardBackHtml(app, qrDataUrl, verifyUrl);

  if (mode === 'front') {
    return `<div class="nd30-id-card-wrapper" style="width:100%; max-width:440px; margin:0 auto; container-type:inline-size;">${frontHtml}</div>`;
  }

  if (mode === 'back') {
    return `<div class="nd30-id-card-wrapper" style="width:100%; max-width:440px; margin:0 auto; container-type:inline-size;">${backHtml}</div>`;
  }

  if (mode === 'side-by-side') {
    return `
    <div class="nd30-id-cards-dual" style="display:flex; flex-wrap:wrap; justify-content:center; gap:24px; width:100%; max-width:920px; margin:0 auto;">
      <div style="flex:1; min-width:320px; max-width:440px; container-type:inline-size;">
        <div style="font-size:0.8rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; text-align:center; margin-bottom:8px;">
          🪪 Front Side
        </div>
        ${frontHtml}
      </div>
      <div style="flex:1; min-width:320px; max-width:440px; container-type:inline-size;">
        <div style="font-size:0.8rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; text-align:center; margin-bottom:8px;">
          🔄 Back Side
        </div>
        ${backHtml}
      </div>
    </div>
    `;
  }

  // Default: Interactive 3D Flip Card
  return `
  <div class="nd30-interactive-flip-card-wrapper" style="width:100%; max-width:440px; margin:0 auto; perspective:1200px; container-type:inline-size;">
    <div id="nd30CardFlipper" class="nd30-card-flipper" style="
      position: relative;
      width: 100%;
      transform-style: preserve-3d;
      transition: transform 0.65s cubic-bezier(0.4, 0.2, 0.2, 1);
      cursor: pointer;
    " onclick="toggleCardFlip()" title="Click to Flip Card">
      
      <!-- Front Face -->
      <div class="nd30-card-face-front" style="
        width: 100%;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      ">
        ${frontHtml}
      </div>

      <!-- Back Face -->
      <div class="nd30-card-face-back" style="
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        transform: rotateY(180deg);
      ">
        ${backHtml}
      </div>
    </div>

    <!-- Flip Control Helper Hint -->
    <div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-top:14px;">
      <button type="button" onclick="toggleCardFlip()" class="btn-flip-trigger" style="
        background:rgba(220, 38, 38, 0.15);
        border:1px solid #dc2626;
        color:#f87171;
        font-weight:700;
        font-size:0.82rem;
        padding:6px 16px;
        border-radius:20px;
        cursor:pointer;
        display:inline-flex;
        align-items:center;
        gap:6px;
        transition:all 0.2s ease;
      ">
        <span id="flipIcon">🔄</span> <span id="flipLabel">Click Card to Flip (3D View)</span>
      </button>
    </div>
  </div>

  <script>
    let isFlipped = false;
    function toggleCardFlip() {
      const flipper = document.getElementById('nd30CardFlipper');
      const label = document.getElementById('flipLabel');
      if (!flipper) return;
      isFlipped = !isFlipped;
      flipper.style.transform = isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
      if (label) {
        label.innerText = isFlipped ? 'Showing Back Side (Click to Flip)' : 'Showing Front Side (Click to Flip)';
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
  const cardHtml = renderPressCardHtml(app, qrResult.dataUrl, qrResult.verifyUrl, 'side-by-side');

  const emailHtml = `
  <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:720px; margin:0 auto; background:#0d1117; color:#e6edf3; border:1px solid #30363d; border-radius:12px; overflow:hidden;">
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
        We are thrilled to inform you that after reviewing your credentials, the Editorial Board of <strong>ND30 LIVE</strong> has officially approved your appointment as an accredited <strong>${escapeHtml(designation)}</strong> for <strong>${escapeHtml(app.area ? `${app.area}, ${app.district}` : app.district)}, ${escapeHtml(app.state || 'Assam')}</strong>!
      </p>

      <div style="background:rgba(34, 197, 94, 0.1); border-left:4px solid #22c55e; padding:14px 18px; border-radius:0 8px 8px 0; margin:22px 0;">
        <div style="font-size:0.85rem; color:#86efac; text-transform:uppercase; font-weight:700;">Official Press Card Issued</div>
        <div style="font-size:1.2rem; font-weight:800; color:#fff; margin-top:2px;">
          Press ID: <code style="color:#facc15;">${escapeHtml(pressIdCode)}</code>
        </div>
        <div style="font-size:0.85rem; color:#cbd5e1; margin-top:4px;">
          Your dual-sided Digital Press ID Card is rendered below with a <strong>Secured QR Code</strong> for live on-ground verification.
        </div>
      </div>

      <!-- Rendered Digital Press ID Card (Dual Sided) -->
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
 * Handle Application Rejection
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

    const logoPath = path.join(__dirname, '..', 'public', 'images', 'nd30_live_logo.png');
    const avatarPath = path.join(__dirname, '..', 'public', 'images', 'default_reporter_avatar.png');
    let photoPath = '';
    if (app.photo_file && !app.photo_file.startsWith('http')) {
      photoPath = path.join(__dirname, '..', 'public', app.photo_file);
    }
    let qrPath = '';
    if (app.press_id_qr && !app.press_id_qr.startsWith('http')) {
      qrPath = path.join(__dirname, '..', 'public', app.press_id_qr);
    }
    const signPath = path.join(__dirname, '..', 'public', 'images', 'nd30_sign_transparent.png');

    const psScript = `
      [System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null
      $W = 663
      $H = 1024
      $bmp = New-Object System.Drawing.Bitmap($W, $H)
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
      $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

      # Clean White Background
      $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
      $g.FillRectangle($whiteBrush, 0, 0, $W, $H)
      $whiteBrush.Dispose()

      # Repeating "ND30" Watermark Pattern
      $fontWm = New-Object System.Drawing.Font('Arial Black', 11, [System.Drawing.FontStyle]::Bold)
      $brushWm = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(12, 0, 0, 0))
      for ($wy = -50; $wy -lt $H + 100; $wy += 50) {
        $xOff = if ([int](($wy + 50) / 50) % 2 -eq 0) { 0 } else { 45 }
        for ($wx = -50; $wx -lt $W + 100; $wx += 90) {
          $state = $g.Save()
          $g.TranslateTransform($wx + $xOff, $wy)
          $g.RotateTransform(-20)
          $g.DrawString('ND30', $fontWm, $brushWm, 0, 0)
          $g.Restore($state)
        }
      }
      $fontWm.Dispose()
      $brushWm.Dispose()

      # Top Wave
      $redGrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point($W, 160)),
        [System.Drawing.Color]::FromArgb(239, 68, 68),
        [System.Drawing.Color]::FromArgb(185, 28, 28)
      )
      $topPath = New-Object System.Drawing.Drawing2D.GraphicsPath
      $topPath.AddBezier(200, 0, 340, 0, 480, 40, 560, 90)
      $topPath.AddBezier(560, 90, 610, 120, 640, 150, $W, 170)
      $topPath.AddLine($W, 170, $W, 0)
      $topPath.AddLine($W, 0, 200, 0)
      $topPath.CloseFigure()
      $g.FillPath($redGrad, $topPath)
      $topPath.Dispose()
      $redGrad.Dispose()

      # String format center
      $sf = New-Object System.Drawing.StringFormat
      $sf.Alignment = [System.Drawing.StringAlignment]::Center
      $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

      # Top Title: PRESS ID CARD (Deep Slate Navy)
      $fontTop = New-Object System.Drawing.Font('Arial Black', 13, [System.Drawing.FontStyle]::Bold)
      $brushDarkSlate = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
      $g.DrawString('PRESS ID CARD', $fontTop, $brushDarkSlate, [float]($W / 2), 20, $sf)
      $fontTop.Dispose()
      $brushDarkSlate.Dispose()

      # Official Uploaded ND30 LIVE Logo (Tight Crop, Enlarged to Match Marked Area)
      $tightLogoPath = '${path.join(__dirname, '..', 'public', 'images', 'nd30_live_logo_tight.png').replace(/'/g, "''")}'
      $lPath = if ([System.IO.File]::Exists($tightLogoPath)) { $tightLogoPath } else { '${logoPath.replace(/'/g, "''")}' }
      if ([System.IO.File]::Exists($lPath)) {
        try {
          $logo = [System.Drawing.Bitmap]::FromFile($lPath)
          $g.DrawImage($logo, [int](($W - 350) / 2), 34, 350, 116)
          $logo.Dispose()
        } catch {}
      }

      # Blue Slogan Ribbon (Decreased Compact Size)
      $rW = $W - 140
      $rX = 70
      $rH = 24
      $rY = 152
      $blueGrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point($rX, $rY)),
        (New-Object System.Drawing.Point($rX + $rW, $rY)),
        [System.Drawing.Color]::FromArgb(30, 58, 138),
        [System.Drawing.Color]::FromArgb(37, 99, 235)
      )
      $g.FillRectangle($blueGrad, $rX, $rY, $rW, $rH)
      $blueGrad.Dispose()

      $fontRibbon = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Bold)
      $g.DrawString('//  উত্তৰ-পূবৰ কণ্ঠস্বৰ • নিৰ্ভীক আৰু নিৰপেক্ষ  //', $fontRibbon, $brushWhite, [float]($W / 2), $rY + 12, $sf)
      $fontRibbon.Dispose()

      # Left PRESS Ribbon
      $pressGrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 176)),
        (New-Object System.Drawing.Point(0, 736)),
        [System.Drawing.Color]::FromArgb(239, 68, 68),
        [System.Drawing.Color]::FromArgb(153, 27, 27)
      )
      $pressPath = New-Object System.Drawing.Drawing2D.GraphicsPath
      $pressPath.AddLine(0, 176, 70, 176)
      $pressPath.AddBezier(70, 176, 100, 226, 100, 296, 100, 296)
      $pressPath.AddLine(100, 296, 100, 676)
      $pressPath.AddBezier(100, 676, 100, 736, 70, 736, 70, 736)
      $pressPath.AddLine(70, 736, 0, 736)
      $pressPath.CloseFigure()
      $g.FillPath($pressGrad, $pressPath)

      $goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(251, 191, 36), 4)
      $g.DrawPath($goldPen, $pressPath)
      $goldPen.Dispose()
      $pressPath.Dispose()
      $pressGrad.Dispose()

      # Letters P R E S S
      $fontPress = New-Object System.Drawing.Font('Arial Black', 28, [System.Drawing.FontStyle]::Bold)
      $pressLetters = @('P', 'R', 'E', 'S', 'S')
      for ($i = 0; $i -lt 5; $i++) {
        $g.DrawString($pressLetters[$i], $fontPress, $brushWhite, 48, 235 + $i * 95, $sf)
      }
      $fontPress.Dispose()

      # Photo Frame
      $px = 240
      $py = 186
      $pw = 280
      $ph = 310
      $photoRect = New-Object System.Drawing.Rectangle($px, $py, $pw, $ph)
      $bgPhoto = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(44, 169, 237))
      $g.FillRectangle($bgPhoto, $photoRect)
      $bgPhoto.Dispose()

      $hasPhoto = $false
      $pPath = '${photoPath.replace(/'/g, "''")}'
      if ($pPath -and [System.IO.File]::Exists($pPath)) {
        try {
          $photo = [System.Drawing.Bitmap]::FromFile($pPath)
          $g.DrawImage($photo, $photoRect)
          $photo.Dispose()
          $hasPhoto = $true
        } catch {}
      }
      if (-not $hasPhoto) {
        $avPath = '${avatarPath.replace(/'/g, "''")}'
        if ([System.IO.File]::Exists($avPath)) {
          $avatar = [System.Drawing.Bitmap]::FromFile($avPath)
          $g.DrawImage($avatar, $photoRect)
          $avatar.Dispose()
        }
      }

      $redPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 38, 38), 6)
      $g.DrawRectangle($redPen, $photoRect)
      $redPen.Dispose()

      # 5 Details Rows
      $fontLabel = New-Object System.Drawing.Font('Segoe UI', 13, [System.Drawing.FontStyle]::Bold)
      $fontVal = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Bold)
      $fontMono = New-Object System.Drawing.Font('Consolas', 15, [System.Drawing.FontStyle]::Bold)
      $brushDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
      $redTagBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 38, 38))
      $redBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 38, 38), 2)

      $labels = @('NAME', 'DESIGNATION', 'CODE', 'AREA', 'MOB.NO')
      $vals = @(
        '${fullName.replace(/'/g, "''")}',
        '${designation.replace(/'/g, "''")}',
        '${displayCode.replace(/'/g, "''")}',
        '${areaDisplay.replace(/'/g, "''")}',
        '${mobileNo.replace(/'/g, "''")}'
      )

      for ($i = 0; $i -lt 5; $i++) {
        $ry = 525 + $i * 53
        # Red tag
        $g.FillRectangle($redTagBrush, 135, $ry, 165, 44)
        $g.DrawString($labels[$i], $fontLabel, $brushWhite, 217, $ry + 22, $sf)

        # White box
        $g.DrawRectangle($redBorderPen, 300, $ry, 320, 44)
        $f = if ($i -eq 2) { $fontMono } else { $fontVal }
        $g.DrawString(': ' + $vals[$i], $f, $brushDark, 310, $ry + 10)
      }

      $fontLabel.Dispose()
      $fontVal.Dispose()
      $fontMono.Dispose()
      $brushDark.Dispose()
      $redTagBrush.Dispose()
      $redBorderPen.Dispose()

      # Bottom Wave
      $waveGrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 820)),
        (New-Object System.Drawing.Point($W, $H)),
        [System.Drawing.Color]::FromArgb(220, 38, 38),
        [System.Drawing.Color]::FromArgb(153, 27, 27)
      )
      $wavePath = New-Object System.Drawing.Drawing2D.GraphicsPath
      $wavePath.AddBezier(0, 850, [float]($W / 2), 800, [float]($W / 2), 800, $W, 845)
      $wavePath.AddLine($W, 845, $W, $H)
      $wavePath.AddLine($W, $H, 0, $H)
      $wavePath.CloseFigure()
      $g.FillPath($waveGrad, $wavePath)
      $wavePath.Dispose()
      $waveGrad.Dispose()

      # QR Code Box
      $g.FillRectangle($brushWhite, 35, 852, 118, 118)
      $qPath = '${qrPath.replace(/'/g, "''")}'
      if ($qPath -and [System.IO.File]::Exists($qPath)) {
        try {
          $qr = [System.Drawing.Bitmap]::FromFile($qPath)
          $g.DrawImage($qr, 41, 858, 106, 106)
          $qr.Dispose()
        } catch {}
      }

      # Signature on Right
      $sSignPath = '${signPath.replace(/'/g, "''")}'
      if ([System.IO.File]::Exists($sSignPath)) {
        try {
          $sign = [System.Drawing.Bitmap]::FromFile($sSignPath)
          $g.DrawImage($sign, $W - 245, 856, 180, 55)
          $sign.Dispose()
        } catch {}
      }

      $fontSig = New-Object System.Drawing.Font('Segoe UI', 13, [System.Drawing.FontStyle]::Bold)
      $g.DrawString('Authorised Signatory', $fontSig, $brushWhite, $W - 150, 924, $sf)
      $fontSig.Dispose()

      $fontND = New-Object System.Drawing.Font('Arial Black', 15, [System.Drawing.FontStyle]::Bold)
      $yellowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 240, 138))
      $g.DrawString('ND30 LIVE', $fontND, $yellowBrush, $W - 150, 948, $sf)
      $fontND.Dispose()

      # Very Bottom Strip: "Scan the QR for Live Verification"
      $darkRedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(127, 29, 29))
      $g.FillRectangle($darkRedBrush, 0, $H - 36, $W, 36)
      $darkRedBrush.Dispose()

      $fontFoot = New-Object System.Drawing.Font('Segoe UI', 11, [System.Drawing.FontStyle]::Bold)
      $g.DrawString('● SCAN THE QR FOR LIVE VERIFICATION ●', $fontFoot, $yellowBrush, [float]($W / 2), $H - 18, $sf)
      $fontFoot.Dispose()
      $yellowBrush.Dispose()
      $brushWhite.Dispose()
      $sf.Dispose()

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
  approveReporterApplication,
  rejectReporterApplication,
  getReporterByPressId,
  generatePressCardPng
};
