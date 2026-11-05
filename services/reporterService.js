/**
 * ND30 LIVE - Reporter Application Service
 * Manages reporter applications, file uploads, database persistence,
 * and email notification to nd30team@gmail.com with document attachments.
 */

const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database/db');

const OFFICIAL_EMAIL = 'nd30team@gmail.com';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'reporters');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    cb(null, `${file.fieldname}_${Date.now()}_${cleanBase}${ext}`);
  }
});

// Multer Upload Middleware with strict 1 MB file limit
const uploadReporterDocs = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 // 1 MB strictly
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type "${ext}" for ${file.fieldname}. Allowed formats: JPG, PNG, PDF, DOC, DOCX.`));
    }
  }
}).fields([
  { name: 'adhar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'education_certificate', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'biodata', maxCount: 1 }
]);

/**
 * Configure email transporter
 * Supports custom SMTP or Gmail OAuth / App Password, or fallback test transport
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
 * Save new reporter application to database
 */
function saveReporterApplication(formData, files = {}) {
  const {
    name,
    fatherName,
    mobileNo,
    email,
    villageTown,
    postOffice,
    policeStation,
    district,
    state,
    pinCode,
    education,
    experience,
    previousChannel,
    joinAs,
    area
  } = formData;

  const validRoles = ['Reporter', 'Camera Person', 'Photographer', 'Editor', 'Voice-Over'];
  const appointedRole = validRoles.includes(joinAs) ? joinAs : (joinAs || 'Reporter');

  const adharFile = files.adhar ? `/uploads/reporters/${path.basename(files.adhar[0].path)}` : null;
  const panFile = files.pan ? `/uploads/reporters/${path.basename(files.pan[0].path)}` : null;
  const educationCertFile = files.education_certificate ? `/uploads/reporters/${path.basename(files.education_certificate[0].path)}` : null;
  const photoFile = files.photo ? `/uploads/reporters/${path.basename(files.photo[0].path)}` : null;
  const biodataFile = files.biodata ? `/uploads/reporters/${path.basename(files.biodata[0].path)}` : null;

  const stmt = db.prepare(`
    INSERT INTO reporter_applications (
      full_name, father_name, mobile_no, email,
      village_town, post_office, police_station, district, state, pin_code,
      education, experience, previous_channel,
      join_as, area, designation,
      adhar_file, pan_file, education_certificate_file, photo_file, biodata_file,
      email_sent, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending')
  `);

  const info = stmt.run(
    name,
    fatherName,
    mobileNo,
    email,
    villageTown || '',
    postOffice || '',
    policeStation || '',
    district || '',
    state || 'Assam',
    pinCode || '',
    education || 'Graduate',
    experience || 'Fresher',
    previousChannel || 'None',
    appointedRole,
    area || '',
    appointedRole,
    adharFile,
    panFile,
    educationCertFile,
    photoFile,
    biodataFile
  );

  return db.prepare('SELECT * FROM reporter_applications WHERE id = ?').get(info.lastInsertRowid);
}

/**
 * Send application details and documents to official email: nd30team@gmail.com
 */
async function sendApplicationEmail(application, files = {}) {
  const transporter = getEmailTransporter();

  // Prepare attachments array with readable filenames
  const attachments = [];
  const cleanName = application.full_name.replace(/[^a-zA-Z0-9]/g, '_');

  if (files.adhar && files.adhar[0]) {
    attachments.push({
      filename: `Aadhar_${cleanName}_${files.adhar[0].originalname}`,
      path: files.adhar[0].path
    });
  }
  if (files.pan && files.pan[0]) {
    attachments.push({
      filename: `PAN_${cleanName}_${files.pan[0].originalname}`,
      path: files.pan[0].path
    });
  }
  if (files.education_certificate && files.education_certificate[0]) {
    attachments.push({
      filename: `Education_Cert_${cleanName}_${files.education_certificate[0].originalname}`,
      path: files.education_certificate[0].path
    });
  }
  if (files.photo && files.photo[0]) {
    attachments.push({
      filename: `Photo_${cleanName}_${files.photo[0].originalname}`,
      path: files.photo[0].path
    });
  }
  if (files.biodata && files.biodata[0]) {
    attachments.push({
      filename: `Biodata_${cleanName}_${files.biodata[0].originalname}`,
      path: files.biodata[0].path
    });
  }

  const htmlContent = `
  <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:680px; margin:0 auto; background:#0d1117; color:#e6edf3; border:1px solid #30363d; border-radius:10px; overflow:hidden;">
    <div style="background:linear-gradient(135deg, #b91c1c, #dc2626); padding:24px 28px; text-align:center;">
      <img src="${process.env.BASE_URL || 'http://localhost:3030'}/images/nd30_live_logo.png" alt="ND30 LIVE" style="height:52px; max-width:170px; object-fit:contain; margin-bottom:6px; display:inline-block;"><br>
      <p style="margin:6px 0 0 0; color:#fecaca; font-size:0.95rem;">New Join Us Application — ${escapeHtml(application.join_as || 'Reporter')}</p>
    </div>

    <div style="padding:28px 24px;">
      <div style="background:rgba(255,255,255,0.04); border-left:4px solid #dc2626; padding:14px 18px; border-radius:0 8px 8px 0; margin-bottom:24px;">
        <span style="font-size:0.85rem; color:#8b949e; text-transform:uppercase; letter-spacing:1px; display:block;">Applicant Summary</span>
        <strong style="font-size:1.2rem; color:#fff;">${escapeHtml(application.full_name)}</strong>
        <div style="font-size:0.95rem; color:#facc15; font-weight:700; margin-top:4px;">
          🎯 Role: ${escapeHtml(application.join_as || 'Reporter')} | 📍 Reporting Area: ${escapeHtml(application.area || application.district || 'Unassigned')}
        </div>
        <div style="font-size:0.85rem; color:#38bdf8; margin-top:2px;">
          District: ${escapeHtml(application.district)}, ${escapeHtml(application.state)} | 🎓 ${escapeHtml(application.education)}
        </div>
      </div>

      <h3 style="font-size:1.05rem; color:#f0f6fc; border-bottom:1px solid #30363d; padding-bottom:8px; margin-bottom:16px;">
        🎯 Applied Designation & Jurisdiction
      </h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.92rem; margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0; color:#8b949e; width:38%;">Join As (Role):</td>
          <td style="padding:8px 0; color:#facc15; font-weight:800; font-size:1rem;">${escapeHtml(application.join_as || 'Reporter')}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#8b949e;">Selected Reporting Area:</td>
          <td style="padding:8px 0; color:#38bdf8; font-weight:700;">${escapeHtml(application.area || 'N/A')}</td>
        </tr>
      </table>

      <h3 style="font-size:1.05rem; color:#f0f6fc; border-bottom:1px solid #30363d; padding-bottom:8px; margin-bottom:16px;">
        👤 Personal & Contact Information
      </h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.92rem; margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0; color:#8b949e; width:38%;">Full Name:</td>
          <td style="padding:8px 0; color:#f0f6fc; font-weight:600;">${escapeHtml(application.full_name)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#8b949e;">Father's Name:</td>
          <td style="padding:8px 0; color:#f0f6fc;">${escapeHtml(application.father_name)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#8b949e;">Mobile Number:</td>
          <td style="padding:8px 0; color:#22c55e; font-weight:700;">
            <a href="tel:${escapeHtml(application.mobile_no)}" style="color:#22c55e; text-decoration:none;">📞 ${escapeHtml(application.mobile_no)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#8b949e;">Email Address:</td>
          <td style="padding:8px 0;">
            <a href="mailto:${escapeHtml(application.email)}" style="color:#58a6ff; text-decoration:none;">✉️ ${escapeHtml(application.email)}</a>
          </td>
        </tr>
      </table>

      <h3 style="font-size:1.05rem; color:#f0f6fc; border-bottom:1px solid #30363d; padding-bottom:8px; margin-bottom:16px;">
        🏠 Residential Address
      </h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.92rem; margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0; color:#8b949e; width:38%;">Village / Town:</td>
          <td style="padding:8px 0; color:#f0f6fc;">${escapeHtml(application.village_town)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#8b949e;">Post Office (PO):</td>
          <td style="padding:8px 0; color:#f0f6fc;">${escapeHtml(application.post_office)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#8b949e;">Police Station (PS):</td>
          <td style="padding:8px 0; color:#f0f6fc;">${escapeHtml(application.police_station)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#8b949e;">District:</td>
          <td style="padding:8px 0; color:#f0f6fc; font-weight:600;">${escapeHtml(application.district)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#8b949e;">State:</td>
          <td style="padding:8px 0; color:#f0f6fc;">${escapeHtml(application.state)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#8b949e;">Pin Code:</td>
          <td style="padding:8px 0; color:#f0f6fc; font-family:monospace; font-weight:700;">${escapeHtml(application.pin_code)}</td>
        </tr>
      </table>

      <h3 style="font-size:1.05rem; color:#f0f6fc; border-bottom:1px solid #30363d; padding-bottom:8px; margin-bottom:16px;">
        🎓 Qualifications & Professional Background
      </h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.92rem; margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0; color:#8b949e; width:38%;">Educational Qualification:</td>
          <td style="padding:8px 0; color:#f0f6fc; font-weight:700;">${escapeHtml(application.education)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#8b949e;">Reporting Experience:</td>
          <td style="padding:8px 0; color:#f0f6fc;">${escapeHtml(application.experience)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#8b949e;">Previous Channel / Portal:</td>
          <td style="padding:8px 0; color:#f0f6fc;">${escapeHtml(application.previous_channel)}</td>
        </tr>
      </table>

      <h3 style="font-size:1.05rem; color:#f0f6fc; border-bottom:1px solid #30363d; padding-bottom:8px; margin-bottom:16px;">
        📎 Attached Documents (${attachments.length} files attached, all under 1 MB)
      </h3>
      <ul style="padding-left:20px; color:#c9d1d9; font-size:0.9rem; line-height:1.8;">
        <li><strong>Aadhar Card:</strong> ${application.adhar_file ? '✅ Attached' : '❌ Not provided'}</li>
        <li><strong>PAN Card:</strong> ${application.pan_file ? '✅ Attached' : '❌ Not provided'}</li>
        <li><strong>Education Certificate:</strong> ${application.education_certificate_file ? '✅ Attached' : '❌ Not provided'}</li>
        <li><strong>Passport Photo:</strong> ${application.photo_file ? '✅ Attached' : '❌ Not provided'}</li>
        <li><strong>Biodata / Resume:</strong> ${application.biodata_file ? '✅ Attached' : '❌ Not provided'}</li>
      </ul>
    </div>

    <div style="background:#161b22; padding:16px 24px; border-top:1px solid #30363d; text-align:center; font-size:0.8rem; color:#8b949e;">
      Submitted through the official <strong>ND30 LIVE</strong> website portal on ${new Date(application.created_at).toLocaleString('en-IN')}.
      <br>Destination: <strong>${OFFICIAL_EMAIL}</strong>
    </div>
  </div>
  `;

  if (transporter) {
    try {
      const mailOptions = {
        from: `"ND30 LIVE Reporter Portal" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@nd30live.com'}>`,
        to: OFFICIAL_EMAIL,
        replyTo: application.email,
        subject: `[ND30 LIVE Join Us] Application for ${application.join_as || 'Reporter'}: ${application.full_name} (${application.area ? `${application.area}, ` : ''}${application.district})`,
        html: htmlContent,
        attachments
      };

      const sendResult = await transporter.sendMail(mailOptions);
      db.prepare('UPDATE reporter_applications SET email_sent = 1 WHERE id = ?').run(application.id);
      console.log(`[Reporter Service] Email delivered to ${OFFICIAL_EMAIL} for application #${application.id}. MessageId: ${sendResult.messageId}`);
      return { sent: true, messageId: sendResult.messageId };
    } catch (err) {
      console.error('[Reporter Service] Error dispatching email:', err);
      db.prepare('UPDATE reporter_applications SET email_sent = 0, email_error = ? WHERE id = ?').run(err.message, application.id);
      return { sent: false, error: err.message };
    }
  } else {
    // If SMTP is not yet configured in environment variables, record it cleanly
    console.log(`[Reporter Service] Application #${application.id} saved in database. Set SMTP_USER / GMAIL_USER in .env to dispatch live emails to ${OFFICIAL_EMAIL}.`);
    db.prepare('UPDATE reporter_applications SET email_sent = 0, email_error = ? WHERE id = ?').run('SMTP credentials not configured in .env', application.id);
    return { sent: false, note: 'Saved in database. SMTP configuration pending.' };
  }
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
  OFFICIAL_EMAIL,
  uploadReporterDocs,
  saveReporterApplication,
  sendApplicationEmail
};
