/**
 * ND30 LIVE - "Join us" Modal Popup Component
 * Roles: Reporter, Camera Person, Photographer, Editor, Voice-Over
 * Alphabetical Reporting Areas with dynamic backend integration & occupied territory warnings
 */

const { db } = require('../database/db');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderReporterModal(currentLang = 'as') {
  // Query active reporting areas ordered A to Z
  let areas = [];
  const areaOccupiedRolesMap = {};

  try {
    const areaRows = db.prepare('SELECT name FROM reporting_areas WHERE is_active = 1 ORDER BY name COLLATE NOCASE ASC').all();
    areas = areaRows.map(r => r.name);

    // Identify occupied roles per area (where an approved role already exists)
    const occupiedRows = db.prepare(`
      SELECT DISTINCT area, COALESCE(join_as, designation, 'Reporter') as role 
      FROM reporter_applications 
      WHERE status = 'approved' AND area IS NOT NULL AND area != ''
    `).all();

    occupiedRows.forEach(r => {
      const key = r.area.trim().toLowerCase();
      if (!areaOccupiedRolesMap[key]) {
        areaOccupiedRolesMap[key] = [];
      }
      if (!areaOccupiedRolesMap[key].includes(r.role)) {
        areaOccupiedRolesMap[key].push(r.role);
      }
    });
  } catch (err) {
    console.error('[Reporter Modal] Error fetching reporting areas:', err.message);
  }

  return `
  <!-- Join us Modal Popup -->
  <div id="reporterModal" class="reporter-modal-overlay" aria-hidden="true" role="dialog" aria-labelledby="reporterModalTitle">
    <div class="reporter-modal-backdrop"></div>
    <div class="reporter-modal-dialog">
      <!-- Modal Header -->
      <div class="reporter-modal-header">
        <div class="reporter-header-brand">
          <img src="/images/nd30_live_logo.png" alt="ND30 LIVE" style="height:38px; max-width:120px; object-fit:contain; margin-right:6px;">
          <div>
            <h2 id="reporterModalTitle" class="reporter-modal-title">Join us</h2>
            <p class="reporter-modal-subtitle">
              ${currentLang === 'as' 
                ? 'ND30 LIVEৰ সৈতে ৰিপৰ্টাৰ, কেমেৰা পাৰ্চন, ফটোগ্ৰাফাৰ, এডিটোৰ বা ভয়েচ-অভাৰ হিচাপে যোগদান কৰক' 
                : (currentLang === 'hi' 
                  ? 'ND30 LIVE के साथ रिपोर्टर, कैमरा पर्सन, फ़ोटोग्राफ़र, एडिटर या वॉइस-ओवर के रूप में जुड़ें' 
                  : 'Join ND30 LIVE as a Reporter, Camera Person, Photographer, Editor, or Voice-Over')}
            </p>
          </div>
        </div>
        <button type="button" id="closeReporterModalBtn" class="reporter-modal-close" aria-label="Close form">&times;</button>
      </div>

      <!-- Modal Body -->
      <div class="reporter-modal-body">
        <!-- Live Alert Banner (for file errors or submission notices) -->
        <div id="reporterGlobalAlert" class="reporter-alert" style="display:none;"></div>

        <!-- Submission Form -->
        <form id="reporterApplicationForm" enctype="multipart/form-data" novalidate>
          <div class="reporter-form-intro">
            <span>📰 Official Newsroom Recruitment</span>
            <p>
              Fill out the details below along with your verified credentials. All submissions are dispatched directly to our official newsroom desk: <strong>nd30team@gmail.com</strong>.
            </p>
          </div>

          <!-- Section 1: Designation & Reporting Area -->
          <div class="reporter-form-section">
            <h3 class="reporter-section-title">
              <span>1</span> Designation & Reporting Area
            </h3>
            
            <div class="reporter-grid-2">
              <div class="form-group">
                <label class="form-label" for="repJoinAs">Join as *</label>
                <select id="repJoinAs" name="joinAs" class="form-control" required>
                  <option value="" disabled selected>-- Select Your Role --</option>
                  <option value="Reporter">Reporter</option>
                  <option value="Camera Person">Camera Person</option>
                  <option value="Photographer">Photographer</option>
                  <option value="Editor">Editor</option>
                  <option value="Voice-Over">Voice-Over</option>
                </select>
                <span class="field-hint">One role per applicant (Choose Reporter, Camera Person, Photographer, Editor, or Voice-Over)</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="repArea">Area *</label>
                <select id="repArea" name="area" class="form-control" required>
                  <option value="" disabled selected>-- Select Reporting Area (A to Z) --</option>
                  ${areas.map(a => {
                    const roles = areaOccupiedRolesMap[a.trim().toLowerCase()] || [];
                    const rolesAttr = roles.join(',');
                    const rolesLabel = roles.length > 0 ? ` (${roles.join(', ')} Appointed)` : '';
                    return `<option value="${escapeHtml(a)}" data-occupied-roles="${escapeHtml(rolesAttr)}">${escapeHtml(a)}${escapeHtml(rolesLabel)}</option>`;
                  }).join('')}
                </select>
                <span class="field-hint">Choose your assigned local reporting jurisdiction</span>
              </div>
            </div>

            <!-- Live Warning: Triggered when selecting an already occupied area & role -->
            <div id="areaOccupiedWarning" class="reporter-area-warning" style="display:none;">
              <div class="area-warning-content">
                <span class="warning-icon">⚠️</span>
                <div>
                  <strong style="color:#fecaca; font-size:0.95rem;">
                    We have already a <span id="warningRoleName">Reporter</span> in this area
                  </strong>
                  <p style="margin:4px 0 0 0; font-size:0.82rem; color:#fed7aa; line-height:1.4;">
                    An accredited <strong id="warningRoleSub">Reporter</strong> is currently appointed in <strong id="warningAreaName"></strong>. However, other roles (<span id="availableRolesList">Camera Person, Photographer, Editor, Voice-Over</span>) are open and applicable in this area.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Personal Details -->
          <div class="reporter-form-section">
            <h3 class="reporter-section-title">
              <span>2</span> Personal Details
            </h3>
            
            <div class="reporter-grid-2">
              <div class="form-group">
                <label class="form-label" for="repName">Full Name *</label>
                <input type="text" id="repName" name="name" class="form-control" placeholder="Enter your full name" required>
              </div>

              <div class="form-group">
                <label class="form-label" for="repFatherName">Father's Name *</label>
                <input type="text" id="repFatherName" name="fatherName" class="form-control" placeholder="Enter father's full name" required>
              </div>
            </div>

            <div class="reporter-grid-2">
              <div class="form-group">
                <label class="form-label" for="repMobile">Mobile Number *</label>
                <input type="tel" id="repMobile" name="mobileNo" class="form-control" placeholder="10-digit mobile number" pattern="[0-9]{10}" maxlength="10" required>
                <span class="field-hint">Primary WhatsApp / Call contact number</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="repEmail">Email Address *</label>
                <input type="email" id="repEmail" name="email" class="form-control" placeholder="your.email@gmail.com" required>
                <span class="field-hint">For credential verification and appointment letters</span>
              </div>
            </div>
          </div>

          <!-- Section 3: Full Residential Address -->
          <div class="reporter-form-section">
            <h3 class="reporter-section-title">
              <span>3</span> Full Residential Address
            </h3>

            <div class="reporter-grid-2">
              <div class="form-group">
                <label class="form-label" for="repVillageTown">Village / Town (Vill/Town) *</label>
                <input type="text" id="repVillageTown" name="villageTown" class="form-control" placeholder="e.g. Bilasipara / Dispur" required>
              </div>

              <div class="form-group">
                <label class="form-label" for="repPostOffice">Post Office (PO) *</label>
                <input type="text" id="repPostOffice" name="postOffice" class="form-control" placeholder="Post Office name" required>
              </div>
            </div>

            <div class="reporter-grid-2">
              <div class="form-group">
                <label class="form-label" for="repPoliceStation">Police Station (PS) *</label>
                <input type="text" id="repPoliceStation" name="policeStation" class="form-control" placeholder="Police Station name" required>
              </div>

              <div class="form-group">
                <label class="form-label" for="repDistrict">District (Dist) *</label>
                <input type="text" id="repDistrict" name="district" class="form-control" placeholder="e.g. Dhubri, Kokrajhar, Bongaigaon, Barpeta, etc." required>
              </div>
            </div>

            <div class="reporter-grid-2">
              <div class="form-group">
                <label class="form-label" for="repState">State *</label>
                <input type="text" id="repState" name="state" class="form-control" value="Assam" required>
              </div>

              <div class="form-group">
                <label class="form-label" for="repPinCode">PIN Code *</label>
                <input type="text" id="repPinCode" name="pinCode" class="form-control" placeholder="6-digit PIN code" pattern="[0-9]{6}" maxlength="6" required>
              </div>
            </div>
          </div>

          <!-- Section 4: Educational Qualification & Experience -->
          <div class="reporter-form-section">
            <h3 class="reporter-section-title">
              <span>4</span> Educational Qualification & Experience
            </h3>

            <div class="reporter-grid-2">
              <div class="form-group">
                <label class="form-label" for="repEducation">Educational Qualification *</label>
                <select id="repEducation" name="education" class="form-control" required>
                  <option value="" disabled selected>-- Select Highest Qualification --</option>
                  <option value="Post Graduate">Post Graduate (Master's / PG Diploma)</option>
                  <option value="Graduate">Graduate (Bachelor's Degree)</option>
                  <option value="HS">HS (Higher Secondary / 10+2)</option>
                  <option value="HSLC">HSLC (10th / Matriculation)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="repPrevChannel">Previous Channel / Portal Name</label>
                <input type="text" id="repPrevChannel" name="previousChannel" class="form-control" placeholder="e.g. News Live, Pratidin Time, Local Portal, or 'Fresher'">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="repExperience">Journalism / Media Experience</label>
              <textarea id="repExperience" name="experience" class="form-control" rows="2" placeholder="Describe any previous reporting, video shooting, editing, voice-over or community news experience (or write 'Fresher')"></textarea>
            </div>
          </div>

          <!-- Section 5: Upload Documents (Max 1 MB Each) -->
          <div class="reporter-form-section">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
              <h3 class="reporter-section-title" style="margin:0;">
                <span>5</span> Upload Documents
              </h3>
              <span class="badge-size-limit">
                ⚠️ Strict Limit: Every file below 1 MB
              </span>
            </div>

            <div class="doc-upload-grid">
              <!-- 1. Aadhar Card -->
              <div class="doc-upload-card">
                <label class="doc-label" for="docAdhar">
                  <strong>🪪 Aadhar Card *</strong>
                  <span class="doc-types">PDF, JPG, PNG (&lt; 1 MB)</span>
                </label>
                <input type="file" id="docAdhar" name="adhar" class="reporter-file-input" accept=".jpg,.jpeg,.png,.pdf" required>
                <div class="doc-status" id="status-docAdhar">No file chosen</div>
                <div class="doc-error" id="err-docAdhar"></div>
              </div>

              <!-- 2. PAN Card -->
              <div class="doc-upload-card">
                <label class="doc-label" for="docPan">
                  <strong>💳 PAN Card</strong>
                  <span class="doc-types">PDF, JPG, PNG (&lt; 1 MB)</span>
                </label>
                <input type="file" id="docPan" name="pan" class="reporter-file-input" accept=".jpg,.jpeg,.png,.pdf">
                <div class="doc-status" id="status-docPan">No file chosen</div>
                <div class="doc-error" id="err-docPan"></div>
              </div>

              <!-- 3. Education Certificate -->
              <div class="doc-upload-card">
                <label class="doc-label" for="docEduCert">
                  <strong>🎓 Education Certificate *</strong>
                  <span class="doc-types">Highest mark sheet / cert (&lt; 1 MB)</span>
                </label>
                <input type="file" id="docEduCert" name="education_certificate" class="reporter-file-input" accept=".jpg,.jpeg,.png,.pdf" required>
                <div class="doc-status" id="status-docEduCert">No file chosen</div>
                <div class="doc-error" id="err-docEduCert"></div>
              </div>

              <!-- 4. Passport Photo -->
              <div class="doc-upload-card">
                <label class="doc-label" for="docPhoto">
                  <strong>📷 Passport Size Photo *</strong>
                  <span class="doc-types">JPG, PNG (&lt; 1 MB)</span>
                </label>
                <input type="file" id="docPhoto" name="photo" class="reporter-file-input" accept=".jpg,.jpeg,.png" required>
                <div class="doc-status" id="status-docPhoto">No file chosen</div>
                <div class="doc-error" id="err-docPhoto"></div>
              </div>

              <!-- 5. Biodata / Resume -->
              <div class="doc-upload-card" style="grid-column: 1 / -1;">
                <label class="doc-label" for="docBiodata">
                  <strong>📄 Biodata / CV *</strong>
                  <span class="doc-types">PDF, DOC, DOCX (&lt; 1 MB)</span>
                </label>
                <input type="file" id="docBiodata" name="biodata" class="reporter-file-input" accept=".pdf,.doc,.docx" required>
                <div class="doc-status" id="status-docBiodata">No file chosen</div>
                <div class="doc-error" id="err-docBiodata"></div>
              </div>
            </div>
          </div>

          <!-- Section 6: Terms & Conditions & Declaration -->
          <div class="reporter-form-section">
            <h3 class="reporter-section-title">
              <span>6</span> Terms &amp; Conditions &amp; Declaration
            </h3>

            <!-- Scrollable Terms & Conditions Box -->
            <div class="terms-conditions-container">
              <div class="terms-header">
                <span>📜</span> TERMS &amp; CONDITIONS – ND30 LIVE
              </div>
              <div class="terms-content">
                <ol class="terms-list">
                  <li>All applicants must provide correct personal information and valid identification documents.</li>
                  <li>Applicants must perform their assigned duties honestly, professionally, and responsibly while representing ND30 Live.</li>
                  <li>All news reports, photographs, videos, recordings, and other content submitted to ND30 Live must be genuine, accurate, and free from misleading or fabricated information.</li>
                  <li>Applicants must follow the editorial guidelines, instructions, and professional standards of ND30 Live.</li>
                  <li>No applicant shall misuse the ND30 Live name, logo, identity card, or official resources for personal or unauthorized purposes.</li>
                  <li>All submitted content and materials may be edited, published, broadcast, or shared by ND30 Live across its digital and social media platforms.</li>
                  <li>Applicants must maintain confidentiality of unpublished news, internal information, and official communications.</li>
                  <li>Any misconduct, fake reporting, copyright violation, or breach of professional ethics may result in suspension or termination of association.</li>
                  <li>Joining ND30 Live does not automatically guarantee a salary, payment, or permanent employment. Any remuneration or assignment-based payment will be subject to separate agreement.</li>
                  <li>ND30 Live reserves the right to accept, reject, suspend, or terminate any application or association in accordance with its policies.</li>
                </ol>
              </div>
            </div>

            <!-- Mandatory Declaration Checkbox -->
            <div class="declaration-box" id="declarationBox">
              <label class="declaration-label" for="termsAgreement">
                <input type="checkbox" id="termsAgreement" name="terms_agreement" value="agreed" class="terms-checkbox" required>
                <span class="declaration-text">
                  <strong style="color:#facc15; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px;">DECLARATION *</strong>
                  I hereby confirm that I have read and understood the above Terms &amp; Conditions and agree to follow the rules, responsibilities, and editorial policies of ND30 Live.
                </span>
              </label>
            </div>
          </div>

          <!-- Modal Footer with Submission -->
          <div class="reporter-modal-footer">
            <div class="footer-security-note">
              🔒 Sent to official newsroom desk: <strong>nd30team@gmail.com</strong>
            </div>
            <div style="display:flex; gap:12px; align-items:center;">
              <button type="button" class="btn btn-secondary" id="cancelReporterModalBtn">Cancel</button>
              <button type="submit" id="submitReporterBtn" class="btn btn-primary btn-submit-reporter" disabled title="Please tick the Terms &amp; Conditions declaration to enable submission">
                <span>🎙️</span> Submit Application
              </button>
            </div>
          </div>
        </form>

        <!-- Success View (Hidden until submit) -->
        <div id="reporterSuccessView" class="reporter-success-container" style="display:none;">
          <div class="success-icon-wrap">🎉</div>
          <h3 class="success-title">Application Submitted Successfully!</h3>
          <p class="success-message">
            Thank you, <strong id="successApplicantName"></strong>! Your application for <strong id="successApplicantRole" style="color:#facc15;"></strong> in <strong id="successApplicantArea" style="color:#38bdf8;"></strong> has been securely forwarded to our official editorial desk at <strong>nd30team@gmail.com</strong>.
          </p>
          <div class="success-card">
            <div>🎯 <strong>Applied Role:</strong> <span id="successApplicantRoleDisplay"></span></div>
            <div>📍 <strong>Reporting Area:</strong> <span id="successApplicantAreaDisplay"></span></div>
            <div>📞 <strong>Registered Contact:</strong> <span id="successApplicantPhone"></span></div>
            <div>✉️ <strong>Registered Email:</strong> <span id="successApplicantEmail"></span></div>
          </div>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:20px;">
            Our Editor-in-Chief & Recruitment Board will inspect your documents and contact you within 24–48 hours for your digital press credentials and press ID briefing.
          </p>
          <button type="button" class="btn btn-primary" id="finishReporterModalBtn" style="min-width:180px;">
            Done / Close Window
          </button>
        </div>
      </div>
    </div>
  </div>
  `;
}

module.exports = {
  renderReporterModal
};
