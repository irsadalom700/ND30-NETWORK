/**
 * ND30 LIVE - "Join as a Reporter" Client Controller
 * Handles interactive pop-up modal, strict < 1 MB file validation,
 * instant warning banners, and submission to nd30team@gmail.com
 */

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('reporterModal');
  const closeBtn = document.getElementById('closeReporterModalBtn');
  const cancelBtn = document.getElementById('cancelReporterModalBtn');
  const finishBtn = document.getElementById('finishReporterModalBtn');
  const form = document.getElementById('reporterApplicationForm');
  const submitBtn = document.getElementById('submitReporterBtn');
  const globalAlert = document.getElementById('reporterGlobalAlert');
  const successView = document.getElementById('reporterSuccessView');

  // Trigger buttons (menu tabs, top bar pill, and nav CTA)
  const openButtons = [
    document.getElementById('openReporterModalBtn'),
    document.getElementById('topBarReporterBtn'),
    document.getElementById('categoryNavReporterBtn'),
    document.getElementById('navActionsReporterBtn')
  ].filter(Boolean);

  // Also catch any button with class .btn-open-reporter-modal
  document.querySelectorAll('.btn-open-reporter-modal').forEach(b => openButtons.push(b));

  function openReporterModal() {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    refreshReportingAreas(); // Fetch live areas from backend dynamically
  }

  function closeReporterModal() {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openReporterModal();
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeReporterModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeReporterModal);
  if (finishBtn) finishBtn.addEventListener('click', () => {
    closeReporterModal();
    // Reset view after closing
    setTimeout(() => {
      if (form) {
        form.reset();
        form.style.display = 'block';
      }
      if (typeof updateTermsState === 'function') {
        const tcb = document.getElementById('termsAgreement');
        if (tcb) tcb.checked = false;
        updateTermsState();
      }
      if (successView) successView.style.display = 'none';
      if (globalAlert) globalAlert.style.display = 'none';
      document.querySelectorAll('.doc-status').forEach(s => s.textContent = 'No file chosen');
    }, 400);
  });

  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('reporter-modal-backdrop') || e.target === modal) {
        closeReporterModal();
      }
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeReporterModal();
    }
  });

  // ========================================================
  // JOIN AS & REPORTING AREA DYNAMIC WARNINGS (ROLE & AREA WISE)
  // ========================================================
  const areaSelect = document.getElementById('repArea');
  const joinAsSelect = document.getElementById('repJoinAs');
  const areaWarning = document.getElementById('areaOccupiedWarning');
  const warningAreaName = document.getElementById('warningAreaName');
  const warningRoleName = document.getElementById('warningRoleName');
  const warningRoleSub = document.getElementById('warningRoleSub');
  const availableRolesList = document.getElementById('availableRolesList');

  const ALL_ROLES = ['Reporter', 'Camera Person', 'Photographer', 'Editor', 'Voice-Over'];

  function checkAreaOccupied() {
    if (!areaSelect || !areaWarning) return;
    const selectedOption = areaSelect.options[areaSelect.selectedIndex];
    const selectedArea = areaSelect.value;
    const selectedRole = joinAsSelect ? joinAsSelect.value : '';

    if (!selectedOption || !selectedArea || !selectedRole) {
      areaWarning.style.display = 'none';
      return;
    }

    const occupiedRolesAttr = selectedOption.getAttribute('data-occupied-roles') || '';
    const occupiedRoles = occupiedRolesAttr ? occupiedRolesAttr.split(',').map(s => s.trim().toLowerCase()) : [];

    // Check if the SPECIFIC chosen role is already occupied in this area
    const isRoleOccupied = occupiedRoles.includes(selectedRole.toLowerCase());

    if (isRoleOccupied) {
      if (warningAreaName) warningAreaName.textContent = selectedArea;
      if (warningRoleName) warningRoleName.textContent = selectedRole;
      if (warningRoleSub) warningRoleSub.textContent = selectedRole;

      if (availableRolesList) {
        const remaining = ALL_ROLES.filter(r => !occupiedRoles.includes(r.toLowerCase()));
        availableRolesList.textContent = remaining.length > 0 ? remaining.join(', ') : 'other media departments';
      }

      areaWarning.style.display = 'block';
    } else {
      // Role is completely available and applicable in this area!
      areaWarning.style.display = 'none';
    }
  }

  if (areaSelect) {
    areaSelect.addEventListener('change', checkAreaOccupied);
  }
  if (joinAsSelect) {
    joinAsSelect.addEventListener('change', checkAreaOccupied);
  }

  async function refreshReportingAreas() {
    if (!areaSelect) return;
    try {
      const res = await fetch('/api/reporting-areas');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.areas)) {
        const currentValue = areaSelect.value;
        const occupiedMap = data.occupiedRolesMap || {};
        
        let html = '<option value="" disabled' + (!currentValue ? ' selected' : '') + '>-- Select Reporting Area (A to Z) --</option>';
        data.areas.forEach(areaName => {
          const roles = occupiedMap[areaName.trim().toLowerCase()] || [];
          const rolesAttr = roles.join(',');
          const rolesLabel = roles.length > 0 ? ` (${roles.join(', ')} Appointed)` : '';
          const isSelected = currentValue === areaName ? ' selected' : '';
          html += `<option value="${escapeHtml(areaName)}" data-occupied-roles="${escapeHtml(rolesAttr)}"${isSelected}>${escapeHtml(areaName)}${escapeHtml(rolesLabel)}</option>`;
        });
        areaSelect.innerHTML = html;
        checkAreaOccupied();
      }
    } catch (e) {
      // Graceful fallback to pre-rendered options
    }
  }

  // ========================================================
  // TERMS & CONDITIONS DECLARATION HANDLER
  // ========================================================
  const termsCheckbox = document.getElementById('termsAgreement');
  const declarationBox = document.getElementById('declarationBox');

  function updateTermsState() {
    if (!termsCheckbox || !submitBtn) return;
    const isChecked = termsCheckbox.checked;
    submitBtn.disabled = !isChecked;
    if (declarationBox) {
      if (isChecked) {
        declarationBox.classList.add('is-agreed');
      } else {
        declarationBox.classList.remove('is-agreed');
      }
    }
  }

  if (termsCheckbox) {
    termsCheckbox.addEventListener('change', updateTermsState);
    updateTermsState();
  }

  // ========================================================
  // FILE SIZE VALIDATION: STRICTLY UNDER 1 MB (1048576 BYTES)
  // ========================================================
  const MAX_FILE_SIZE = 1024 * 1024; // 1 MB

  const fileInputs = document.querySelectorAll('.reporter-file-input');
  fileInputs.forEach(input => {
    input.addEventListener('change', () => {
      const file = input.files[0];
      const statusEl = document.getElementById(`status-${input.id}`);
      const errEl = document.getElementById(`err-${input.id}`);

      // Clear previous error states
      if (errEl) errEl.textContent = '';
      input.classList.remove('input-has-error');
      if (globalAlert) globalAlert.style.display = 'none';

      if (!file) {
        if (statusEl) statusEl.textContent = 'No file chosen';
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        const warningMessage = `⚠️ Warning: "${file.name}" is ${sizeMb} MB. Every uploaded file must be strictly below 1 MB. Please compress or select a smaller file.`;

        // 1. Show warning under this specific input
        if (errEl) {
          errEl.textContent = warningMessage;
          errEl.style.display = 'block';
        }

        // 2. Show prominent global warning alert banner
        if (globalAlert) {
          globalAlert.className = 'reporter-alert reporter-alert-warning';
          globalAlert.innerHTML = `<strong>⚠️ File Size Exceeded (Above 1 MB):</strong> "${escapeHtml(file.name)}" is <strong>${sizeMb} MB</strong>. All uploaded documents must be below 1 MB. This file has been rejected. Please choose a file under 1 MB.`;
          globalAlert.style.display = 'block';
          globalAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // 3. Mark input error and reset value
        input.classList.add('input-has-error');
        input.value = ''; // Reset file input
        if (statusEl) {
          statusEl.textContent = '❌ Rejected: File exceeded 1 MB limit';
          statusEl.style.color = '#ef4444';
        }
        return;
      }

      // File is valid (< 1 MB)
      const sizeKb = (file.size / 1024).toFixed(1);
      if (statusEl) {
        statusEl.innerHTML = `✅ <strong style="color:#22c55e;">${escapeHtml(file.name)}</strong> (${sizeKb} KB - Valid)`;
        statusEl.style.color = '#22c55e';
      }
    });
  });

  // ========================================================
  // FORM SUBMISSION TO /api/reporter/apply
  // ========================================================
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (globalAlert) globalAlert.style.display = 'none';

      // 1. Validate required fields
      const joinAs = document.getElementById('repJoinAs')?.value;
      const area = document.getElementById('repArea')?.value;
      const name = document.getElementById('repName')?.value.trim();
      const fatherName = document.getElementById('repFatherName')?.value.trim();
      const mobileNo = document.getElementById('repMobile')?.value.trim();
      const email = document.getElementById('repEmail')?.value.trim();
      const district = document.getElementById('repDistrict')?.value.trim();
      const state = document.getElementById('repState')?.value.trim();
      const education = document.getElementById('repEducation')?.value;

      if (!joinAs) {
        showGlobalAlert('Please select the role you are applying for in "Join as" (Reporter, Camera Person, Photographer, Editor, or Voice-Over).', 'error');
        document.getElementById('repJoinAs')?.focus();
        return;
      }

      if (!area) {
        showGlobalAlert('Please choose your target Reporting Area from the dropdown list.', 'error');
        document.getElementById('repArea')?.focus();
        return;
      }

      if (!name || !fatherName || !mobileNo || !email || !district || !education) {
        showGlobalAlert('Please fill in all mandatory fields marked with an asterisk (*).', 'error');
        return;
      }

      if (!/^\d{10}$/.test(mobileNo)) {
        showGlobalAlert('Please enter a valid 10-digit mobile number.', 'error');
        document.getElementById('repMobile')?.focus();
        return;
      }

      // 2. Validate required documents
      const adharInput = document.getElementById('docAdhar');
      const eduCertInput = document.getElementById('docEduCert');
      const photoInput = document.getElementById('docPhoto');
      const biodataInput = document.getElementById('docBiodata');

      if (!adharInput?.files[0]) {
        showGlobalAlert('Please upload your Aadhar Card document (under 1 MB).', 'error');
        adharInput?.focus();
        return;
      }
      if (!eduCertInput?.files[0]) {
        showGlobalAlert('Please upload your Education Certificate (under 1 MB).', 'error');
        eduCertInput?.focus();
        return;
      }
      if (!photoInput?.files[0]) {
        showGlobalAlert('Please upload your Passport Size Photo (under 1 MB).', 'error');
        photoInput?.focus();
        return;
      }
      if (!biodataInput?.files[0]) {
        showGlobalAlert('Please upload your Biodata / Resume (under 1 MB).', 'error');
        biodataInput?.focus();
        return;
      }

      // Final client-side check on all attached files
      let oversizedFileFound = false;
      fileInputs.forEach(input => {
        const f = input.files[0];
        if (f && f.size > MAX_FILE_SIZE) {
          oversizedFileFound = true;
          const sizeMb = (f.size / (1024 * 1024)).toFixed(2);
          showGlobalAlert(`⚠️ File "${f.name}" is ${sizeMb} MB. Every uploaded file must be strictly below 1 MB.`, 'warning');
        }
      });
      if (oversizedFileFound) return;

      // 3. Strict Verification of Terms & Conditions Declaration
      if (!termsCheckbox || !termsCheckbox.checked) {
        showGlobalAlert('⚠️ Submission Blocked: You must read and tick the Terms & Conditions Declaration to submit your application.', 'warning');
        if (declarationBox) declarationBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        termsCheckbox?.focus();
        return;
      }

      // 3. Prepare FormData for multipart upload
      const formData = new FormData(form);

      // Disable button and show spinner
      submitBtn.disabled = true;
      const originalSubmitHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = `
        <span class="reporter-spinner"></span>
        Submitting Application & Documents...
      `;

      try {
        const response = await fetch('/api/reporter/apply', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          // Populate success view
          const nameEl = document.getElementById('successApplicantName');
          if (nameEl) nameEl.textContent = name;
          const roleEl = document.getElementById('successApplicantRole');
          if (roleEl) roleEl.textContent = joinAs;
          const areaEl = document.getElementById('successApplicantArea');
          if (areaEl) areaEl.textContent = area;
          const roleDisp = document.getElementById('successApplicantRoleDisplay');
          if (roleDisp) roleDisp.textContent = joinAs;
          const areaDisp = document.getElementById('successApplicantAreaDisplay');
          if (areaDisp) areaDisp.textContent = `${area} (${district}, ${state})`;
          const phoneEl = document.getElementById('successApplicantPhone');
          if (phoneEl) phoneEl.textContent = mobileNo;
          const emailEl = document.getElementById('successApplicantEmail');
          if (emailEl) emailEl.textContent = email;

          // Switch from form to success confirmation
          form.style.display = 'none';
          if (successView) {
            successView.style.display = 'block';
            successView.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          showGlobalAlert(result.error || 'Failed to submit application. Please check your files and try again.', 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalSubmitHtml;
        }
      } catch (err) {
        showGlobalAlert('Network error occurred while submitting: ' + err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalSubmitHtml;
      }
    });
  }

  function showGlobalAlert(message, type = 'error') {
    if (!globalAlert) return;
    globalAlert.className = `reporter-alert reporter-alert-${type}`;
    globalAlert.innerHTML = message;
    globalAlert.style.display = 'block';
    globalAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
});

