/**
 * ND30 LIVE - "Advertise With Us" / Book Advertisement Modal Component
 * Supports ND30 Live official promotions and listed influencers.
 * Features: LocalStorage Autosave, conditional partner logic, dynamic charges,
 * WhatsApp OTP verification (optional via backend toggle), and strict terms gate.
 */

const {
  getActiveInfluencers,
  getActivePromotionTypes,
  getAdvertisementSettings
} = require('../services/advertisementService');

function renderAdvertisementModal(currentLang = 'as') {
  const influencers = getActiveInfluencers();
  const promotionTypes = getActivePromotionTypes();
  const settings = getAdvertisementSettings();

  return `
  <!-- Book Advertisement Modal Popup -->
  <div id="advertisementModal" class="ad-modal-overlay" aria-hidden="true" role="dialog" aria-labelledby="adModalTitle">
    <div class="ad-modal-backdrop"></div>
    <div class="ad-modal-dialog">
      <!-- Modal Header -->
      <div class="ad-modal-header">
        <div class="ad-header-brand">
          <img src="/images/nd30_live_logo.png" alt="ND30 LIVE" style="height:36px; max-width:120px; object-fit:contain; margin-right:8px;">
          <div>
            <h2 id="adModalTitle" class="ad-modal-title">Book Advertisement</h2>
            <p class="ad-modal-subtitle">
              Promote your business, shop, showroom, products or services through ND30 Live and our listed influencers.
            </p>
          </div>
        </div>
        <button type="button" id="closeAdModalBtn" class="ad-modal-close" aria-label="Close booking form">&times;</button>
      </div>

      <!-- Modal Body -->
      <div class="ad-modal-body">
        <!-- Autosave Draft Indicator -->
        <div class="ad-autosave-bar">
          <span class="ad-draft-status" id="adDraftStatus">
            <span class="ad-save-icon">💾</span> Form Autosave Active
          </span>
          <button type="button" id="adClearDraftBtn" class="ad-btn-text" title="Clear saved draft data">Clear Form</button>
        </div>

        <!-- Global Alert Box -->
        <div id="adGlobalAlert" class="ad-alert" style="display:none;"></div>

        <!-- Booking Form -->
        <form id="adBookingForm" novalidate>

          <!-- 1. Select Promotion Partner -->
          <div class="ad-form-section">
            <h3 class="ad-section-title">
              <span class="ad-step-num">1</span> Select Promotion Partner
            </h3>
            <p class="ad-section-hint">Choose whether you want official ND30 LIVE media coverage or direct influencer promotion.</p>

            <div class="ad-partner-selector">
              <label class="ad-partner-card active" id="partnerCardNd30">
                <input type="radio" name="partnerType" value="nd30" checked onchange="handlePartnerChange('nd30')">
                <div class="ad-partner-content">
                  <div class="ad-partner-icon">📺</div>
                  <div class="ad-partner-info">
                    <strong>ND30 Live Official</strong>
                    <span>Broadcast on ND30 LIVE news channels, web portal & digital feeds</span>
                  </div>
                </div>
              </label>

              <label class="ad-partner-card" id="partnerCardInfluencer">
                <input type="radio" name="partnerType" value="influencer" onchange="handlePartnerChange('influencer')">
                <div class="ad-partner-content">
                  <div class="ad-partner-icon">🌟</div>
                  <div class="ad-partner-info">
                    <strong>Other Listed Influencer</strong>
                    <span>Collaborate directly with Assam's top verified digital influencers</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- 2. Select Promotion Type & Dynamic Charges -->
          <div class="ad-form-section" id="promotionTypeSection">
            <h3 class="ad-section-title">
              <span class="ad-step-num">2</span> Select Promotion Type
            </h3>

            <!-- ND30 Live Promotion Types (Shown when ND30 is selected) -->
            <div id="nd30PromoTypeContainer">
              <div class="form-group">
                <label class="ad-label" for="adNd30PromoSelect">Promotion Type *</label>
                <select id="adNd30PromoSelect" name="nd30PromotionType" class="ad-form-control" onchange="handlePromoTypeChange()">
                  ${promotionTypes.map(pt => `
                    <option value="${pt.title}" data-charge="${pt.charge}">
                      ${pt.title} — ₹${Number(pt.charge).toLocaleString('en-IN')}
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Influencer Selector (Shown when Influencer is selected) -->
            <div id="influencerSelectorContainer" style="display:none;">
              <div class="form-group">
                <label class="ad-label" for="adInfluencerSelect">Select Registered Influencer *</label>
                <select id="adInfluencerSelect" name="influencerId" class="ad-form-control" onchange="handleInfluencerChange()">
                  <option value="" disabled selected>-- Choose an Influencer --</option>
                  ${influencers.map(inf => `
                    <option value="${inf.id}" data-charge="${inf.charge}" data-platform="${inf.platform}" data-followers="${inf.followers}" data-niche="${inf.niche}" data-name="${inf.name}">
                      ${inf.name} (${inf.platform} • ${inf.followers}) — ₹${Number(inf.charge).toLocaleString('en-IN')}
                    </option>
                  `).join('')}
                </select>
                <span class="ad-sub-note">Note: For influencers, promotion is fixed to <strong>Promotion Video</strong> format.</span>
              </div>
            </div>

            <!-- Estimated Charges Live Pill -->
            <div class="ad-charges-pill" id="adChargesDisplay">
              <div class="ad-charges-label">Estimated Promotion Charge:</div>
              <div class="ad-charges-amount" id="adChargesAmount">₹5,000</div>
              <div class="ad-charges-desc" id="adChargesDesc">Official ND30 LIVE broadcast fee</div>
            </div>
          </div>

          <!-- 3. Contact Information -->
          <div class="ad-form-section">
            <h3 class="ad-section-title">
              <span class="ad-step-num">3</span> Contact Information
            </h3>

            <div class="ad-grid-2">
              <div class="form-group">
                <label class="ad-label" for="adContactPerson">Contact Person Name *</label>
                <input type="text" id="adContactPerson" name="contactName" class="ad-form-control" placeholder="Full Name" required>
              </div>

              <div class="form-group">
                <label class="ad-label" for="adEmail">Email ID *</label>
                <input type="email" id="adEmail" name="email" class="ad-form-control" placeholder="contact@example.com" required>
              </div>
            </div>

            <!-- Mobile Number with Optional WhatsApp OTP Verification -->
            <div class="form-group" style="margin-top:12px;">
              <label class="ad-label" for="adMobile">Mobile Number *</label>
              <div class="ad-mobile-wrap">
                <div class="ad-phone-prefix">+91</div>
                <input type="tel" id="adMobile" name="mobileNumber" class="ad-form-control" placeholder="10-digit mobile number" maxlength="10" required>
                ${settings.whatsapp_otp_enabled ? `
                <button type="button" id="adSendOtpBtn" class="ad-btn-verify-otp" onclick="requestWhatsAppOtp()">
                  📲 Verify via WhatsApp
                </button>
                ` : ''}
              </div>
              <span class="ad-sub-note" id="adMobileHelpText">We will communicate advertisement booking updates to this number.</span>

              <!-- WhatsApp OTP Input Row (Visible only when WhatsApp OTP is ON and requested) -->
              <div id="adOtpVerifyRow" style="display:none; margin-top:10px;" class="ad-otp-box">
                <div style="font-size:0.82rem; color:#ffffff; margin-bottom:6px; font-weight:600;">
                  Enter 6-Digit WhatsApp OTP sent to your phone:
                </div>
                <div style="display:flex; gap:8px;">
                  <input type="text" id="adOtpCode" placeholder="6-digit code" maxlength="6" style="width:140px; text-align:center; letter-spacing:3px; font-weight:800; font-size:1.1rem; background:#0f172a; color:#ffffff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; padding:6px 10px;">
                  <button type="button" class="btn btn-primary" onclick="submitWhatsAppOtp()" style="padding:6px 16px; font-size:0.85rem;">Verify OTP</button>
                </div>
                <div id="adOtpAlert" style="font-size:0.78rem; margin-top:6px; color:#fca5a5;"></div>
              </div>

              <input type="hidden" id="adIsMobileVerified" name="isMobileVerified" value="${settings.whatsapp_otp_enabled ? '0' : '1'}">
              <input type="hidden" id="adOtpRequired" value="${settings.whatsapp_otp_enabled ? '1' : '0'}">
            </div>

            <div class="form-group" style="margin-top:12px;">
              <label class="ad-label" for="adBusinessName">Business / Shop Name *</label>
              <input type="text" id="adBusinessName" name="businessName" class="ad-form-control" placeholder="e.g. Assam Handloom Emporium, Royal Cafe, etc." required>
            </div>

            <div class="form-group" style="margin-top:12px;">
              <label class="ad-label" for="adBusinessDesc">Business Description (Optional)</label>
              <textarea id="adBusinessDesc" name="businessDesc" class="ad-form-control" rows="2" placeholder="Briefly describe your products, special offers, shop location, or target audience..."></textarea>
            </div>
          </div>

          <!-- 4. Business Address -->
          <div class="ad-form-section">
            <h3 class="ad-section-title">
              <span class="ad-step-num">4</span> Business Address
            </h3>

            <div class="ad-grid-2">
              <div class="form-group">
                <label class="ad-label" for="adVillageTown">Village / Town *</label>
                <input type="text" id="adVillageTown" name="villageTown" class="ad-form-control" placeholder="e.g. Fancy Bazar, Chapar, etc." required>
              </div>

              <div class="form-group">
                <label class="ad-label" for="adDistrict">District *</label>
                <input type="text" id="adDistrict" name="district" class="ad-form-control" placeholder="e.g. Kamrup Metro, Dhubri, etc." required>
              </div>
            </div>

            <div class="ad-grid-2" style="margin-top:12px;">
              <div class="form-group">
                <label class="ad-label" for="adState">State *</label>
                <input type="text" id="adState" name="state" class="ad-form-control" value="Assam" required>
              </div>

              <div class="form-group">
                <label class="ad-label" for="adPincode">PIN Code *</label>
                <input type="text" id="adPincode" name="pincode" class="ad-form-control" placeholder="6-digit PIN" maxlength="6" pattern="[0-9]{6}" required>
              </div>
            </div>
          </div>

          <!-- 5. Terms & Conditions -->
          <div class="ad-form-section">
            <h3 class="ad-section-title">
              <span class="ad-step-num">5</span> Terms & Conditions
            </h3>

            <div class="ad-terms-box">
              <h4 class="ad-terms-header">Terms & Conditions – Advertisement Booking</h4>
              <ol class="ad-terms-list">
                <li>All information provided must be accurate and genuine.</li>
                <li>Advertisers must ensure that their promotional content does not violate any applicable law, copyright, or third-party rights.</li>
                <li>ND30 Live reserves the right to review, edit, reject, or refuse any advertisement.</li>
                <li>Advertisement publication and delivery are subject to confirmation, applicable charges, and agreed terms.</li>
                <li>ND30 Live is not responsible for false claims or inaccurate business information supplied by advertisers.</li>
                <li>Submission of this form does not guarantee advertisement approval or publication.</li>
                <li>By submitting this form, you authorize the selected promotion partner to contact you regarding your advertisement booking.</li>
              </ol>
            </div>

            <div class="ad-terms-checkbox-wrap">
              <label class="ad-checkbox-label">
                <input type="checkbox" id="adTermsCheckbox" onchange="handleTermsToggle(this.checked)">
                <span class="ad-checkbox-custom"></span>
                <span class="ad-checkbox-text">
                  I have read and agree to the above Terms & Conditions. *
                </span>
              </label>
            </div>
          </div>

          <!-- Modal Action Bar -->
          <div class="ad-modal-footer">
            <button type="button" id="adCancelBtn" class="btn btn-secondary">Cancel</button>
            <button type="submit" id="adSubmitBtn" class="ad-btn-submit" disabled>
              <span class="ad-btn-icon">🚀</span> Submit Advertisement Request
            </button>
          </div>

        </form>

        <!-- Success Confirmation View (Shown upon successful booking submission) -->
        <div id="adSuccessView" class="ad-success-container" style="display:none;">
          <div class="ad-success-badge">✅</div>
          <h3 class="ad-success-title">Advertisement Request Submitted!</h3>
          <p class="ad-success-subtitle">
            Your booking request has been registered in our editorial desk.
          </p>

          <div class="ad-booking-card-preview">
            <div class="ad-booking-card-header">
              <span>BOOKING REFERENCE ID</span>
              <strong id="adSuccessBookingId" class="ad-success-ref">ND30-AD-202611-1001</strong>
            </div>

            <div class="ad-booking-summary-grid">
              <div>
                <span class="lbl">Business Name:</span>
                <strong id="adSuccessBusinessName">-</strong>
              </div>
              <div>
                <span class="lbl">Promotion Partner:</span>
                <strong id="adSuccessPartner">-</strong>
              </div>
              <div>
                <span class="lbl">Promotion Format:</span>
                <strong id="adSuccessType">-</strong>
              </div>
              <div>
                <span class="lbl">Estimated Charge:</span>
                <strong id="adSuccessCharge" style="color:#22c55e;">-</strong>
              </div>
            </div>

            <div class="ad-next-steps">
              <strong>📞 Next Steps:</strong>
              <p>Our business representative will contact you via WhatsApp / Phone to confirm media assets, delivery schedule, and billing formalities.</p>
            </div>
          </div>

          <button type="button" id="adFinishBtn" class="btn btn-primary" style="margin-top:18px; padding:10px 24px;">
            Done & Close
          </button>
        </div>

      </div>
    </div>
  </div>
  `;
}

module.exports = {
  renderAdvertisementModal
};

