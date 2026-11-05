/**
 * ND30 LIVE - Reporter Applications & Territory Management Admin Dashboard
 * Manage recruitment applications, approve/issue Press ID cards, and manage reporting areas.
 */

const { db } = require('../../database/db');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderReporterApplicationsAdmin() {
  const applications = db.prepare('SELECT * FROM reporter_applications ORDER BY id DESC').all();
  const areas = db.prepare('SELECT * FROM reporting_areas WHERE is_active = 1 ORDER BY name COLLATE NOCASE ASC').all();

  // Group all approved applications by area
  const areaRolesMap = {};
  applications.filter(a => a.status === 'approved' && a.area).forEach(a => {
    const key = a.area.toLowerCase();
    if (!areaRolesMap[key]) areaRolesMap[key] = [];
    const r = a.join_as || a.designation || 'Reporter';
    areaRolesMap[key].push(`${r}: ${a.full_name}`);
  });

  const totalCount = applications.length;
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  const totalAreasCount = areas.length;
  const occupiedAreasCount = Object.keys(areaRolesMap).length;
  const availableAreasCount = Math.max(0, totalAreasCount - occupiedAreasCount);

  return `
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
    <div>
      <h2 style="font-size:1.45rem; font-weight:800; display:flex; align-items:center; gap:8px;">
        <span>🎙️</span> Join Us Recruitment & Area Management
      </h2>
      <p style="font-size:0.85rem; color:var(--admin-muted); margin:4px 0 0 0;">
        Review applications for <strong>Reporter, Camera Person, Photographer, Editor & Voice-Over</strong>, manage coverage territories, and issue digital Press IDs.
      </p>
    </div>
    <div style="display:flex; gap:12px;">
      <a href="/as/" target="_blank" class="btn btn-secondary btn-sm">🌐 Test Public "Join us" Popup ↗</a>
    </div>
  </div>

  <!-- Territory & Reporting Area Management Section -->
  <div style="background:#111827; border:1px solid #1f2937; border-radius:12px; padding:22px 24px; margin-bottom:28px; box-shadow:0 4px 20px rgba(0,0,0,0.3);">
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:16px; border-bottom:1px solid #1f2937; padding-bottom:14px;">
      <div>
        <h3 style="font-size:1.15rem; font-weight:800; color:#fff; display:flex; align-items:center; gap:8px; margin:0;">
          <span>📍</span> Reporting Areas (${totalAreasCount} Territories Total)
        </h3>
        <p style="font-size:0.82rem; color:#9ca3af; margin:4px 0 0 0;">
          Enter any area name to immediately add it to the frontend "Join us" area dropdown (arranged A to Z).
        </p>
      </div>

      <!-- Add Reporting Area Form -->
      <form id="addReportingAreaForm" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <input 
          type="text" 
          id="newAreaNameInput" 
          placeholder="Enter new Area Name (e.g. Kokrajhar Rural)..." 
          required 
          style="background:#1e293b; border:1px solid #334155; color:#fff; padding:8px 14px; border-radius:6px; font-size:0.85rem; min-width:240px;"
        >
        <button type="submit" id="btnAddAreaSubmit" class="btn btn-primary btn-sm" style="font-weight:700; padding:8px 16px;">
          + Add Reporting Area
        </button>
      </form>
    </div>

    <!-- Quick Territory Status Stats -->
    <div style="display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap;">
      <span style="background:rgba(56, 189, 248, 0.15); border:1px solid rgba(56, 189, 248, 0.3); color:#38bdf8; font-size:0.8rem; font-weight:700; padding:4px 12px; border-radius:20px;">
        🌐 Total Territories: ${totalAreasCount}
      </span>
      <span style="background:rgba(34, 197, 94, 0.15); border:1px solid rgba(34, 197, 94, 0.3); color:#86efac; font-size:0.8rem; font-weight:700; padding:4px 12px; border-radius:20px;">
        ✓ Available Territories: ${availableAreasCount}
      </span>
      <span style="background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239, 68, 68, 0.3); color:#fca5a5; font-size:0.8rem; font-weight:700; padding:4px 12px; border-radius:20px;">
        ⚠️ Areas with Appointed Roles: ${occupiedAreasCount}
      </span>
    </div>

    <!-- Area Badges Grid -->
    <div id="areaBadgesContainer" style="display:flex; flex-wrap:wrap; gap:8px; max-height:160px; overflow-y:auto; padding-right:6px;">
      ${areas.map(a => {
        const appointed = areaRolesMap[a.name.toLowerCase()] || [];
        const isOccupied = appointed.length > 0;
        return `
          <div style="display:inline-flex; align-items:center; gap:6px; background:${isOccupied ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.8)'}; border:1px solid ${isOccupied ? 'rgba(56, 189, 248, 0.4)' : '#334155'}; padding:4px 10px; border-radius:6px; font-size:0.78rem; color:${isOccupied ? '#bae6fd' : '#cbd5e1'};">
            <span>${isOccupied ? '🔵' : '🟢'}</span>
            <strong>${escapeHtml(a.name)}</strong>
            ${isOccupied ? `<span style="font-size:0.7rem; color:#38bdf8;" title="${escapeHtml(appointed.join(' | '))}">(${escapeHtml(appointed.join(', '))})</span>` : ''}
            <button type="button" class="btn-delete-area" data-area-id="${a.id}" data-area-name="${escapeHtml(a.name)}" title="Remove Area" style="background:none; border:none; color:#64748b; cursor:pointer; font-size:0.85rem; padding:0 2px; line-height:1;">&times;</button>
          </div>
        `;
      }).join('')}
    </div>
  </div>

  <!-- Status Filter Pills -->
  <div style="display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap;">
    <span class="badge filter-pill active" data-filter="all" style="font-size:0.85rem; padding:8px 14px; background:rgba(255,255,255,0.12); color:#fff; cursor:pointer;">
      All Applications (${totalCount})
    </span>
    <span class="badge filter-pill badge-warning" data-filter="pending" style="font-size:0.85rem; padding:8px 14px; cursor:pointer;">
      Pending Review (${pendingCount})
    </span>
    <span class="badge filter-pill badge-success" data-filter="approved" style="font-size:0.85rem; padding:8px 14px; cursor:pointer;">
      Approved (${approvedCount})
    </span>
    <span class="badge filter-pill badge-danger" data-filter="rejected" style="font-size:0.85rem; padding:8px 14px; cursor:pointer;">
      Rejected (${rejectedCount})
    </span>
  </div>

  <!-- Applications Table -->
  <div class="admin-table-container">
    <table class="admin-table" id="reporterTable">
      <thead>
        <tr>
          <th>Role & Area</th>
          <th>Applicant & Contact</th>
          <th>Residential Location</th>
          <th>Education & Media Exp</th>
          <th>Documents (< 1 MB)</th>
          <th>Status & Actions</th>
        </tr>
      </thead>
      <tbody>
        ${applications.length === 0 ? `
          <tr>
            <td colspan="6" style="text-align:center; padding:36px; color:var(--admin-muted);">
              No recruitment applications received yet. Visitors can apply using the "Join us" highlighted tab on any public portal.
            </td>
          </tr>
        ` : applications.map(app => {
          const isPending = app.status === 'pending';
          const isApproved = app.status === 'approved';
          const isRejected = app.status === 'rejected';

          const role = app.join_as || app.designation || 'Reporter';
          const areaName = app.area || 'Unassigned';
          // Check if another approved applicant already holds this EXACT role in this area
          const sameRoleOccupied = applications.some(other => 
            other.status === 'approved' && 
            other.id !== app.id && 
            (other.area || '').toLowerCase() === areaName.toLowerCase() && 
            (other.join_as || other.designation || 'Reporter').toLowerCase() === role.toLowerCase()
          );

          let roleColor = '#dc2626'; // Reporter default red
          if (role === 'Camera Person') roleColor = '#2563eb';
          if (role === 'Photographer') roleColor = '#9333ea';
          if (role === 'Editor') roleColor = '#d97706';
          if (role === 'Voice-Over') roleColor = '#059669';

          return `
            <tr class="reporter-app-row" data-status="${app.status}">
              <td>
                <span style="display:inline-block; background:${roleColor}; color:#fff; font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:14px; text-transform:uppercase; letter-spacing:0.5px;">
                  ${escapeHtml(role)}
                </span>
                <div style="margin-top:8px;">
                  <span style="font-size:0.7rem; color:var(--admin-muted); display:block; text-transform:uppercase; letter-spacing:0.5px;">APPLIED AREA:</span>
                  <strong style="font-size:0.95rem; color:#38bdf8;">📍 ${escapeHtml(areaName)}</strong>
                </div>
                ${sameRoleOccupied ? `
                  <div style="margin-top:6px; background:rgba(239, 68, 68, 0.15); border:1px solid #ef4444; border-radius:4px; padding:3px 6px; font-size:0.68rem; color:#fca5a5;">
                    ⚠️ Active ${escapeHtml(role)} already in this area
                  </div>
                ` : `
                  <div style="margin-top:6px; background:rgba(34, 197, 94, 0.1); border:1px solid rgba(34, 197, 94, 0.3); border-radius:4px; padding:3px 6px; font-size:0.68rem; color:#86efac;">
                    ✓ ${escapeHtml(role)} Open / Applicable
                  </div>
                `}
              </td>
              <td>
                <div style="font-weight:700; font-size:0.95rem; color:#fff;">
                  ${escapeHtml(app.full_name)}
                </div>
                <div style="font-size:0.75rem; color:var(--admin-muted); margin-top:2px;">
                  Father: ${escapeHtml(app.father_name)}
                </div>
                <div style="margin-top:6px; display:flex; flex-direction:column; gap:2px; font-size:0.8rem;">
                  <a href="tel:${escapeHtml(app.mobile_no)}" style="color:#22c55e; font-weight:600; text-decoration:none;">
                    📞 ${escapeHtml(app.mobile_no)}
                  </a>
                  <a href="mailto:${escapeHtml(app.email)}" style="color:#58a6ff; text-decoration:none;">
                    ✉️ ${escapeHtml(app.email)}
                  </a>
                </div>
                ${app.press_id_code ? `
                  <div style="margin-top:8px; background:rgba(56, 189, 248, 0.1); border:1px solid rgba(56, 189, 248, 0.3); border-radius:6px; padding:6px 8px;">
                    <span style="font-size:0.68rem; color:#94a3b8; display:block;">OFFICIAL PRESS ID:</span>
                    <code style="color:#38bdf8; font-weight:800; font-size:0.82rem;">${escapeHtml(app.press_id_code)}</code>
                    <div style="margin-top:4px;">
                      <a href="/verify-press-id/${app.press_id_code}" target="_blank" style="color:#facc15; font-size:0.75rem; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                        <span>🪪</span> View Digital Press Card ↗
                      </a>
                    </div>
                  </div>
                ` : ''}
              </td>
              <td>
                <div style="font-size:0.85rem; font-weight:600; color:var(--admin-text);">
                  ${escapeHtml(app.district)}, ${escapeHtml(app.state)}
                </div>
                <div style="font-size:0.78rem; color:var(--admin-muted); margin-top:4px; line-height:1.4;">
                  Vill/Town: ${escapeHtml(app.village_town || 'N/A')}<br>
                  PO: ${escapeHtml(app.post_office || 'N/A')} | PS: ${escapeHtml(app.police_station || 'N/A')}<br>
                  PIN: <code>${escapeHtml(app.pin_code || 'N/A')}</code>
                </div>
              </td>
              <td>
                <span class="badge badge-purple" style="font-size:0.75rem;">
                  ${escapeHtml(app.education)}
                </span>
                <div style="font-size:0.78rem; color:var(--admin-text); margin-top:6px;">
                  <strong>Exp:</strong> ${escapeHtml(app.experience || 'Fresher')}
                </div>
                <div style="font-size:0.75rem; color:var(--admin-muted); margin-top:2px;">
                  <strong>Prev:</strong> ${escapeHtml(app.previous_channel || 'None')}
                </div>
              </td>
              <td>
                <div style="display:flex; flex-direction:column; gap:4px; font-size:0.78rem;">
                  ${app.adhar_file ? `
                    <a href="${app.adhar_file}" target="_blank" style="color:#38bdf8; text-decoration:none;">
                      🪪 Aadhar Card ↗
                    </a>
                  ` : '<span style="color:#64748b;">No Aadhar</span>'}

                  ${app.pan_file ? `
                    <a href="${app.pan_file}" target="_blank" style="color:#38bdf8; text-decoration:none;">
                      💳 PAN Card ↗
                    </a>
                  ` : '<span style="color:#64748b;">No PAN</span>'}

                  ${app.education_certificate_file ? `
                    <a href="${app.education_certificate_file}" target="_blank" style="color:#38bdf8; text-decoration:none;">
                      🎓 Education Cert ↗
                    </a>
                  ` : '<span style="color:#64748b;">No Cert</span>'}

                  ${app.photo_file ? `
                    <a href="${app.photo_file}" target="_blank" style="color:#38bdf8; text-decoration:none;">
                      📷 Photo ↗
                    </a>
                  ` : '<span style="color:#64748b;">No Photo</span>'}

                  ${app.biodata_file ? `
                    <a href="${app.biodata_file}" target="_blank" style="color:#38bdf8; text-decoration:none;">
                      📄 Biodata / CV ↗
                    </a>
                  ` : '<span style="color:#64748b;">No Biodata</span>'}
                </div>
              </td>
              <td style="white-space:nowrap;">
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <span class="badge ${isApproved ? 'badge-success' : (isRejected ? 'badge-danger' : 'badge-warning')}" style="text-transform:capitalize; width:fit-content;">
                    ${app.status}
                  </span>
                  ${app.status_email_sent ? `
                    <span style="font-size:0.68rem; color:#22c55e;">✓ Auto-email sent to applicant</span>
                  ` : (app.status !== 'pending' ? `
                    <span style="font-size:0.68rem; color:#f59e0b;">⏳ Email queued</span>
                  ` : '')}
                  <div style="display:flex; gap:4px; margin-top:4px; flex-wrap:wrap;">
                    ${!isApproved ? `
                      <button type="button" class="btn btn-success btn-sm btn-update-reporter-status" data-app-id="${app.id}" data-status="approved" title="Approve Applicant & Issue Official Press ID Card">
                        ✓ Approve & Issue ID
                      </button>
                    ` : `
                      <a href="/verify-press-id/${app.press_id_code}" target="_blank" class="btn btn-secondary btn-sm" title="View Digital Press Card">
                        🪪 View ID
                      </a>
                    `}
                    ${!isRejected ? `
                      <button type="button" class="btn btn-danger btn-sm btn-update-reporter-status" data-app-id="${app.id}" data-status="rejected" title="Reject Application">
                        ✕ Reject
                      </button>
                    ` : ''}
                  </div>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // 1. Add Reporting Area Form Handler
      const addAreaForm = document.getElementById('addReportingAreaForm');
      const newAreaInput = document.getElementById('newAreaNameInput');
      const btnAddArea = document.getElementById('btnAddAreaSubmit');

      if (addAreaForm) {
        addAreaForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const name = newAreaInput.value.trim();
          if (!name) return;

          btnAddArea.disabled = true;
          btnAddArea.textContent = 'Adding...';

          try {
            const res = await fetch('/api/admin/reporting-areas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name })
            });
            const data = await res.json();
            if (data.success) {
              alert('✅ ' + data.message);
              window.location.reload();
            } else {
              alert('❌ ' + (data.error || 'Failed to add area'));
              btnAddArea.disabled = false;
              btnAddArea.textContent = '+ Add Reporting Area';
            }
          } catch (err) {
            alert('❌ Network error: ' + err.message);
            btnAddArea.disabled = false;
            btnAddArea.textContent = '+ Add Reporting Area';
          }
        });
      }

      // 2. Delete Reporting Area Handler
      document.querySelectorAll('.btn-delete-area').forEach(btn => {
        btn.addEventListener('click', async () => {
          const areaId = btn.getAttribute('data-area-id');
          const areaName = btn.getAttribute('data-area-name');
          if (!confirm('Are you sure you want to remove "' + areaName + '" from reporting areas?')) {
            return;
          }

          try {
            const res = await fetch('/api/admin/reporting-areas/' + areaId, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
              window.location.reload();
            } else {
              alert('Error removing area: ' + data.error);
            }
          } catch (err) {
            alert('Network error: ' + err.message);
          }
        });
      });

      // 3. Status Filter Tabs
      const pills = document.querySelectorAll('.filter-pill');
      const rows = document.querySelectorAll('.reporter-app-row');

      pills.forEach(pill => {
        pill.addEventListener('click', () => {
          pills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          const filter = pill.getAttribute('data-filter');

          rows.forEach(r => {
            if (filter === 'all' || r.getAttribute('data-status') === filter) {
              r.style.display = '';
            } else {
              r.style.display = 'none';
            }
          });
        });
      });

      // 4. Status Update (Approve / Reject)
      document.querySelectorAll('.btn-update-reporter-status').forEach(btn => {
        btn.addEventListener('click', async () => {
          const appId = btn.getAttribute('data-app-id');
          const status = btn.getAttribute('data-status');
          const isApprove = status === 'approved';

          let reason = '';
          if (!isApprove) {
            reason = prompt('Optional: Enter rejection reason for the applicant email:', 'District quota reached or credentials incomplete.');
            if (reason === null) return;
          } else {
            if (!confirm('Approve this application, issue official Digital Press ID Card with Secured QR Code, and dispatch email notification?')) {
              return;
            }
          }

          btn.disabled = true;
          btn.textContent = 'Processing...';

          try {
            const res = await fetch('/api/admin/reporters/status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ applicationId: appId, status, reason })
            });

            const data = await res.json();
            if (data.success) {
              alert(isApprove ? '🎉 Approved! Press ID: ' + (data.pressIdCode || 'Generated') + ' issued and email dispatched!' : 'Application updated to rejected.');
              window.location.reload();
            } else {
              alert('Error: ' + (data.error || 'Failed to update'));
              btn.disabled = false;
              btn.textContent = isApprove ? '✓ Approve & Issue ID' : '✕ Reject';
            }
          } catch (err) {
            alert('Network error: ' + err.message);
            btn.disabled = false;
          }
        });
      });
    });
  </script>
  `;
}

module.exports = {
  renderReporterApplicationsAdmin
};
