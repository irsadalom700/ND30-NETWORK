/**
 * ND30 LIVE - Advertisement Bookings & Commercial Hub Admin View
 * Comprehensive management of advertiser requests, pricing, influencers,
 * WhatsApp OTP/API settings, and "Join us" form toggle.
 */

const {
  getAllBookings,
  getAllInfluencers,
  getAllPromotionTypes,
  getAdvertisementSettings,
  formatFollowersText,
  getAllSlides
} = require('../../services/advertisementService');
const { renderAdSliderHtml } = require('../adSlider');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderAdvertisementAdmin(statusFilter = 'all', query = {}) {
  const bookings = getAllBookings(statusFilter);
  const allBookings = getAllBookings('all');
  const influencers = getAllInfluencers();
  const promoTypes = getAllPromotionTypes();
  const settings = getAdvertisementSettings();
  const slides = getAllSlides();

  const totalBookings = allBookings.length;
  const pendingCount = allBookings.filter(b => b.status.toLowerCase() === 'pending').length;
  const approvedCount = allBookings.filter(b => b.status.toLowerCase() === 'approved').length;
  const completedCount = allBookings.filter(b => b.status.toLowerCase() === 'completed').length;
  const rejectedCount = allBookings.filter(b => b.status.toLowerCase() === 'rejected').length;

  const totalRevenue = allBookings
    .filter(b => b.status.toLowerCase() === 'completed' || b.status.toLowerCase() === 'approved')
    .reduce((sum, b) => sum + (parseFloat(b.estimated_charges) || 0), 0);

  return `
  <div class="admin-content-container">

    <!-- Top Banner -->
    <div style="background: linear-gradient(135deg, rgba(30, 58, 138, 0.9), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);">
      <div>
        <h2 style="font-size: 1.25rem; font-weight: 800; color: #ffffff; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
          <span>📢</span> Advertisement Booking & Commercial Desk
        </h2>
        <p style="color: #94a3b8; font-size: 0.88rem; line-height: 1.5; margin: 0; max-width: 680px;">
          Manage incoming advertising requests for ND30 LIVE official broadcasts and partner influencers. Configure promotion types, set rates, automate WhatsApp alerts, and control the "Join us" recruitment portal.
        </p>
      </div>
      <div style="display: flex; gap: 12px; align-items: center;">
        <button type="button" onclick="scrollToSection('settingsSection')" class="btn btn-secondary" style="font-size: 0.82rem; padding: 8px 14px; display: inline-flex; align-items: center; gap: 6px;">
          <span>⚙️</span> API & Controls
        </button>
        <a href="/as/" target="_blank" class="btn btn-primary" style="font-size: 0.82rem; padding: 8px 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <span>👁️</span> View Live Site ↗
        </a>
      </div>
    </div>

    <!-- Quick Stats Metric Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 28px;">
      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 16px;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">Total Inquiries</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: #ffffff; margin-top: 4px;">${totalBookings}</div>
      </div>

      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 10px; padding: 16px;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: #eab308; letter-spacing: 0.5px;">Pending Review</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: #eab308; margin-top: 4px;">${pendingCount}</div>
      </div>

      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 10px; padding: 16px;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.5px;">Approved Campaigns</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: #38bdf8; margin-top: 4px;">${approvedCount}</div>
      </div>

      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 10px; padding: 16px;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: #22c55e; letter-spacing: 0.5px;">Completed Bookings</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: #22c55e; margin-top: 4px;">${completedCount}</div>
      </div>

      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 10px; padding: 16px;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: #c084fc; letter-spacing: 0.5px;">Commercial Value</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: #c084fc; margin-top: 4px;">₹${Number(totalRevenue).toLocaleString('en-IN')}</div>
      </div>
    </div>

    ${query.msg ? `
      <div style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); color: #86efac; border-radius: 8px; padding: 12px 18px; margin-bottom: 20px; font-size: 0.88rem; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.2rem;">✅</span> <strong>Success:</strong> ${escapeHtml(query.msg)}
      </div>
    ` : ''}

    ${query.error ? `
      <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; border-radius: 8px; padding: 12px 18px; margin-bottom: 20px; font-size: 0.88rem; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.2rem;">⚠️</span> <strong>Error:</strong> ${escapeHtml(query.error)}
      </div>
    ` : ''}

    <!-- Navigation Sub-Tabs -->
    <div style="display: flex; gap: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px;">
      <button type="button" class="btn btn-tab active" onclick="switchTab('tabBookings', this)" id="btnTabBookings">
        <span>📑</span> All Bookings (${bookings.length})
      </button>
      <button type="button" class="btn btn-tab" onclick="switchTab('tabSlider', this)" id="btnTabSlider">
        <span>🖼️</span> Sidebar Photo Slider (${slides.length})
      </button>
      <button type="button" class="btn btn-tab" onclick="switchTab('tabPricing', this)" id="btnTabPricing">
        <span>💰</span> Promotion Types & Pricing (${promoTypes.length})
      </button>
      <button type="button" class="btn btn-tab" onclick="switchTab('tabInfluencers', this)" id="btnTabInfluencers">
        <span>🌟</span> Registered Influencers (${influencers.length})
      </button>
      <button type="button" class="btn btn-tab" onclick="switchTab('tabSettings', this)" id="btnTabSettings">
        <span>⚙️</span> API & Module Controls
      </button>
    </div>

    <!-- TAB 1: ALL BOOKINGS -->
    <div id="tabBookings" class="admin-tab-pane active">
      <!-- Status Filter Tabs -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; gap: 8px;">
          <a href="/admin/advertisements?status=all" class="badge ${statusFilter === 'all' ? 'badge-primary' : 'badge-outline'}" style="padding: 6px 12px; text-decoration: none;">All (${allBookings.length})</a>
          <a href="/admin/advertisements?status=pending" class="badge ${statusFilter === 'pending' ? 'badge-warning' : 'badge-outline'}" style="padding: 6px 12px; text-decoration: none;">Pending (${pendingCount})</a>
          <a href="/admin/advertisements?status=approved" class="badge ${statusFilter === 'approved' ? 'badge-info' : 'badge-outline'}" style="padding: 6px 12px; text-decoration: none;">Approved (${approvedCount})</a>
          <a href="/admin/advertisements?status=completed" class="badge ${statusFilter === 'completed' ? 'badge-success' : 'badge-outline'}" style="padding: 6px 12px; text-decoration: none;">Completed (${completedCount})</a>
          <a href="/admin/advertisements?status=rejected" class="badge ${statusFilter === 'rejected' ? 'badge-danger' : 'badge-outline'}" style="padding: 6px 12px; text-decoration: none;">Rejected (${rejectedCount})</a>
        </div>
      </div>

      <!-- Bookings Table -->
      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
        ${bookings.length === 0 ? `
          <div style="padding: 40px 20px; text-align: center; color: #94a3b8;">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">📭</div>
            <div style="font-size: 1rem; font-weight: 600; color: #ffffff;">No bookings found</div>
            <p style="font-size: 0.82rem; margin-top: 4px;">When users submit the "Advertise With Us" form, their submissions will appear here.</p>
          </div>
        ` : `
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.84rem;">
              <thead>
                <tr style="background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.5px;">
                  <th style="padding: 12px 16px;">Booking ID & Date</th>
                  <th style="padding: 12px 16px;">Client & Business</th>
                  <th style="padding: 12px 16px;">Partner & Format</th>
                  <th style="padding: 12px 16px;">Charges</th>
                  <th style="padding: 12px 16px;">Contact & WhatsApp</th>
                  <th style="padding: 12px 16px;">Status</th>
                  <th style="padding: 12px 16px; text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${bookings.map(b => {
                  const statusColors = {
                    'pending': { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.35)' },
                    'approved': { bg: 'rgba(59, 130, 246, 0.15)', text: '#38bdf8', border: 'rgba(59, 130, 246, 0.35)' },
                    'completed': { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.35)' },
                    'rejected': { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.35)' }
                  }[b.status.toLowerCase()] || { bg: '#334155', text: '#fff', border: '#475569' };

                  const cleanPhone = (b.mobile_number || '').replace(/[^0-9]/g, '');
                  const waUrl = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(`Hello ${b.contact_name}, regarding your ND30 LIVE advertisement booking (${b.booking_id}) for ${b.business_name}:`)}`;

                  return `
                  <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.15s ease;">
                    <td style="padding: 14px 16px;">
                      <strong style="color: #38bdf8; font-family: monospace; font-size: 0.88rem;">${b.booking_id}</strong>
                      <div style="font-size: 0.72rem; color: #64748b; margin-top: 3px;">
                        ${new Date(b.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      ${b.promoter_id ? `
                        <div style="margin-top: 4px;">
                          <span style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.4); color: #c084fc; font-family: monospace; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                            🏷️ ${escapeHtml(b.promoter_id)}
                          </span>
                        </div>
                      ` : ''}
                    </td>

                    <td style="padding: 14px 16px;">
                      <div style="font-weight: 700; color: #ffffff;">${escapeHtml(b.business_name)}</div>
                      <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;">
                        👤 ${escapeHtml(b.contact_name)}
                      </div>
                      <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                        📍 ${escapeHtml(b.village_town)}, ${escapeHtml(b.district)} (${escapeHtml(b.state)} - ${escapeHtml(b.pincode)})
                      </div>
                      ${b.business_desc ? `
                        <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px; font-style: italic; max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          "${escapeHtml(b.business_desc)}"
                        </div>
                      ` : ''}
                    </td>

                    <td style="padding: 14px 16px;">
                      <div style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: ${b.partner_type === 'nd30' ? '#f87171' : '#c084fc'};">
                        <span>${b.partner_type === 'nd30' ? '📺 ND30 Live' : '🌟 ' + escapeHtml(b.influencer_name)}</span>
                      </div>
                      <div style="font-size: 0.76rem; color: #e2e8f0; margin-top: 3px;">
                        ${escapeHtml(b.promotion_type)}
                      </div>
                    </td>

                    <td style="padding: 14px 16px;">
                      <strong style="color: #22c55e; font-size: 0.95rem;">
                        ₹${Number(b.estimated_charges || 0).toLocaleString('en-IN')}
                      </strong>
                    </td>

                    <td style="padding: 14px 16px;">
                      <div style="font-weight: 600; color: #ffffff; display: flex; align-items: center; gap: 6px;">
                        <span>+91 ${escapeHtml(b.mobile_number)}</span>
                        ${b.is_mobile_verified ? '<span title="Verified Mobile" style="color:#22c55e; font-size:0.75rem;">✅</span>' : ''}
                      </div>
                      <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 2px;">
                        ✉️ ${escapeHtml(b.email)}
                      </div>
                      <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; color: #22c55e; font-size: 0.72rem; font-weight: 600; text-decoration: none; margin-top: 5px; background: rgba(34,197,94,0.1); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(34,197,94,0.3);">
                        <span>💬 Chat on WhatsApp ↗</span>
                      </a>
                    </td>

                    <td style="padding: 14px 16px;">
                      <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: ${statusColors.bg}; color: ${statusColors.text}; border: 1px solid ${statusColors.border};">
                        ${b.status}
                      </span>
                    </td>

                    <td style="padding: 14px 16px; text-align: right;">
                      <button type="button" onclick="openStatusModal(${b.id}, '${b.booking_id}', '${b.status}', '${escapeHtml(b.admin_notes || '')}')" style="background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); color: #38bdf8; border-radius: 6px; padding: 6px 12px; font-size: 0.78rem; font-weight: 600; cursor: pointer;">
                        Update Status
                      </button>
                    </td>
                  </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>

    <!-- TAB: SIDEBAR PHOTO SLIDER (ADVERTISEMENT) -->
    <div id="tabSlider" class="admin-tab-pane" style="display:none;">
      <!-- Section Banner -->
      <div style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95)); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 12px; padding: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin: 0 0 6px 0; display: flex; align-items: center; gap: 8px;">
            <span>🖼️</span> Homepage Sidebar Photo Slider (ADVERTISEMENT)
          </h3>
          <p style="color: #94a3b8; font-size: 0.84rem; margin: 0; max-width: 720px; line-height: 1.5;">
            Upload promotional banners and photos displayed in the dark rounded <code>ADVERTISEMENT</code> box on the homepage sidebar. Set click links, toggle visibility, and control slide ordering.
          </p>
        </div>
        <a href="/as/" target="_blank" class="btn btn-secondary" style="font-size: 0.82rem; padding: 8px 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <span>🌐</span> Preview on Homepage ↗
        </a>
      </div>

      <!-- Two column grid: Upload form + Live preview -->
      <div style="display: grid; grid-template-columns: minmax(320px, 1.2fr) minmax(300px, 0.8fr); gap: 24px; margin-bottom: 32px; align-items: start;">
        
        <!-- Upload Form -->
        <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 22px;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
            <span>➕</span> Upload New Photo Slide
          </h4>

          <form action="/admin/advertisements/slides/add" method="POST" enctype="multipart/form-data" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px;">
                Slide Image * <span style="color: #38bdf8; font-weight: normal;">(JPG, PNG, WEBP, GIF - Max 5MB)</span>
              </label>
              <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                <input type="file" name="slide_image" accept="image/*" id="slideFileInput" onchange="previewSlideUpload(this)" style="flex: 1; min-width: 200px; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.82rem;">
              </div>
              <div style="margin-top: 8px; font-size: 0.74rem; color: #64748b;">
                Or paste an external Image URL below:
              </div>
              <input type="text" name="image_url" id="slideUrlInput" placeholder="https://example.com/banner.jpg" style="width: 100%; margin-top: 4px; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.82rem;" oninput="previewSlideUrl(this.value)">
            </div>

            <!-- Image Thumbnail Live Preview in Form -->
            <div id="slideUploadPreviewBox" style="display: none; background: #0f172a; border: 1px dashed rgba(59, 130, 246, 0.4); border-radius: 8px; padding: 10px; text-align: center;">
              <div style="font-size: 0.72rem; color: #38bdf8; margin-bottom: 6px; font-weight: 600;">Selected Image Preview</div>
              <img id="slideUploadPreviewImg" src="" alt="Slide Preview" style="max-height: 140px; max-width: 100%; border-radius: 6px; object-fit: cover;">
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px;">Slide Title / Client Name *</label>
              <input type="text" name="title" required placeholder="e.g. Special Festive Offer | Brand Name" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem;">
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #22c55e; margin-bottom: 6px;">
                💬 WhatsApp Number for Inquiries <span style="color: #94a3b8; font-weight: normal;">(Adds "Contact" button on image to start WhatsApp chat)</span>
              </label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <span style="background: rgba(37, 211, 102, 0.15); border: 1px solid rgba(37, 211, 102, 0.35); color: #22c55e; padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 700;">+91</span>
                <input type="text" name="whatsapp_number" id="slideWhatsappInput" placeholder="e.g. 9876543210 (10 digits)" style="flex: 1; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem;">
              </div>
              <div style="margin-top: 4px; font-size: 0.72rem; color: #64748b;">
                When visitors click the "Contact" button on this ad, WhatsApp immediately opens to start a direct chat.
              </div>
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px;">WhatsApp Pre-filled Message <span style="color: #64748b;">(Optional)</span></label>
              <input type="text" name="whatsapp_message" placeholder="e.g. Hello, I am interested in your ad on ND30 LIVE." style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem;">
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px;">Target Link URL <span style="color: #64748b;">(Optional - opens when clicked)</span></label>
              <input type="text" name="link_url" placeholder="https://wa.me/91XXXXXXXXXX or https://brandwebsite.com" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem;">
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px;">Caption / Subtext <span style="color: #64748b;">(Optional tagline shown over slide)</span></label>
              <input type="text" name="caption" placeholder="e.g. Call 9876543210 for best deals across Assam" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px;">Sort Order</label>
                <input type="number" name="sort_order" value="${slides.length + 1}" min="0" step="1" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem;">
              </div>

              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px;">Slide Status</label>
                <label style="display: flex; align-items: center; gap: 8px; margin-top: 10px; cursor: pointer; color: #ffffff; font-size: 0.85rem;">
                  <input type="checkbox" name="is_active" value="1" checked style="width: 18px; height: 18px; accent-color: #22c55e;">
                  <span>Active & Visible immediately</span>
                </label>
              </div>
            </div>

            <div style="margin-top: 8px;">
              <button type="submit" class="btn btn-primary" style="width: 100%; padding: 11px 18px; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span>🚀</span> Upload & Publish Slide
              </button>
            </div>
          </form>
        </div>

        <!-- Live Preview Box -->
        <div>
          <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 22px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <h4 style="font-size: 0.95rem; font-weight: 700; color: #ffffff; margin: 0; display: flex; align-items: center; gap: 8px;">
                <span>📱</span> Live Frontend Preview
              </h4>
              <span class="badge badge-primary" style="font-size: 0.68rem; text-transform: uppercase;">Realtime</span>
            </div>
            <p style="font-size: 0.76rem; color: #94a3b8; margin: 0 0 14px 0;">
              This is how the advertisement slider looks to visitors on the homepage sidebar:
            </p>

            <div style="max-width: 380px; margin: 0 auto;">
              ${renderAdSliderHtml(slides)}
            </div>
          </div>
        </div>

      </div>

      <!-- Existing Slides Table -->
      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
        <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #ffffff; margin: 0; display: flex; align-items: center; gap: 8px;">
            <span>📸</span> All Uploaded Slides (${slides.length})
          </h4>
          <span style="font-size: 0.78rem; color: #94a3b8;">${slides.filter(s => s.is_active === 1).length} active on live site</span>
        </div>

        ${slides.length === 0 ? `
          <div style="padding: 40px 20px; text-align: center; color: #94a3b8;">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">🖼️</div>
            <div style="font-size: 1rem; font-weight: 600; color: #ffffff;">No slides uploaded yet</div>
            <p style="font-size: 0.82rem; margin-top: 4px;">Use the form above to upload your first advertisement banner or promotional photo.</p>
          </div>
        ` : `
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.84rem;">
              <thead>
                <tr style="background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.5px;">
                  <th style="padding: 12px 16px; width: 100px;">Photo</th>
                  <th style="padding: 12px 16px;">Slide Details</th>
                  <th style="padding: 12px 16px;">Target Link</th>
                  <th style="padding: 12px 16px;">WhatsApp Chat</th>
                  <th style="padding: 12px 16px; text-align: center;">Order</th>
                  <th style="padding: 12px 16px; text-align: center;">Status (On/Off)</th>
                  <th style="padding: 12px 16px; text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${slides.map(slide => `
                  <tr id="slide-row-${slide.id}" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 12px 16px;">
                      <div style="width: 90px; height: 55px; border-radius: 6px; overflow: hidden; background: #0a0f18; border: 1px solid rgba(255,255,255,0.1);">
                        <img src="${escapeHtml(slide.image_url)}" alt="${escapeHtml(slide.title)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/images/nd30_live_logo_solid.png'">
                      </div>
                    </td>
                    <td style="padding: 12px 16px;">
                      <strong style="color: #ffffff; font-size: 0.9rem; display: block;">${escapeHtml(slide.title)}</strong>
                      ${slide.caption ? `<div style="font-size: 0.76rem; color: #94a3b8; margin-top: 3px;">${escapeHtml(slide.caption)}</div>` : ''}
                      <div style="font-size: 0.7rem; color: #64748b; margin-top: 3px;">Added: ${slide.created_at || 'Recently'}</div>
                    </td>
                    <td style="padding: 12px 16px;">
                      ${slide.link_url ? `
                        <a href="${escapeHtml(slide.link_url)}" target="_blank" style="color: #38bdf8; text-decoration: none; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px; word-break: break-all; max-width: 200px;">
                          <span>🔗</span> ${escapeHtml(slide.link_url)}
                        </a>
                      ` : `
                        <span style="color: #64748b; font-size: 0.78rem;">No link</span>
                      `}
                    </td>
                    <td style="padding: 12px 16px;">
                      ${slide.whatsapp_number ? `
                        <a href="https://wa.me/${String(slide.whatsapp_number).replace(/[^0-9]/g, '').length === 10 ? '91' + String(slide.whatsapp_number).replace(/[^0-9]/g, '') : String(slide.whatsapp_number).replace(/[^0-9]/g, '')}" target="_blank" style="color: #22c55e; text-decoration: none; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
                          <span>💬</span> ${escapeHtml(slide.whatsapp_number)}
                        </a>
                      ` : `
                        <span style="color: #64748b; font-size: 0.78rem;">None</span>
                      `}
                    </td>
                    <td style="padding: 12px 16px; text-align: center; color: #cbd5e1; font-weight: 700;">
                      ${slide.sort_order || 0}
                    </td>
                    <td style="padding: 12px 16px; text-align: center;">
                      <button type="button" onclick="handleToggleSlide(${slide.id}, ${slide.is_active === 1 ? 0 : 1})" id="btn-toggle-slide-${slide.id}" class="badge ${slide.is_active === 1 ? 'badge-success' : 'badge-outline'}" style="cursor: pointer; border: 1px solid ${slide.is_active === 1 ? '#22c55e' : '#64748b'}; padding: 5px 12px; font-size: 0.74rem;">
                        ${slide.is_active === 1 ? '🟢 ACTIVE' : '⚪ INACTIVE'}
                      </button>
                    </td>
                    <td style="padding: 12px 16px; text-align: right;">
                      <button type="button" onclick="handleDeleteSlide(${slide.id}, '${escapeHtml(slide.title)}')" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); color: #ef4444; border-radius: 6px; padding: 6px 12px; font-size: 0.78rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                        <span>🗑️</span> Delete
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>

    <!-- TAB 2: PROMOTION TYPES & CHARGES CONFIGURATION -->
    <div id="tabPricing" class="admin-tab-pane" style="display:none;">
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px;">

        <!-- List of Existing Promotion Types -->
        <div>
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #ffffff; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
            <span>📋</span> Configured Promotion Packages & Rates
          </h3>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${promoTypes.map(pt => `
              <div id="promo-row-${pt.id}" style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <strong style="color: #ffffff; font-size: 0.95rem;">${escapeHtml(pt.title)}</strong>
                    <span class="badge ${pt.partner_type === 'nd30' ? 'badge-primary' : 'badge-purple'}" style="font-size: 0.65rem;">
                      ${pt.partner_type === 'nd30' ? 'ND30 Live' : 'Influencer'}
                    </span>
                  </div>
                  <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 4px;">
                    ${escapeHtml(pt.description || 'Standard promotion format')}
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="text-align: right;">
                    <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">Charge</div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: #22c55e;">₹${Number(pt.charge).toLocaleString('en-IN')}</div>
                  </div>

                  <button type="button" onclick="handleEditPromoPrice(${pt.id}, '${escapeHtml(pt.title)}', ${pt.charge})" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; border-radius: 6px; padding: 6px 10px; font-size: 0.76rem; cursor: pointer;">
                    ✏️ Edit Price
                  </button>
                  <button type="button" onclick="handleDeletePromo(${pt.id})" style="background: transparent; border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; border-radius: 6px; padding: 6px 10px; font-size: 0.76rem; cursor: pointer;">
                    🗑️
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Add New Promotion Type Form -->
        <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; height: fit-content;">
          <h3 style="font-size: 1rem; font-weight: 700; color: #ffffff; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
            <span>➕</span> Add New Promotion Type
          </h3>
          <form onsubmit="handleCreatePromoType(event)" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="display: block; font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Partner Category *</label>
              <select id="newPromoPartner" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.84rem;">
                <option value="nd30">ND30 Live Official</option>
                <option value="influencer">Other Influencer</option>
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Promotion Title *</label>
              <input type="text" id="newPromoTitle" placeholder="e.g. Breaking News Headline Sponsorship" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.84rem;">
            </div>

            <div>
              <label style="display: block; font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Rate / Charge (INR ₹) *</label>
              <input type="number" id="newPromoCharge" placeholder="5000" min="0" step="100" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.84rem;">
            </div>

            <div>
              <label style="display: block; font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Description</label>
              <textarea id="newPromoDesc" rows="3" placeholder="Brief outline of media coverage, duration, and deliverables..." style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.84rem;"></textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top: 6px; padding: 10px 16px; font-weight: 700;">
              <span>✨</span> Save Promotion Type
            </button>
          </form>
        </div>

      </div>
    </div>

    <!-- TAB 3: REGISTERED INFLUENCERS -->
    <div id="tabInfluencers" class="admin-tab-pane" style="display:none;">
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px;">

        <!-- Influencer List -->
        <div>
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #ffffff; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
            <span>🌟</span> Partner Influencer Roster (${influencers.length})
          </h3>

          <div style="display: grid; grid-template-columns: 1fr; gap: 14px;">
            ${influencers.map(inf => `
              <div id="inf-card-${inf.id}" style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; justify-content: center;">
                    ${inf.name.charAt(0)}
                  </div>
                  <div>
                    <div style="font-weight: 700; color: #ffffff; font-size: 0.95rem;">
                      ${escapeHtml(inf.name)}
                    </div>
                    <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;">
                      <span>${escapeHtml(inf.platform)}</span> • <span style="color:#38bdf8; font-weight:600;">${escapeHtml(formatFollowersText(inf.followers, inf.platform))}</span> • <span>${escapeHtml(inf.handle || '')}</span>
                    </div>
                    <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                      Niche: ${escapeHtml(inf.niche || 'General Lifestyle')}
                    </div>
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 14px;">
                  <div style="text-align: right;">
                    <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">Video Rate</div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: #22c55e;">
                      ₹${Number(inf.charge).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <button type="button" onclick="handleEditInfluencer(${inf.id}, '${escapeHtml(inf.name)}', ${inf.charge})" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 6px; padding: 6px 10px; font-size: 0.76rem; cursor: pointer;">
                    ✏️ Edit
                  </button>
                  <button type="button" onclick="handleDeleteInfluencer(${inf.id})" style="background: transparent; border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; border-radius: 6px; padding: 6px 10px; font-size: 0.76rem; cursor: pointer;">
                    🗑️
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Add Influencer Form -->
        <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; height: fit-content;">
          <h3 style="font-size: 1rem; font-weight: 700; color: #ffffff; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
            <span>➕</span> Register New Influencer
          </h3>
          <form onsubmit="handleCreateInfluencer(event)" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="display: block; font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Creator / Channel Name *</label>
              <input type="text" id="newInfName" placeholder="e.g. Manas Borah (Assam Explorer)" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.84rem;">
            </div>

            <div>
              <label style="display: block; font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Primary Platform *</label>
              <select id="newInfPlatform" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.84rem;">
                <option value="YouTube">YouTube</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Multi-Platform">Multi-Platform</option>
              </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="display: block; font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Social Handle</label>
                <input type="text" id="newInfHandle" placeholder="@channel" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.84rem;">
              </div>
              <div>
                <label style="display: block; font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Audience (e.g. 10000 Followers or 10000 Subscribers)</label>
                <input type="text" id="newInfFollowers" placeholder="e.g. 10000 Followers or 10000 Subscribers" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.84rem;">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="display: block; font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Content Niche</label>
                <input type="text" id="newInfNiche" placeholder="Lifestyle & Food" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.84rem;">
              </div>
              <div>
                <label style="display: block; font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Video Rate (INR ₹) *</label>
                <input type="number" id="newInfCharge" placeholder="8000" min="0" step="500" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.84rem;">
              </div>
            </div>

            <div>
              <label style="display: block; font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Bio / Details</label>
              <textarea id="newInfBio" rows="2" placeholder="Brief creator highlights..." style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.84rem;"></textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top: 6px; padding: 10px 16px; font-weight: 700;">
              <span>✨</span> Save Influencer
            </button>
          </form>
        </div>

      </div>
    </div>

    <!-- TAB 4: API & MODULE CONTROLS (JOIN US TOGGLE, WHATSAPP, EMAIL) -->
    <div id="tabSettings" class="admin-tab-pane" style="display:none;">
      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px; max-width: 820px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
          <span>⚙️</span> Portal Modules & API Automation Settings
        </h3>

        <form id="adSettingsForm" onsubmit="handleSaveSettings(event)" style="display: flex; flex-direction: column; gap: 24px;">

          <!-- 1. Join Us Recruitment Form Toggle -->
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 18px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
              <div>
                <strong style="color: #ffffff; font-size: 0.95rem; display: block;">"Join us" Form Visibility</strong>
                <span style="font-size: 0.78rem; color: #94a3b8; line-height: 1.4; display: block; margin-top: 2px;">
                  Toggle the "Join us" button in the website navigation. When turned OFF, recruitment registrations are suspended and the button is hidden from visitors.
                </span>
              </div>
              <label class="switch-toggle" style="cursor: pointer;">
                <input type="checkbox" id="setJoinUsEnabled" ${settings.join_us_enabled ? 'checked' : ''} style="width: 22px; height: 22px; accent-color: #2563eb;">
              </label>
            </div>
          </div>

          <!-- 2. WhatsApp OTP Verification Toggle -->
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 18px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
              <div>
                <strong style="color: #ffffff; font-size: 0.95rem; display: block;">WhatsApp OTP Mobile Verification</strong>
                <span style="font-size: 0.78rem; color: #94a3b8; line-height: 1.4; display: block; margin-top: 2px;">
                  Require advertisers to verify their 10-digit mobile number via a 6-digit WhatsApp OTP before submitting. (Defaults to OFF).
                </span>
              </div>
              <label class="switch-toggle" style="cursor: pointer;">
                <input type="checkbox" id="setWhatsappOtpEnabled" ${settings.whatsapp_otp_enabled ? 'checked' : ''} style="width: 22px; height: 22px; accent-color: #22c55e;">
              </label>
            </div>

            <!-- WhatsApp API Credentials (Expandable) -->
            <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
              <div style="font-size: 0.78rem; font-weight: 700; color: #38bdf8; margin-bottom: 10px;">
                WhatsApp Business API Configuration (Meta Cloud API / Twilio)
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="display: block; font-size: 0.74rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">API Provider</label>
                  <select id="setWhatsappProvider" style="width: 100%; background: #020617; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.82rem;">
                    <option value="meta" ${settings.whatsapp_provider === 'meta' ? 'selected' : ''}>Meta WhatsApp Cloud API</option>
                    <option value="twilio" ${settings.whatsapp_provider === 'twilio' ? 'selected' : ''}>Twilio WhatsApp</option>
                    <option value="custom" ${settings.whatsapp_provider === 'custom' ? 'selected' : ''}>Custom Gateway / Webhook</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 0.74rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">WhatsApp Phone Number ID</label>
                  <input type="text" id="setWhatsappPhoneId" value="${escapeHtml(settings.whatsapp_phone_number_id || '')}" placeholder="e.g. 109876543210" style="width: 100%; background: #020617; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.82rem;">
                </div>
              </div>

              <div style="margin-top: 10px;">
                <label style="display: block; font-size: 0.74rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">API Access Token / Secret Key</label>
                <input type="password" id="setWhatsappApiKey" value="${escapeHtml(settings.whatsapp_api_key || '')}" placeholder="Bearer EAAG..." style="width: 100%; background: #020617; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.82rem;">
              </div>

              <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="setWhatsappNotifyEnabled" ${settings.whatsapp_notify_enabled ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #22c55e;">
                <label for="setWhatsappNotifyEnabled" style="font-size: 0.78rem; color: #e2e8f0; cursor: pointer;">
                  Automatically send WhatsApp status updates to advertiser when booking status is Approved, Completed, or Rejected.
                </label>
              </div>
            </div>
          </div>

          <!-- 3. Email API Settings -->
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 18px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
              <div>
                <strong style="color: #ffffff; font-size: 0.95rem; display: block;">Email Notification Alerts</strong>
                <span style="font-size: 0.78rem; color: #94a3b8; line-height: 1.4; display: block; margin-top: 2px;">
                  Send copy of bookings and status confirmations via SMTP email.
                </span>
              </div>
              <label class="switch-toggle" style="cursor: pointer;">
                <input type="checkbox" id="setEmailNotifyEnabled" ${settings.email_notify_enabled ? 'checked' : ''} style="width: 22px; height: 22px; accent-color: #2563eb;">
              </label>
            </div>

            <div style="margin-top: 14px; display: grid; grid-template-columns: 2fr 1fr; gap: 10px;">
              <div>
                <label style="display: block; font-size: 0.74rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">SMTP Host</label>
                <input type="text" id="setSmtpHost" value="${escapeHtml(settings.smtp_host || 'smtp.gmail.com')}" style="width: 100%; background: #020617; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.82rem;">
              </div>
              <div>
                <label style="display: block; font-size: 0.74rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Port</label>
                <input type="number" id="setSmtpPort" value="${settings.smtp_port || 587}" style="width: 100%; background: #020617; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; font-size: 0.82rem;">
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" id="saveSettingsBtn" class="btn btn-primary" style="padding: 10px 24px; font-size: 0.88rem; font-weight: 700;">
              <span>💾</span> Save All Module Settings
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>

  <!-- Status Update Modal -->
  <div id="statusModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:999999; align-items:center; justify-content:center; padding:16px;">
    <div style="background:#1e293b; border:1px solid rgba(255,255,255,0.15); border-radius:12px; width:100%; max-width:440px; padding:20px; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
      <h3 style="font-size:1.1rem; color:#fff; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
        <span>Update Status: <span id="modalBookingId" style="color:#38bdf8; font-family:monospace;"></span></span>
        <button type="button" onclick="closeStatusModal()" style="background:none; border:none; color:#94a3b8; font-size:1.4rem; cursor:pointer;">&times;</button>
      </h3>

      <div style="margin-bottom:12px;">
        <label style="display:block; font-size:0.78rem; font-weight:600; color:#94a3b8; margin-bottom:6px;">Select New Status *</label>
        <select id="modalStatusSelect" style="width:100%; background:#0f172a; color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; padding:8px 10px; font-size:0.88rem;">
          <option value="Pending">Pending Review</option>
          <option value="Approved">Approved (Campaign Scheduled)</option>
          <option value="Completed">Completed (Broadcasted / Delivered)</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div style="margin-bottom:16px;">
        <label style="display:block; font-size:0.78rem; font-weight:600; color:#94a3b8; margin-bottom:6px;">Editorial Notes / Client Remarks</label>
        <textarea id="modalAdminNotes" rows="3" placeholder="Enter notes or explanation..." style="width:100%; background:#0f172a; color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; padding:8px 10px; font-size:0.84rem;"></textarea>
      </div>

      <input type="hidden" id="modalBookingDbId">

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" onclick="closeStatusModal()" class="btn btn-secondary" style="padding:6px 14px;">Cancel</button>
        <button type="button" onclick="submitStatusUpdate()" class="btn btn-primary" style="padding:6px 18px; font-weight:700;">Save & Notify</button>
      </div>
    </div>
  </div>

  <script>
    function switchTab(tabId, btn) {
      document.querySelectorAll('.admin-tab-pane').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
      const activeTab = document.getElementById(tabId);
      if (activeTab) activeTab.style.display = 'block';
      if (btn) btn.classList.add('active');
    }

    function scrollToSection(secId) {
      switchTab('tabSettings', document.querySelectorAll('.btn-tab')[3]);
    }

    function openStatusModal(id, bookingId, currentStatus, notes) {
      document.getElementById('modalBookingDbId').value = id;
      document.getElementById('modalBookingId').innerText = bookingId;
      document.getElementById('modalStatusSelect').value = currentStatus;
      document.getElementById('modalAdminNotes').value = notes || '';
      const m = document.getElementById('statusModal');
      m.style.display = 'flex';
    }

    function closeStatusModal() {
      document.getElementById('statusModal').style.display = 'none';
    }

    async function submitStatusUpdate() {
      const id = document.getElementById('modalBookingDbId').value;
      const status = document.getElementById('modalStatusSelect').value;
      const admin_notes = document.getElementById('modalAdminNotes').value.trim();

      try {
        const res = await fetch('/api/admin/advertisements/' + id + '/status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, admin_notes })
        });
        const data = await res.json();
        if (data.success) {
          alert('Status updated successfully to ' + status + '!');
          window.location.reload();
        } else {
          alert('Error: ' + (data.error || 'Failed to update'));
        }
      } catch (e) {
        alert('Request failed: ' + e.message);
      }
    }

    async function handleSaveSettings(event) {
      event.preventDefault();
      const saveBtn = document.getElementById('saveSettingsBtn');
      saveBtn.disabled = true;
      saveBtn.innerText = 'Saving...';

      const payload = {
        join_us_enabled: document.getElementById('setJoinUsEnabled').checked,
        whatsapp_otp_enabled: document.getElementById('setWhatsappOtpEnabled').checked,
        whatsapp_notify_enabled: document.getElementById('setWhatsappNotifyEnabled').checked,
        whatsapp_provider: document.getElementById('setWhatsappProvider').value,
        whatsapp_phone_number_id: document.getElementById('setWhatsappPhoneId').value.trim(),
        whatsapp_api_key: document.getElementById('setWhatsappApiKey').value.trim(),
        email_notify_enabled: document.getElementById('setEmailNotifyEnabled').checked,
        smtp_host: document.getElementById('setSmtpHost').value.trim(),
        smtp_port: parseInt(document.getElementById('setSmtpPort').value) || 587
      };

      try {
        const res = await fetch('/api/admin/advertisements/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          alert('Portal & API settings saved successfully!');
        } else {
          alert('Error: ' + (data.error || 'Failed to save settings'));
        }
      } catch (e) {
        alert('Request failed: ' + e.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>💾</span> Save All Module Settings';
      }
    }

    async function handleCreatePromoType(event) {
      event.preventDefault();
      const partner_type = document.getElementById('newPromoPartner').value;
      const title = document.getElementById('newPromoTitle').value.trim();
      const charge = document.getElementById('newPromoCharge').value;
      const description = document.getElementById('newPromoDesc').value.trim();

      try {
        const res = await fetch('/api/admin/advertisements/promotion-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partner_type, title, charge, description })
        });
        const data = await res.json();
        if (data.success) {
          alert('Promotion Type created: ' + title);
          window.location.reload();
        } else {
          alert('Error: ' + (data.error || 'Failed'));
        }
      } catch (e) {
        alert('Failed: ' + e.message);
      }
    }

    async function handleEditPromoPrice(id, title, currentCharge) {
      const newCharge = prompt('Enter new charge (INR ₹) for ' + title + ':', currentCharge);
      if (newCharge === null || newCharge.trim() === '') return;

      try {
        const res = await fetch('/api/admin/advertisements/promotion-types/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ charge: parseFloat(newCharge) })
        });
        const data = await res.json();
        if (data.success) {
          alert('Price updated for ' + title + ' to ₹' + newCharge);
          window.location.reload();
        } else {
          alert('Error updating price: ' + (data.error || 'Failed'));
        }
      } catch (e) {
        alert('Failed: ' + e.message);
      }
    }

    async function handleDeletePromo(id) {
      if (!confirm('Are you sure you want to delete this promotion type?')) return;
      try {
        const res = await fetch('/api/admin/advertisements/promotion-types/' + id, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          document.getElementById('promo-row-' + id)?.remove();
        } else {
          alert('Error: ' + data.error);
        }
      } catch (e) {
        alert('Delete failed: ' + e.message);
      }
    }

    async function handleCreateInfluencer(event) {
      event.preventDefault();
      const name = document.getElementById('newInfName').value.trim();
      const platform = document.getElementById('newInfPlatform').value;
      const handle = document.getElementById('newInfHandle').value.trim();
      let followers = document.getElementById('newInfFollowers').value.trim();
      if (followers && !/follower|subscriber|sub/i.test(followers)) {
        const isYt = platform.toLowerCase().includes('youtube');
        followers = followers + ' ' + (isYt ? 'Subscribers' : 'Followers');
      }
      const niche = document.getElementById('newInfNiche').value.trim();
      const charge = document.getElementById('newInfCharge').value;
      const bio = document.getElementById('newInfBio').value.trim();

      try {
        const res = await fetch('/api/admin/advertisements/influencers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, platform, handle, followers, niche, charge, bio })
        });
        const data = await res.json();
        if (data.success) {
          alert('Influencer added: ' + name);
          window.location.reload();
        } else {
          alert('Error: ' + (data.error || 'Failed'));
        }
      } catch (e) {
        alert('Failed: ' + e.message);
      }
    }

    async function handleEditInfluencer(id, name, currentCharge) {
      const newCharge = prompt('Enter new Promotion Video rate (INR ₹) for ' + name + ':', currentCharge);
      if (newCharge === null || newCharge.trim() === '') return;

      try {
        const res = await fetch('/api/admin/advertisements/influencers/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ charge: parseFloat(newCharge) })
        });
        const data = await res.json();
        if (data.success) {
          alert('Rate updated for ' + name + ' to ₹' + newCharge);
          window.location.reload();
        } else {
          alert('Error: ' + (data.error || 'Failed'));
        }
      } catch (e) {
        alert('Failed: ' + e.message);
      }
    }

    async function handleDeleteInfluencer(id) {
      if (!confirm('Are you sure you want to delete this influencer?')) return;
      try {
        const res = await fetch('/api/admin/advertisements/influencers/' + id, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          document.getElementById('inf-card-' + id)?.remove();
        } else {
          alert('Error: ' + data.error);
        }
      } catch (e) {
        alert('Failed: ' + e.message);
      }
    }

    // Sidebar Slide Handlers
    function previewSlideUpload(input) {
      if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const img = document.getElementById('slideUploadPreviewImg');
          if (img) img.src = e.target.result;
          const box = document.getElementById('slideUploadPreviewBox');
          if (box) box.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
      }
    }

    function previewSlideUrl(url) {
      if (url && url.trim().length > 4) {
        const img = document.getElementById('slideUploadPreviewImg');
        if (img) img.src = url.trim();
        const box = document.getElementById('slideUploadPreviewBox');
        if (box) box.style.display = 'block';
      }
    }

    async function handleToggleSlide(id, newStatus) {
      try {
        const res = await fetch('/admin/advertisements/slides/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, is_active: newStatus })
        });
        const data = await res.json();
        if (data.success) {
          const btn = document.getElementById('btn-toggle-slide-' + id);
          if (btn) {
            if (data.is_active === 1) {
              btn.className = 'badge badge-success';
              btn.style.borderColor = '#22c55e';
              btn.innerHTML = '🟢 ACTIVE';
              btn.setAttribute('onclick', 'handleToggleSlide(' + id + ', 0)');
            } else {
              btn.className = 'badge badge-outline';
              btn.style.borderColor = '#64748b';
              btn.innerHTML = '⚪ INACTIVE';
              btn.setAttribute('onclick', 'handleToggleSlide(' + id + ', 1)');
            }
          }
        } else {
          alert('Failed to toggle slide status: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Toggle error: ' + err.message);
      }
    }

    async function handleDeleteSlide(id, title) {
      if (!confirm('Are you sure you want to delete slide "' + title + '"?')) return;
      try {
        const res = await fetch('/admin/advertisements/slides/delete/' + id, {
          method: 'POST',
          headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
          const row = document.getElementById('slide-row-' + id);
          if (row) row.remove();
        } else {
          alert('Delete failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Delete error: ' + err.message);
      }
    }

    // Auto-switch to tab if specified in URL query
    document.addEventListener('DOMContentLoaded', function() {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab === 'slider') {
        const btn = document.getElementById('btnTabSlider');
        if (btn) switchTab('tabSlider', btn);
      } else if (tab === 'pricing') {
        const btn = document.getElementById('btnTabPricing');
        if (btn) switchTab('tabPricing', btn);
      } else if (tab === 'influencers') {
        const btn = document.getElementById('btnTabInfluencers');
        if (btn) switchTab('tabInfluencers', btn);
      } else if (tab === 'settings') {
        const btn = document.getElementById('btnTabSettings');
        if (btn) switchTab('tabSettings', btn);
      }
    });
  </script>
  `;
}

module.exports = {
  renderAdvertisementAdmin
};

