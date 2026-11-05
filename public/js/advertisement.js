/**
 * ND30 LIVE - "Advertise With Us" Client Controller
 * Handles interactive booking modal, LocalStorage Autosave,
 * Partner logic, dynamic pricing calculation, WhatsApp OTP, and AJAX submission.
 */

const AD_DRAFT_KEY = 'nd30_advertisement_booking_draft';

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('advertisementModal');
  const openBtn = document.getElementById('navAdvertiseBtn');
  const closeBtn = document.getElementById('closeAdModalBtn');
  const cancelBtn = document.getElementById('adCancelBtn');
  const finishBtn = document.getElementById('adFinishBtn');
  const form = document.getElementById('adBookingForm');
  const clearDraftBtn = document.getElementById('adClearDraftBtn');
  const draftStatus = document.getElementById('adDraftStatus');

  // Open modal
  function openAdModal() {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    restoreDraft();
    updateChargesDisplay();
  }

  // Close modal
  function closeAdModal() {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (openBtn) openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openAdModal();
  });

  document.querySelectorAll('.btn-open-advertisement-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openAdModal();
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeAdModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeAdModal);
  if (finishBtn) finishBtn.addEventListener('click', () => {
    closeAdModal();
    setTimeout(() => {
      if (form) {
        form.reset();
        form.style.display = 'block';
      }
      const successView = document.getElementById('adSuccessView');
      if (successView) successView.style.display = 'none';
      const termsBox = document.getElementById('adTermsCheckbox');
      if (termsBox) termsBox.checked = false;
      handleTermsToggle(false);
      handlePartnerChange('nd30');
    }, 400);
  });

  // Close on backdrop
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('ad-modal-backdrop') || e.target === modal) {
        closeAdModal();
      }
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeAdModal();
    }
  });

  // ========================================================
  // AUTOSAVE DRAFT IMPLEMENTATION (LocalStorage)
  // ========================================================
  function saveDraft() {
    if (!form) return;
    const partnerEl = form.querySelector('input[name="partnerType"]:checked');
    const draft = {
      partnerType: partnerEl ? partnerEl.value : 'nd30',
      nd30PromotionType: document.getElementById('adNd30PromoSelect')?.value || '',
      influencerId: document.getElementById('adInfluencerSelect')?.value || '',
      contactName: document.getElementById('adContactPerson')?.value || '',
      email: document.getElementById('adEmail')?.value || '',
      mobileNumber: document.getElementById('adMobile')?.value || '',
      businessName: document.getElementById('adBusinessName')?.value || '',
      businessDesc: document.getElementById('adBusinessDesc')?.value || '',
      villageTown: document.getElementById('adVillageTown')?.value || '',
      district: document.getElementById('adDistrict')?.value || '',
      state: document.getElementById('adState')?.value || 'Assam',
      pincode: document.getElementById('adPincode')?.value || '',
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(AD_DRAFT_KEY, JSON.stringify(draft));
      if (draftStatus) {
        draftStatus.innerHTML = '<span class="ad-save-icon">💾</span> Draft Autosaved';
      }
    } catch (e) {
      console.warn('[Autosave] Storage quota exceeded or disabled:', e);
    }
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(AD_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft) return;

      if (draft.partnerType) {
        const partnerRadio = form.querySelector(`input[name="partnerType"][value="${draft.partnerType}"]`);
        if (partnerRadio) {
          partnerRadio.checked = true;
          handlePartnerChange(draft.partnerType);
        }
      }

      if (draft.nd30PromotionType && document.getElementById('adNd30PromoSelect')) {
        document.getElementById('adNd30PromoSelect').value = draft.nd30PromotionType;
      }

      if (draft.influencerId && document.getElementById('adInfluencerSelect')) {
        document.getElementById('adInfluencerSelect').value = draft.influencerId;
      }

      if (draft.contactName) document.getElementById('adContactPerson').value = draft.contactName;
      if (draft.email) document.getElementById('adEmail').value = draft.email;
      if (draft.mobileNumber) document.getElementById('adMobile').value = draft.mobileNumber;
      if (draft.businessName) document.getElementById('adBusinessName').value = draft.businessName;
      if (draft.businessDesc) document.getElementById('adBusinessDesc').value = draft.businessDesc;
      if (draft.villageTown) document.getElementById('adVillageTown').value = draft.villageTown;
      if (draft.district) document.getElementById('adDistrict').value = draft.district;
      if (draft.state) document.getElementById('adState').value = draft.state;
      if (draft.pincode) document.getElementById('adPincode').value = draft.pincode;

      if (draftStatus) {
        draftStatus.innerHTML = '<span class="ad-save-icon">💾</span> Restored Saved Draft';
      }
    } catch (e) {
      console.warn('[Autosave] Error parsing draft:', e);
    }
  }

  // Clear draft
  if (clearDraftBtn) {
    clearDraftBtn.addEventListener('click', () => {
      if (confirm('Clear your saved draft and start fresh?')) {
        localStorage.removeItem(AD_DRAFT_KEY);
        if (form) form.reset();
        handlePartnerChange('nd30');
        if (draftStatus) draftStatus.innerHTML = '<span class="ad-save-icon">💾</span> Form Cleared';
        updateChargesDisplay();
      }
    });
  }

  // Attach autosave listener to all form inputs
  if (form) {
    let timeout = null;
    form.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(saveDraft, 400);
    });
    form.addEventListener('change', () => {
      clearTimeout(timeout);
      timeout = setTimeout(saveDraft, 100);
    });
  }

  // Form submit handler
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
});

// ========================================================
// PROMOTION PARTNER & TYPE SWITCHING
// ========================================================
window.handlePartnerChange = function(type) {
  const cardNd30 = document.getElementById('partnerCardNd30');
  const cardInfluencer = document.getElementById('partnerCardInfluencer');
  const nd30Container = document.getElementById('nd30PromoTypeContainer');
  const influencerContainer = document.getElementById('influencerSelectorContainer');

  if (type === 'influencer') {
    if (cardNd30) cardNd30.classList.remove('active');
    if (cardInfluencer) cardInfluencer.classList.add('active');
    if (nd30Container) nd30Container.style.display = 'none';
    if (influencerContainer) influencerContainer.style.display = 'block';
    handleInfluencerChange();
  } else {
    if (cardNd30) cardNd30.classList.add('active');
    if (cardInfluencer) cardInfluencer.classList.remove('active');
    if (nd30Container) nd30Container.style.display = 'block';
    if (influencerContainer) influencerContainer.style.display = 'none';
    handlePromoTypeChange();
  }
};

window.handlePromoTypeChange = function() {
  updateChargesDisplay();
};

window.handleInfluencerChange = function() {
  updateChargesDisplay();
};

// Update live charges display pill
function updateChargesDisplay() {
  const partnerEl = document.querySelector('input[name="partnerType"]:checked');
  const partner = partnerEl ? partnerEl.value : 'nd30';
  const amountEl = document.getElementById('adChargesAmount');
  const descEl = document.getElementById('adChargesDesc');

  if (!amountEl) return;

  if (partner === 'influencer') {
    const infSelect = document.getElementById('adInfluencerSelect');
    const selectedOption = infSelect ? infSelect.options[infSelect.selectedIndex] : null;

    if (selectedOption && selectedOption.value) {
      const charge = parseFloat(selectedOption.getAttribute('data-charge')) || 0;
      const platform = selectedOption.getAttribute('data-platform') || '';
      const name = selectedOption.getAttribute('data-name') || '';
      let followers = selectedOption.getAttribute('data-followers') || '';
      if (followers && !/follower|subscriber|sub/i.test(followers)) {
        const isYt = platform.toLowerCase().includes('youtube');
        followers = followers + ' ' + (isYt ? 'Subscribers' : 'Followers');
      }
      amountEl.innerText = '₹' + Number(charge).toLocaleString('en-IN');
      if (descEl) descEl.innerHTML = `Fixed <strong>Promotion Video</strong> charge for ${name} (${platform} • ${followers})`;
    } else {
      amountEl.innerText = 'Select Influencer';
      if (descEl) descEl.innerText = 'Promotion is fixed to Promotion Video format';
    }
  } else {
    // ND30 Live
    const promoSelect = document.getElementById('adNd30PromoSelect');
    const selectedOption = promoSelect ? promoSelect.options[promoSelect.selectedIndex] : null;

    if (selectedOption) {
      const charge = parseFloat(selectedOption.getAttribute('data-charge')) || 5000;
      const title = selectedOption.value || 'Promotion Video';
      amountEl.innerText = '₹' + Number(charge).toLocaleString('en-IN');
      if (descEl) descEl.innerHTML = `Official ND30 LIVE broadcast fee for <strong>${title}</strong>`;
    } else {
      amountEl.innerText = '₹5,000';
      if (descEl) descEl.innerText = 'Official ND30 LIVE broadcast fee';
    }
  }
}

// ========================================================
// TERMS & CONDITIONS GATE
// ========================================================
window.handleTermsToggle = function(checked) {
  const submitBtn = document.getElementById('adSubmitBtn');
  if (submitBtn) {
    submitBtn.disabled = !checked;
  }
};

// ========================================================
// OPTIONAL WHATSAPP OTP VERIFICATION
// ========================================================
window.requestWhatsAppOtp = async function() {
  const mobileInput = document.getElementById('adMobile');
  const mobile = mobileInput ? mobileInput.value.trim() : '';
  const otpRow = document.getElementById('adOtpVerifyRow');
  const otpAlert = document.getElementById('adOtpAlert');
  const sendBtn = document.getElementById('adSendOtpBtn');

  if (!mobile || mobile.length < 10) {
    alert('Please enter a valid 10-digit mobile number first.');
    if (mobileInput) mobileInput.focus();
    return;
  }

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerText = 'Sending OTP...';
  }

  try {
    const res = await fetch('/api/advertisements/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: mobile })
    });
    const data = await res.json();

    if (data.success) {
      if (otpRow) otpRow.style.display = 'block';
      if (otpAlert) {
        otpAlert.style.color = '#86efac';
        otpAlert.innerHTML = `OTP dispatched to WhatsApp on +91 ${mobile}.${data.devCode ? ` (Dev Demo Code: <strong>${data.devCode}</strong>)` : ''}`;
      }
      if (sendBtn) sendBtn.innerText = 'Resend OTP';
    } else {
      alert('Error sending OTP: ' + (data.error || 'Please try again.'));
      if (sendBtn) sendBtn.innerText = '📲 Verify via WhatsApp';
    }
  } catch (err) {
    alert('Failed to request OTP: ' + err.message);
    if (sendBtn) sendBtn.innerText = '📲 Verify via WhatsApp';
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
};

window.submitWhatsAppOtp = async function() {
  const mobile = document.getElementById('adMobile')?.value.trim();
  const otpCode = document.getElementById('adOtpCode')?.value.trim();
  const otpAlert = document.getElementById('adOtpAlert');
  const isVerifiedInput = document.getElementById('adIsMobileVerified');
  const mobileInput = document.getElementById('adMobile');
  const sendBtn = document.getElementById('adSendOtpBtn');

  if (!otpCode || otpCode.length !== 6) {
    if (otpAlert) {
      otpAlert.style.color = '#fca5a5';
      otpAlert.innerText = 'Please enter the 6-digit OTP code.';
    }
    return;
  }

  try {
    const res = await fetch('/api/advertisements/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: mobile, otp: otpCode })
    });
    const data = await res.json();

    if (data.success) {
      if (isVerifiedInput) isVerifiedInput.value = '1';
      if (mobileInput) mobileInput.readOnly = true;
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '✅ Mobile Verified';
        sendBtn.style.background = '#059669';
      }
      const otpRow = document.getElementById('adOtpVerifyRow');
      if (otpRow) otpRow.style.display = 'none';
      alert('Success! Your mobile number is verified for this advertisement booking.');
    } else {
      if (otpAlert) {
        otpAlert.style.color = '#fca5a5';
        otpAlert.innerText = data.error || 'Verification failed. Incorrect OTP.';
      }
    }
  } catch (err) {
    alert('Verification request failed: ' + err.message);
  }
};

// ========================================================
// FORM SUBMISSION (AJAX)
// ========================================================
async function handleFormSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('adBookingForm');
  const submitBtn = document.getElementById('adSubmitBtn');
  const globalAlert = document.getElementById('adGlobalAlert');
  const successView = document.getElementById('adSuccessView');

  // Basic validation
  const partnerEl = form.querySelector('input[name="partnerType"]:checked');
  const partnerType = partnerEl ? partnerEl.value : 'nd30';
  const contactName = document.getElementById('adContactPerson')?.value.trim();
  const email = document.getElementById('adEmail')?.value.trim();
  const mobileNumber = document.getElementById('adMobile')?.value.trim();
  const businessName = document.getElementById('adBusinessName')?.value.trim();
  const businessDesc = document.getElementById('adBusinessDesc')?.value.trim();
  const villageTown = document.getElementById('adVillageTown')?.value.trim();
  const district = document.getElementById('adDistrict')?.value.trim();
  const state = document.getElementById('adState')?.value.trim();
  const pincode = document.getElementById('adPincode')?.value.trim();
  const termsAgreed = document.getElementById('adTermsCheckbox')?.checked;
  const isMobileVerified = document.getElementById('adIsMobileVerified')?.value === '1';
  const otpRequired = document.getElementById('adOtpRequired')?.value === '1';

  let promotionType = 'Promotion Video';
  let influencerId = null;

  if (partnerType === 'influencer') {
    const infSelect = document.getElementById('adInfluencerSelect');
    influencerId = infSelect ? infSelect.value : null;
    if (!influencerId) {
      showError('Please select a registered influencer from the dropdown.');
      return;
    }
  } else {
    const promoSelect = document.getElementById('adNd30PromoSelect');
    promotionType = promoSelect ? promoSelect.value : 'Promotion Video';
  }

  if (!contactName || !email || !mobileNumber || !businessName) {
    showError('Please fill in all required contact information.');
    return;
  }

  if (!villageTown || !district || !state || !pincode) {
    showError('Please provide your complete business address.');
    return;
  }

  if (otpRequired && !isMobileVerified) {
    showError('Please verify your mobile number via WhatsApp OTP before submitting.');
    return;
  }

  if (!termsAgreed) {
    showError('You must agree to the Terms & Conditions before submitting.');
    return;
  }

  // Clear errors
  if (globalAlert) globalAlert.style.display = 'none';

  // Lock submit button
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span> Processing Booking...';
  }

  try {
    const res = await fetch('/api/advertisements/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerType,
        influencerId,
        promotionType,
        contactName,
        mobileNumber,
        isMobileVerified,
        email,
        businessName,
        businessDesc,
        villageTown,
        district,
        state,
        pincode
      })
    });

    const data = await res.json();

    if (data.success && data.booking) {
      // Clear draft
      localStorage.removeItem(AD_DRAFT_KEY);

      // Populate success card
      document.getElementById('adSuccessBookingId').innerText = data.booking.booking_id;
      document.getElementById('adSuccessBusinessName').innerText = data.booking.business_name;
      document.getElementById('adSuccessPartner').innerText = data.booking.partner_type === 'nd30' ? 'ND30 LIVE Official' : data.booking.influencer_name;
      document.getElementById('adSuccessType').innerText = data.booking.promotion_type;
      document.getElementById('adSuccessCharge').innerText = '₹' + Number(data.booking.estimated_charges || 0).toLocaleString('en-IN');

      // Swap views
      form.style.display = 'none';
      if (successView) successView.style.display = 'block';

      // Scroll modal to top
      const modalBody = document.querySelector('.ad-modal-body');
      if (modalBody) modalBody.scrollTop = 0;
    } else {
      showError(data.error || 'Unable to submit advertisement booking. Please try again.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="ad-btn-icon">🚀</span> Submit Advertisement Request';
      }
    }
  } catch (err) {
    showError('Server communication error: ' + err.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="ad-btn-icon">🚀</span> Submit Advertisement Request';
    }
  }
}

function showError(msg) {
  const globalAlert = document.getElementById('adGlobalAlert');
  if (globalAlert) {
    globalAlert.style.display = 'block';
    globalAlert.style.background = 'rgba(239, 68, 68, 0.15)';
    globalAlert.style.border = '1px solid rgba(239, 68, 68, 0.4)';
    globalAlert.style.color = '#fca5a5';
    globalAlert.style.padding = '10px 14px';
    globalAlert.style.borderRadius = '8px';
    globalAlert.style.marginBottom = '14px';
    globalAlert.style.fontSize = '0.82rem';
    globalAlert.innerText = '⚠️ ' + msg;
  } else {
    alert(msg);
  }
}

