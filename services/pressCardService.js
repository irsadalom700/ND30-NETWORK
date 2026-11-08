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
 * Render Official ND30 LIVE Press ID Card HTML Component
 * Matches the official reference PVC vertical format with 3D logo, vertical PRESS ribbon,
 * bordered photo frame, 5 stylized detail rows, live QR code, and authentic authorized signatory.
 */
function renderPressCardHtml(app, qrDataUrl, verifyUrl) {
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
  <div class="nd30-id-card-wrapper" style="width:100%; max-width:440px; margin:0 auto; perspective:1000px;">
    <div class="nd30-id-card-container" style="
      container-type: inline-size;
      position: relative;
      width: 100%;
      aspect-ratio: 663 / 1024;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 16px 45px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(220, 38, 38, 0.35);
      background: #ffffff;
      user-select: none;
    ">
      <!-- High-Resolution Card Template -->
      <img 
        src="${BASE_URL}/images/nd30_id_card_template.png" 
        alt="ND30 Official Press ID Card Template" 
        style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; display:block; z-index:1;"
        loading="eager"
      >

      <!-- Dynamic Reporter Photo -->
      <div class="nd30-id-photo-box" style="
        position: absolute;
        top: 24.02%;
        left: 30.47%;
        width: 44.34%;
        height: 31.05%;
        z-index: 2;
        border-radius: 14px;
        overflow: hidden;
        border: 3.5px solid #dc2626;
        background: #2ca9ed;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        box-sizing: border-box;
      ">
        <img 
          src="${photoUrl}" 
          alt="${escapeHtml(fullName)}" 
          style="width:100%; height:100%; object-fit:cover; display:block;"
          onerror="this.onerror=null; this.src='${BASE_URL}/images/default_reporter_avatar.png';"
        >
      </div>

      <!-- 5 Dynamic Details Fields -->
      <!-- Row 1: NAME -->
      <div class="nd30-card-val nd30-card-val-name" style="
        position: absolute;
        top: 56.1%;
        left: 53.2%;
        width: 38%;
        height: 4.1%;
        z-index: 2;
        display: flex;
        align-items: center;
        font-family: 'Segoe UI', Arial, -apple-system, sans-serif;
        font-weight: 800;
        color: #0f172a;
        font-size: clamp(0.72rem, 3.8cqw, 1.05rem);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        letter-spacing: 0.2px;
      " title="${escapeHtml(fullName)}">
        ${escapeHtml(fullName)}
      </div>

      <!-- Row 2: DESIGNATION -->
      <div class="nd30-card-val nd30-card-val-desig" style="
        position: absolute;
        top: 60.6%;
        left: 53.2%;
        width: 38%;
        height: 4.1%;
        z-index: 2;
        display: flex;
        align-items: center;
        font-family: 'Segoe UI', Arial, -apple-system, sans-serif;
        font-weight: 800;
        color: #0f172a;
        font-size: clamp(0.72rem, 3.8cqw, 1.05rem);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        letter-spacing: 0.2px;
      " title="${escapeHtml(designation)}">
        ${escapeHtml(designation)}
      </div>

      <!-- Row 3: CODE -->
      <div class="nd30-card-val nd30-card-val-code" style="
        position: absolute;
        top: 65.1%;
        left: 53.2%;
        width: 38%;
        height: 4.1%;
        z-index: 2;
        display: flex;
        align-items: center;
        font-family: 'Segoe UI', monospace;
        font-weight: 900;
        color: #0f172a;
        font-size: clamp(0.75rem, 4.0cqw, 1.1rem);
        white-space: nowrap;
        overflow: hidden;
        letter-spacing: 0.8px;
      " title="${escapeHtml(displayCode)}">
        ${escapeHtml(displayCode)}
      </div>

      <!-- Row 4: AREA -->
      <div class="nd30-card-val nd30-card-val-area" style="
        position: absolute;
        top: 69.6%;
        left: 53.2%;
        width: 38%;
        height: 4.1%;
        z-index: 2;
        display: flex;
        align-items: center;
        font-family: 'Segoe UI', Arial, -apple-system, sans-serif;
        font-weight: 800;
        color: #0f172a;
        font-size: clamp(0.68rem, 3.4cqw, 0.95rem);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        letter-spacing: 0.2px;
      " title="${escapeHtml(areaDisplay)}">
        ${escapeHtml(areaDisplay)}
      </div>

      <!-- Row 5: MOB.NO -->
      <div class="nd30-card-val nd30-card-val-mob" style="
        position: absolute;
        top: 74.1%;
        left: 53.2%;
        width: 38%;
        height: 4.1%;
        z-index: 2;
        display: flex;
        align-items: center;
        font-family: 'Segoe UI', Arial, -apple-system, sans-serif;
        font-weight: 800;
        color: #0f172a;
        font-size: clamp(0.72rem, 3.8cqw, 1.05rem);
        white-space: nowrap;
        overflow: hidden;
        letter-spacing: 0.6px;
      " title="${escapeHtml(mobileNo)}">
        ${escapeHtml(mobileNo)}
      </div>

      <!-- Secured Verification QR Code -->
      <div class="nd30-id-qr-box" style="
        position: absolute;
        top: 83.2%;
        left: 6.03%;
        width: 17.2%;
        height: 11.13%;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        border-radius: 4px;
        padding: 2px;
        box-sizing: border-box;
      ">
        ${qrSrc ? `
          <img src="${qrSrc}" alt="Secured Verification QR Code" style="width:100%; height:100%; object-fit:contain; display:block;">
        ` : `
          <div style="font-size:0.6rem; color:#94a3b8; text-align:center; font-weight:700;">QR VERIFY</div>
        `}
      </div>
    </div>
  </div>
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
  generatePressCardPng,
  approveReporterApplication,
  rejectReporterApplication,
  getReporterByPressId
};

