/**
 * ND30 LIVE - Dedicated Promoter Portal View
 * Enables authorized promoters (ND30-PRO-0000) to:
 * - View their assigned commission rates
 * - Submit advertisement bookings for clients
 * - Track total submitted forms and real-time status (Pending, Approved, Rejected, Completed)
 * - Track payment ledger: In Process (pending acceptance), Earned (approved), ₹0 (rejected), and Paid.
 */

const { getPromoterLedger } = require('../../services/authService');
const { getActiveInfluencers, getActivePromotionTypes } = require('../../services/advertisementService');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderPromoterDashboard(promoterUser) {
  const ledger = getPromoterLedger(promoterUser.promoterId);
  const influencers = getActiveInfluencers();
  const promotionTypes = getActivePromotionTypes();
  const comm = promoterUser.commissionStructure || { video: 500, banner: 300, both: 800, influencer: 500 };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promoter Portal (${promoterUser.promoterId}) | ND30 LIVE</title>
  <link rel="icon" type="image/png" href="/images/nd30_live_logo.png">
  <link rel="stylesheet" href="/css/admin.css">
  <link rel="stylesheet" href="/css/advertisement.css">
  <style>
    body.promoter-body {
      background: #0b0f19;
      color: #f1f5f9;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .promoter-nav {
      background: #111827;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .promoter-main {
      flex: 1;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 24px 20px;
      box-sizing: border-box;
    }

    .promoter-badge-pill {
      font-family: monospace;
      font-weight: 800;
      font-size: 0.95rem;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.35);
      padding: 4px 12px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .metric-card {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 18px;
    }

    .metric-title {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
    }

    .metric-val {
      font-size: 1.55rem;
      font-weight: 800;
      color: #ffffff;
      margin-top: 4px;
    }
  </style>
</head>
<body class="promoter-body">

  <!-- Top Navigation Header -->
  <header class="promoter-nav">
    <div style="display: flex; align-items: center; gap: 14px;">
      <a href="/as/">
        <img src="/images/nd30_live_logo.png" alt="ND30 LIVE" style="height: 36px; max-width: 120px; object-fit: contain;">
      </a>
      <span style="font-size: 0.85rem; font-weight: 700; color: #a855f7; border-left: 1px solid rgba(255,255,255,0.15); padding-left: 12px;">
        Promoter Commercial Desk
      </span>
    </div>

    <div style="display: flex; align-items: center; gap: 14px;">
      <span class="promoter-badge-pill">
        🆔 ${escapeHtml(promoterUser.promoterId)}
      </span>
      <span style="font-size: 0.82rem; color: #cbd5e1; font-weight: 600;">
        ${escapeHtml(promoterUser.fullName)}
      </span>
      <a href="/logout" class="btn btn-secondary" style="font-size: 0.76rem; padding: 6px 12px; text-decoration: none;">
        🚪 Logout
      </a>
    </div>
  </header>

  <!-- Main Container -->
  <main class="promoter-main">

    <!-- Hero Welcome Banner with Commission Rates -->
    <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 14px; padding: 22px 26px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);">
      <div>
        <h1 style="font-size: 1.35rem; font-weight: 800; color: #ffffff; margin: 0 0 6px 0;">
          Welcome back, ${escapeHtml(promoterUser.fullName)}!
        </h1>
        <p style="font-size: 0.84rem; color: #94a3b8; margin: 0; line-height: 1.5; max-width: 650px;">
          Submit advertisement requests for local businesses, shops, and brands. Track the progress of each booking and monitor your approved earnings and paid payouts in real time.
        </p>
      </div>

      <!-- Assigned Payout Structure Card -->
      <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 10px; padding: 12px 16px;">
        <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: #a855f7; font-weight: 700; margin-bottom: 6px;">
          Your Approved Payout Rates (Per Accepted Ad):
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 0.78rem; color: #cbd5e1;">
          <div>ND30 Video: <strong style="color: #22c55e;">₹${comm.video || 500}</strong></div>
          <div>ND30 Banner: <strong style="color: #22c55e;">₹${comm.banner || 300}</strong></div>
          <div>Both (Video+Banner): <strong style="color: #22c55e;">₹${comm.both || 800}</strong></div>
          <div>Influencer Video: <strong style="color: #22c55e;">₹${comm.influencer || 500}</strong></div>
        </div>
      </div>
    </div>

    <!-- Metric Cards Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px;">
      <div class="metric-card">
        <div class="metric-title">Total Forms Submitted</div>
        <div class="metric-val">${ledger.metrics.totalSubmissions}</div>
      </div>

      <div class="metric-card" style="border-color: rgba(234, 179, 8, 0.3);">
        <div class="metric-title" style="color: #eab308;">In Process (Pending Review)</div>
        <div class="metric-val" style="color: #eab308;">₹${Number(ledger.metrics.inProcessEarnings).toLocaleString('en-IN')}</div>
        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">Awaiting editorial acceptance</div>
      </div>

      <div class="metric-card" style="border-color: rgba(59, 130, 246, 0.3);">
        <div class="metric-title" style="color: #38bdf8;">Earned (Approved Ads)</div>
        <div class="metric-val" style="color: #38bdf8;">₹${Number(ledger.metrics.earnedEarnings).toLocaleString('en-IN')}</div>
        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">Earned for approved bookings</div>
      </div>

      <div class="metric-card" style="border-color: rgba(34, 197, 94, 0.3);">
        <div class="metric-title" style="color: #22c55e;">Total Paid Out</div>
        <div class="metric-val" style="color: #22c55e;">₹${Number(ledger.metrics.paidEarnings).toLocaleString('en-IN')}</div>
        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">Settled by admin desk</div>
      </div>

      <div class="metric-card" style="border-color: rgba(168, 85, 247, 0.3);">
        <div class="metric-title" style="color: #c084fc;">Balance Payable</div>
        <div class="metric-val" style="color: #c084fc;">₹${Number(ledger.metrics.pendingPayout).toLocaleString('en-IN')}</div>
        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">Earned minus Paid</div>
      </div>
    </div>

    <!-- Section Tabs -->
    <div style="display: flex; gap: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 24px; padding-bottom: 8px;">
      <button type="button" class="btn btn-tab active" onclick="switchPromoterTab('tabSubmissions', this)">
        <span>📑</span> My Submissions & Payout Status (${ledger.bookings.length})
      </button>
      <button type="button" class="btn btn-tab" onclick="switchPromoterTab('tabSubmitForm', this)">
        <span>➕</span> Submit Advertisement Form
      </button>
    </div>

    <!-- TAB 1: SUBMISSIONS & EARNINGS LEDGER -->
    <div id="tabSubmissions" class="promoter-tab-pane">
      <div style="background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
        ${ledger.bookings.length === 0 ? `
          <div style="padding: 48px 20px; text-align: center; color: #94a3b8;">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">📢</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: #ffffff;">No advertisements submitted yet</div>
            <p style="font-size: 0.84rem; margin-top: 4px; max-width: 440px; margin-left: auto; margin-right: auto;">
              Click on <strong>"Submit Advertisement Form"</strong> to book your first advertisement campaign and earn your commission.
            </p>
          </div>
        ` : `
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.84rem;">
              <thead>
                <tr style="background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.5px;">
                  <th style="padding: 12px 16px;">Booking ID & Date</th>
                  <th style="padding: 12px 16px;">Business / Advertiser</th>
                  <th style="padding: 12px 16px;">Promotion Format</th>
                  <th style="padding: 12px 16px;">Form Status</th>
                  <th style="padding: 12px 16px;">Commission</th>
                  <th style="padding: 12px 16px;">Payment Status</th>
                </tr>
              </thead>
              <tbody>
                ${ledger.bookings.map(b => {
                  const bStatus = (b.status || 'Pending').toLowerCase();
                  const cStatus = (b.commission_status || 'In Process').toLowerCase();
                  const isPaid = cStatus === 'paid';
                  const isEarned = cStatus === 'earned';
                  const isRejected = bStatus === 'rejected' || cStatus === 'rejected';

                  let statusBadgeClass = 'badge-warning';
                  if (bStatus === 'approved') statusBadgeClass = 'badge-info';
                  else if (bStatus === 'completed') statusBadgeClass = 'badge-success';
                  else if (bStatus === 'rejected') statusBadgeClass = 'badge-danger';

                  return `
                  <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <td style="padding: 14px 16px;">
                      <strong style="font-family: monospace; color: #38bdf8;">${b.booking_id}</strong>
                      <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                        ${new Date(b.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>

                    <td style="padding: 14px 16px;">
                      <div style="font-weight: 700; color: #ffffff;">${escapeHtml(b.business_name)}</div>
                      <div style="font-size: 0.74rem; color: #94a3b8;">${escapeHtml(b.contact_name)} • +91 ${escapeHtml(b.mobile_number)}</div>
                      <div style="font-size: 0.72rem; color: #64748b;">${escapeHtml(b.village_town)}, ${escapeHtml(b.district)}</div>
                    </td>

                    <td style="padding: 14px 16px;">
                      <div style="font-weight: 600; color: ${b.partner_type === 'nd30' ? '#f87171' : '#c084fc'};">
                        ${b.partner_type === 'nd30' ? '📺 ND30 Live' : '🌟 ' + escapeHtml(b.influencer_name)}
                      </div>
                      <div style="font-size: 0.74rem; color: #cbd5e1;">${escapeHtml(b.promotion_type)}</div>
                    </td>

                    <td style="padding: 14px 16px;">
                      <span class="badge ${statusBadgeClass}" style="text-transform: capitalize; font-size: 0.72rem; padding: 4px 8px;">
                        ${b.status}
                      </span>
                      ${b.admin_notes ? `
                        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 3px; max-width: 180px;">
                          Note: ${escapeHtml(b.admin_notes)}
                        </div>
                      ` : ''}
                    </td>

                    <td style="padding: 14px 16px;">
                      <strong style="font-size: 0.95rem; color: ${isRejected ? '#64748b' : '#22c55e'};">
                        ₹${isRejected ? 0 : Number(b.commission_amount || 0).toLocaleString('en-IN')}
                      </strong>
                    </td>

                    <td style="padding: 14px 16px;">
                      ${isPaid ? `
                        <span style="background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.35); padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.74rem;">
                          ✅ Paid
                        </span>
                        ${b.commission_payment_ref ? `
                          <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 3px;">
                            ${escapeHtml(b.commission_payment_ref)}
                          </div>
                        ` : ''}
                      ` : (isEarned ? `
                        <span style="background: rgba(59, 130, 246, 0.15); color: #38bdf8; border: 1px solid rgba(59, 130, 246, 0.35); padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.74rem;">
                          🎯 Earned (Awaiting Payout)
                        </span>
                      ` : (isRejected ? `
                        <span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.35); padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.74rem;">
                          ❌ ₹0 (Ad Rejected)
                        </span>
                      ` : `
                        <span style="background: rgba(234, 179, 8, 0.15); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.35); padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.74rem;">
                          ⏳ In Process (Pending Review)
                        </span>
                      `))}
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

    <!-- TAB 2: SUBMIT ADVERTISEMENT FORM -->
    <div id="tabSubmitForm" class="promoter-tab-pane" style="display: none;">
      <div style="background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 26px; max-width: 780px;">
        <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin: 0;">
              Submit Client Advertisement Form
            </h2>
            <span style="font-size: 0.76rem; color: #94a3b8;">
              This submission is automatically tracked under your Promoter ID: <strong style="color: #38bdf8; font-family: monospace;">${escapeHtml(promoterUser.promoterId)}</strong>.
            </span>
          </div>
          <span class="badge badge-purple">Promoter Entry</span>
        </div>

        <form id="promoterAdForm" onsubmit="handlePromoterBookingSubmit(event)" style="display: flex; flex-direction: column; gap: 18px;">
          <input type="hidden" id="pFormPromoterId" value="${escapeHtml(promoterUser.promoterId)}">

          <!-- 1. Partner Selection -->
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">Select Promotion Partner *</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <label id="pCardNd30" style="border: 2px solid #3b82f6; background: rgba(59, 130, 246, 0.12); border-radius: 8px; padding: 12px; cursor: pointer; display: block;">
                <input type="radio" name="pPartnerType" value="nd30" checked onchange="handlePromoterPartnerToggle('nd30')" style="margin-right: 6px;">
                <strong style="color: #ffffff;">ND30 Live Official</strong>
                <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 3px;">News broadcast & banner placement</div>
              </label>

              <label id="pCardInfluencer" style="border: 2px solid rgba(255,255,255,0.15); background: rgba(15,23,42,0.6); border-radius: 8px; padding: 12px; cursor: pointer; display: block;">
                <input type="radio" name="pPartnerType" value="influencer" onchange="handlePromoterPartnerToggle('influencer')" style="margin-right: 6px;">
                <strong style="color: #ffffff;">Other Listed Influencer</strong>
                <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 3px;">Top regional verified creators</div>
              </label>
            </div>
          </div>

          <!-- 2. Promotion Format -->
          <div id="pNd30PromoBox">
            <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Promotion Format *</label>
            <select id="pNd30PromoSelect" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem;">
              ${promotionTypes.map(pt => `
                <option value="${pt.title}">${pt.title} — Client Charge: ₹${Number(pt.charge).toLocaleString('en-IN')}</option>
              `).join('')}
            </select>
          </div>

          <div id="pInfluencerPromoBox" style="display: none;">
            <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Select Influencer * (Fixed to Promotion Video)</label>
            <select id="pInfluencerSelect" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem;">
              <option value="" disabled selected>-- Select an Influencer --</option>
              ${influencers.map(inf => `
                <option value="${inf.id}">${inf.name} (${inf.platform} • ${inf.followers}) — Rate: ₹${Number(inf.charge).toLocaleString('en-IN')}</option>
              `).join('')}
            </select>
          </div>

          <!-- 3. Client Contact Info -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Contact Person Name *</label>
              <input type="text" id="pContactName" placeholder="Client Name" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;">
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Mobile Number *</label>
              <input type="tel" id="pMobileNumber" placeholder="10-digit number" maxlength="10" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Email ID *</label>
              <input type="email" id="pEmail" placeholder="client@example.com" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;">
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Business / Shop Name *</label>
              <input type="text" id="pBusinessName" placeholder="e.g. Royal Cafe" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;">
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Business Description (Optional)</label>
            <textarea id="pBusinessDesc" rows="2" placeholder="Brief notes about client business or product..." style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;"></textarea>
          </div>

          <!-- 4. Address -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Village / Town *</label>
              <input type="text" id="pVillageTown" placeholder="e.g. Fancy Bazar" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;">
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">District *</label>
              <input type="text" id="pDistrict" placeholder="e.g. Kamrup Metro" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">State *</label>
              <input type="text" id="pState" value="Assam" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;">
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">PIN Code *</label>
              <input type="text" id="pPincode" placeholder="6-digit PIN" maxlength="6" required style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;">
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <button type="submit" id="pSubmitBtn" class="btn btn-primary" style="padding: 11px 26px; font-size: 0.9rem; font-weight: 700;">
              <span>🚀</span> Submit Advertisement Form
            </button>
          </div>
        </form>
      </div>
    </div>

  </main>

  <script>
    function switchPromoterTab(tabId, btn) {
      document.querySelectorAll('.promoter-tab-pane').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
      const activeTab = document.getElementById(tabId);
      if (activeTab) activeTab.style.display = 'block';
      if (btn) btn.classList.add('active');
    }

    function handlePromoterPartnerToggle(type) {
      const cardNd30 = document.getElementById('pCardNd30');
      const cardInf = document.getElementById('pCardInfluencer');
      const boxNd30 = document.getElementById('pNd30PromoBox');
      const boxInf = document.getElementById('pInfluencerPromoBox');

      if (type === 'influencer') {
        cardInf.style.borderColor = '#a855f7';
        cardInf.style.background = 'rgba(168, 85, 247, 0.12)';
        cardNd30.style.borderColor = 'rgba(255,255,255,0.15)';
        cardNd30.style.background = 'rgba(15,23,42,0.6)';
        boxNd30.style.display = 'none';
        boxInf.style.display = 'block';
      } else {
        cardNd30.style.borderColor = '#3b82f6';
        cardNd30.style.background = 'rgba(59, 130, 246, 0.12)';
        cardInf.style.borderColor = 'rgba(255,255,255,0.15)';
        cardInf.style.background = 'rgba(15,23,42,0.6)';
        boxNd30.style.display = 'block';
        boxInf.style.display = 'none';
      }
    }

    async function handlePromoterBookingSubmit(event) {
      event.preventDefault();
      const btn = document.getElementById('pSubmitBtn');
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Submitting...';

      const promoterId = document.getElementById('pFormPromoterId').value;
      const partnerType = document.querySelector('input[name="pPartnerType"]:checked')?.value || 'nd30';
      const contactName = document.getElementById('pContactName').value.trim();
      const mobileNumber = document.getElementById('pMobileNumber').value.trim();
      const email = document.getElementById('pEmail').value.trim();
      const businessName = document.getElementById('pBusinessName').value.trim();
      const businessDesc = document.getElementById('pBusinessDesc').value.trim();
      const villageTown = document.getElementById('pVillageTown').value.trim();
      const district = document.getElementById('pDistrict').value.trim();
      const state = document.getElementById('pState').value.trim();
      const pincode = document.getElementById('pPincode').value.trim();

      let promotionType = 'Promotion Video';
      let influencerId = null;

      if (partnerType === 'influencer') {
        influencerId = document.getElementById('pInfluencerSelect')?.value;
        if (!influencerId) {
          alert('Please select an influencer from the dropdown.');
          btn.disabled = false;
          btn.innerHTML = '<span>🚀</span> Submit Advertisement Form';
          return;
        }
      } else {
        promotionType = document.getElementById('pNd30PromoSelect')?.value || 'Promotion Video';
      }

      try {
        const res = await fetch('/api/promoter/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promoterId,
            partnerType,
            influencerId,
            promotionType,
            contactName,
            mobileNumber,
            email,
            businessName,
            businessDesc,
            villageTown,
            district,
            state,
            pincode,
            isMobileVerified: 1
          })
        });

        const data = await res.json();
        if (data.success) {
          alert('Advertisement request submitted successfully! Booking ID: ' + data.booking.booking_id);
          window.location.reload();
        } else {
          alert('Error: ' + (data.error || 'Submission failed'));
          btn.disabled = false;
          btn.innerHTML = '<span>🚀</span> Submit Advertisement Form';
        }
      } catch (err) {
        alert('Network request failed: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = '<span>🚀</span> Submit Advertisement Form';
      }
    }
  </script>
</body>
</html>`;
}

module.exports = {
  renderPromoterDashboard
};

