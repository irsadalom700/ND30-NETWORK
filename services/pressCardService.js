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
 * Generate a unique Press ID Code (e.g. ND30-REP-2026-0001)
 */
function generatePressIdCode(applicationId) {
  const year = new Date().getFullYear();
  const paddedId = String(applicationId).padStart(4, '0');
  return `ND30-REP-${year}-${paddedId}`;
}

/**
 * Generate Secured QR Code for Press ID verification
 * Encodes the direct verification URL: ${BASE_URL}/verify-press-id/${pressIdCode}
 */
async function generatePressIdQrCode(pressIdCode) {
  const verifyUrl = `${BASE_URL}/verify-press-id/${pressIdCode}`;
  const filename = `qr_${pressIdCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
  const filePath = path.join(uploadDir, filename);

  // Generate PNG file
  await QRCode.toFile(filePath, verifyUrl, {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    },
    width: 280
  });

  // Generate Data URL for direct inline embedding
  const dataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    },
    width: 280
  });

  return {
    filePath,
    webPath: `/uploads/reporters/${filename}`,
    dataUrl,
    verifyUrl
  };
}

/**
 * Render Press ID Card HTML Component
 * Used inside verification page, print view, and email template
 */
function renderPressCardHtml(app, qrDataUrl, verifyUrl) {
  const issueDate = app.press_id_issued_at ? new Date(app.press_id_issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');
  const expiryDate = app.press_id_expires_at ? new Date(app.press_id_expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Valid for 1 Year';
  const photoUrl = app.photo_file ? (app.photo_file.startsWith('http') ? app.photo_file : `${BASE_URL}${app.photo_file}`) : `${BASE_URL}/uploads/nd30_news_banner.jpg`;
  const qrSrc = qrDataUrl || (app.press_id_qr ? `${BASE_URL}${app.press_id_qr}` : '');

  return `
  <div style="max-width:560px; margin:0 auto; background:linear-gradient(135deg, #090d16 0%, #111827 100%); border:2px solid #dc2626; border-radius:16px; overflow:hidden; box-shadow:0 12px 36px rgba(0,0,0,0.6), 0 0 0 1px rgba(220,38,38,0.3); font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#fff;">
    <!-- Top Header -->
    <div style="background:linear-gradient(135deg, #0b0f19 0%, #161c2b 100%); padding:14px 20px; display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #dc2626;">
      <div style="display:flex; align-items:center; gap:12px;">
        <img src="${BASE_URL}/images/nd30_live_logo.png" alt="ND30 LIVE" style="height:44px; max-width:140px; object-fit:contain;">
        <div>
          <div style="font-size:0.68rem; color:#facc15; letter-spacing:0.8px; text-transform:uppercase; font-weight:800;">
            PRESS & FIELD ACCREDITATION
          </div>
          <div style="font-size:0.62rem; color:#94a3b8; letter-spacing:0.5px;">
            OFFICIAL DIGITAL NEWS NETWORK
          </div>
        </div>
      </div>
      <div style="text-align:right;">
        <span style="background:#dc2626; color:#fff; font-size:0.75rem; font-weight:900; padding:4px 10px; border-radius:4px; letter-spacing:0.5px; text-transform:uppercase;">
          PRESS ID
        </span>
        <div style="font-size:0.68rem; color:#38bdf8; margin-top:3px; font-weight:700;">
          REPORTER CARD
        </div>
      </div>
    </div>

    <!-- Card Main Grid -->
    <div style="padding:20px; display:flex; gap:18px; align-items:flex-start; flex-wrap:wrap;">
      <!-- Photo & Designation Column -->
      <div style="display:flex; flex-direction:column; align-items:center; width:130px; flex-shrink:0;">
        <div style="width:120px; height:140px; border-radius:10px; overflow:hidden; border:2px solid #facc15; box-shadow:0 4px 12px rgba(0,0,0,0.5); background:#1e293b;">
          <img src="${photoUrl}" alt="${escapeHtml(app.full_name)}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='${BASE_URL}/uploads/nd30_news_banner.jpg'">
        </div>
        <div style="background:#dc2626; color:#fff; font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:14px; margin-top:10px; text-transform:uppercase; letter-spacing:0.8px; box-shadow:0 2px 6px rgba(220,38,38,0.4); text-align:center; width:100%;">
          🎙️ ${escapeHtml(app.designation || app.join_as || 'REPORTER')}
        </div>
        <div style="font-size:0.65rem; color:#94a3b8; margin-top:4px; text-align:center;">
          STATE: ASSAM
        </div>
      </div>

      <!-- Details Column -->
      <div style="flex:1; min-width:240px;">
        <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; margin-bottom:10px;">
          <div style="font-size:0.7rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.8px;">PRESS ID NUMBER</div>
          <div style="font-size:1.1rem; font-weight:800; color:#38bdf8; font-family:monospace; letter-spacing:1px;">
            ${escapeHtml(app.press_id_code)}
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr; gap:6px; font-size:0.82rem;">
          <div>
            <span style="color:#94a3b8; font-size:0.72rem; display:block;">ACCREDITED NAME</span>
            <strong style="color:#ffffff; font-size:0.95rem;">${escapeHtml(app.full_name)}</strong>
          </div>
          <div>
            <span style="color:#94a3b8; font-size:0.72rem; display:block;">FATHER'S NAME</span>
            <span style="color:#e2e8f0;">${escapeHtml(app.father_name)}</span>
          </div>
          <div>
            <span style="color:#94a3b8; font-size:0.72rem; display:block;">REPORTING AREA & DISTRICT</span>
            <strong style="color:#facc15;">${escapeHtml(app.area ? `${app.area} (${app.district})` : `${app.district}, ${app.state}`)}</strong>
          </div>
          <div>
            <span style="color:#94a3b8; font-size:0.72rem; display:block;">MOBILE NUMBER</span>
            <span style="color:#22c55e; font-weight:700;">📞 ${escapeHtml(app.mobile_no)}</span>
          </div>
          <div>
            <span style="color:#94a3b8; font-size:0.72rem; display:block;">RESIDENTIAL ADDRESS</span>
            <span style="color:#cbd5e1; font-size:0.75rem; line-height:1.3;">
              ${escapeHtml(app.village_town)}, PO: ${escapeHtml(app.post_office)}, PS: ${escapeHtml(app.police_station)}, PIN: ${escapeHtml(app.pin_code)}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Security QR Code & Signatures Bar -->
    <div style="background:#0b0f19; border-top:1px solid rgba(255,255,255,0.08); padding:14px 20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
      <!-- QR Code with Label -->
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="background:#fff; padding:4px; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.4); flex-shrink:0;">
          <img src="${qrSrc}" alt="Secured QR Code" style="width:68px; height:68px; display:block;">
        </div>
        <div>
          <div style="font-size:0.72rem; font-weight:700; color:#22c55e;">
            🔒 SECURED QR CODE
          </div>
          <div style="font-size:0.65rem; color:#94a3b8; line-height:1.3; max-width:180px;">
            Scan with smartphone camera to view live verification details online.
          </div>
        </div>
      </div>

      <!-- Validity & Seal -->
      <div style="text-align:right; font-size:0.72rem;">
        <div style="color:#94a3b8;">ISSUED: <strong style="color:#fff;">${issueDate}</strong></div>
        <div style="color:#94a3b8; margin-top:2px;">EXPIRES: <strong style="color:#facc15;">${expiryDate}</strong></div>
        <div style="margin-top:6px; color:#38bdf8; font-weight:800; font-size:0.68rem; letter-spacing:0.5px;">
          ✓ AUTHORIZED SIGNATORY
        </div>
      </div>
    </div>

    <!-- Authority Note -->
    <div style="background:#030712; padding:8px 20px; font-size:0.62rem; color:#64748b; text-align:center; border-top:1px solid rgba(255,255,255,0.04); line-height:1.4;">
      This Press Card is the property of ND30 LIVE Network. Police and administration are requested to assist the accredited bearer in journalistic duties.
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
 * Get Application by Press ID code
 */
function getReporterByPressId(pressIdCode) {
  return db.prepare('SELECT * FROM reporter_applications WHERE press_id_code = ?').get(pressIdCode);
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
  approveReporterApplication,
  rejectReporterApplication,
  getReporterByPressId
};

