/**
 * ND30 LIVE - Public Press ID Verification Page
 * Displayed when anyone scans the QR code on a reporter's Press Card
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

  const content = `
  <div class="container" style="padding:40px 16px; max-width:840px; margin:0 auto;">
    <!-- Live Verification Shield Banner -->
    <div style="background:linear-gradient(135deg, rgba(22, 101, 52, 0.25), rgba(21, 128, 61, 0.15)); border:2px solid #22c55e; border-radius:14px; padding:18px 24px; margin-bottom:28px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; box-shadow:0 8px 24px rgba(34, 197, 94, 0.15);">
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
        <span style="background:rgba(34, 197, 94, 0.2); border:1px solid #22c55e; color:#86efac; font-size:0.75rem; font-weight:700; padding:4px 10px; border-radius:6px; font-family:monospace;">
          ${escapeHtml(app.press_id_code)}
        </span>
        <div style="font-size:0.7rem; color:#94a3b8; margin-top:4px;">
          Scanned: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
        </div>
      </div>
    </div>

    <!-- Official Press ID Card Display -->
    <div style="margin-bottom:32px;">
      <h3 style="font-size:1.05rem; font-weight:700; color:var(--text-muted); margin-bottom:14px; text-transform:uppercase; letter-spacing:0.8px; text-align:center;">
        Official Digital Press Card
      </h3>
      ${renderPressCardHtml(app)}
    </div>

    <!-- Detailed Identity & Police Verification Sheet -->
    <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:12px; padding:24px 28px; margin-bottom:28px;">
      <h3 style="font-size:1.1rem; font-weight:800; color:var(--text-main); border-bottom:1px solid var(--border-color); padding-bottom:10px; margin-bottom:16px;">
        📋 Accreditation & Verification Details
      </h3>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; font-size:0.9rem;">
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; display:block;">Full Name</span>
          <strong style="color:var(--text-main); font-size:1rem;">${escapeHtml(app.full_name)}</strong>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; display:block;">Father's Name</span>
          <span style="color:var(--text-main); font-weight:600;">${escapeHtml(app.father_name)}</span>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; display:block;">Designation</span>
          <span class="badge badge-purple" style="font-size:0.8rem; font-weight:700;">
            ${escapeHtml(app.designation || 'Reporter')}
          </span>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; display:block;">Assigned District & State</span>
          <strong style="color:#facc15;">${escapeHtml(app.district)}, ${escapeHtml(app.state)}</strong>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; display:block;">Official Press ID Code</span>
          <code style="color:#38bdf8; font-weight:800; font-size:0.95rem;">${escapeHtml(app.press_id_code)}</code>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; display:block;">Verified Mobile Contact</span>
          <a href="tel:${escapeHtml(app.mobile_no)}" style="color:#22c55e; font-weight:700; text-decoration:none;">
            📞 ${escapeHtml(app.mobile_no)}
          </a>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; display:block;">Issue Date</span>
          <span style="color:var(--text-main);">${issueDateFormatted}</span>
        </div>

        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; display:block;">Validity Period</span>
          <strong style="color:#facc15;">Until ${expiryDateFormatted}</strong>
        </div>

        <div style="grid-column: 1 / -1; border-top:1px solid var(--border-color); padding-top:12px; margin-top:4px;">
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; display:block;">Residential Address on File</span>
          <span style="color:var(--text-main); line-height:1.5;">
            Vill/Town: ${escapeHtml(app.village_town)}, Post Office: ${escapeHtml(app.post_office)}, Police Station: ${escapeHtml(app.police_station)}, District: ${escapeHtml(app.district)}, State: ${escapeHtml(app.state)} - PIN: ${escapeHtml(app.pin_code)}
          </span>
        </div>
      </div>
    </div>

    <!-- Official Press Privileges Notice for Police & Public Authorities -->
    <div style="background:#090d15; border:1px solid rgba(220, 38, 38, 0.3); border-radius:10px; padding:20px; font-size:0.85rem; color:#94a3b8; line-height:1.6; margin-bottom:28px;">
      <strong style="color:#f87171; display:block; margin-bottom:6px; font-size:0.95rem;">
        🏛️ Notice for Civil Administration, Police & Public Authorities:
      </strong>
      The bearer of this credential, <strong>${escapeHtml(app.full_name)}</strong>, is an authorized and accredited news correspondent of <strong>ND30 LIVE</strong>. All civil and police authorities, public officials, and emergency personnel are respectfully requested to extend all customary courtesies and cooperation to allow unhindered journalistic coverage and news gathering.
      <br><br>
      For urgent institutional inquiries or newsroom verification, please contact the Chief Editor's desk at <a href="mailto:nd30team@gmail.com" style="color:#38bdf8;">nd30team@gmail.com</a>.
    </div>

    <!-- Print & Navigation Actions -->
    <div style="display:flex; justify-content:center; gap:14px; flex-wrap:wrap;">
      <button type="button" class="btn btn-secondary" onclick="window.print()" style="display:inline-flex; align-items:center; gap:6px;">
        <span>🖨️</span> Print / Save Press ID Card
      </button>
      <a href="/as/" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:6px;">
        <span>🌐</span> Visit ND30 LIVE News Portal
      </a>
    </div>
  </div>
  `;

  return renderLayout({
    title: `✓ Verified Press ID: ${app.full_name} (${app.press_id_code}) | ND30 LIVE`,
    description: `Official digital press verification for ND30 LIVE Field Reporter ${app.full_name}. Press ID: ${app.press_id_code}.`,
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

