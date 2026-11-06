/**
 * ND30 LIVE - "Roles" Section in Backend
 * Role-Based Access Control (RBAC):
 * - Approved Editor creation with custom allowed modules
 * - Promoter creation with auto-generated ID: ND30-PRO-0000 (Random numbers)
 * - Commission structure setup per promotion type
 * - Admin password creation & change for Editor and Promoter
 * - Commission payouts ledger with "Mark Paid" control
 */

const { getAllUsers } = require('../../services/authService');
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

const AVAILABLE_MODULES = [
  { slug: 'dashboard', name: 'Dashboard (Overview)', icon: '📊' },
  { slug: 'editor', name: '3-Language News Publisher', icon: '✍️' },
  { slug: 'articles', name: 'All News Articles', icon: '📄' },
  { slug: 'notice', name: 'Notice Panel Studio', icon: '🔔' },
  { slug: 'facebook', name: 'Facebook Import Review', icon: '📱' },
  { slug: 'reporters', name: 'Join Us & Recruitment Areas', icon: '🎙️' },
  { slug: 'advertisements', name: 'Advertisements & Bookings', icon: '📢' },
  { slug: 'social-qr', name: 'Social QR Channels', icon: '📲' },
  { slug: 'integrations', name: 'External Integrations', icon: '🔗' },
  { slug: 'ifttt', name: 'IFTTT Automation Studio', icon: '⚡' },
  { slug: 'adsense', name: 'Google AdSense Placements', icon: '💰' }
];

function renderRolesAdmin(activeSubTab = 'users') {
  const users = getAllUsers('all');
  const editors = users.filter(u => u.role === 'editor');
  const promoters = users.filter(u => u.role === 'promoter');

  // Approved Editors Query from reporter_applications
  const approvedEditors = db.prepare(`
    SELECT a.id, a.full_name, a.mobile_no, a.email, a.village_town, a.district, a.state, a.pin_code, a.area, a.status, a.join_as, a.designation, a.press_id_code,
           u.id as user_id, u.username as user_username, u.permissions as user_permissions, u.is_active as user_is_active
    FROM reporter_applications a
    LEFT JOIN users u ON (u.reporter_app_id = a.id OR LOWER(u.email) = LOWER(a.email))
    WHERE a.status = 'approved' AND (LOWER(TRIM(a.join_as)) LIKE '%editor%' OR LOWER(TRIM(a.designation)) LIKE '%editor%')
    ORDER BY a.full_name ASC
  `).all();

  // Promoter Commissions Query
  const promoterBookings = db.prepare(`
    SELECT b.*, u.full_name as promoter_name, u.mobile as promoter_phone
    FROM advertisement_bookings b
    LEFT JOIN users u ON UPPER(b.promoter_id) = UPPER(u.promoter_id)
    WHERE b.promoter_id IS NOT NULL AND b.promoter_id != ''
    ORDER BY b.created_at DESC
  `).all();

  const totalCommissionsEarned = promoterBookings
    .filter(b => b.commission_status === 'Earned' || b.commission_status === 'Paid')
    .reduce((sum, b) => sum + (parseFloat(b.commission_amount) || 0), 0);

  const totalCommissionsPaid = promoterBookings
    .filter(b => b.commission_status === 'Paid')
    .reduce((sum, b) => sum + (parseFloat(b.commission_amount) || 0), 0);

  const pendingPayouts = totalCommissionsEarned - totalCommissionsPaid;

  return `
  <div class="admin-content-container">

    <!-- Top Notice Banner -->
    <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);">
      <div>
        <h2 style="font-size: 1.25rem; font-weight: 800; color: #ffffff; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
          <span>👥</span> User Roles, Permissions & Promoter Management
        </h2>
        <p style="color: #94a3b8; font-size: 0.88rem; line-height: 1.5; margin: 0; max-width: 720px;">
          Create role-based accounts for <strong>Approved Editors</strong> with custom module permissions and <strong>Promoters</strong> with auto-generated IDs (<code>ND30-PRO-0000</code>) and tiered commission structures for advertisement collection.
        </p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button type="button" onclick="switchTab('tabCreateUser', document.querySelectorAll('.btn-tab')[1])" class="btn btn-primary" style="font-size: 0.84rem; padding: 9px 16px; display: inline-flex; align-items: center; gap: 6px;">
          <span>➕</span> Create New User / Promoter
        </button>
      </div>
    </div>

    <!-- Quick Stats Metric Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 28px;">
      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 16px;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">Total Accounts</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: #ffffff; margin-top: 4px;">${users.length}</div>
      </div>

      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 10px; padding: 16px;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.5px;">Approved Editors</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: #38bdf8; margin-top: 4px;">${editors.length}</div>
      </div>

      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 10px; padding: 16px;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: #c084fc; letter-spacing: 0.5px;">Active Promoters</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: #c084fc; margin-top: 4px;">${promoters.length}</div>
      </div>

      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 10px; padding: 16px;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: #eab308; letter-spacing: 0.5px;">Pending Promoter Payouts</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: #eab308; margin-top: 4px;">₹${Number(pendingPayouts).toLocaleString('en-IN')}</div>
      </div>
    </div>

    <!-- Sub-Navigation Tabs -->
    <div style="display: flex; gap: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px;">
      <button type="button" class="btn btn-tab active" onclick="switchTab('tabUsers', this)">
        <span>👥</span> User Directory (${users.length})
      </button>
      <button type="button" class="btn btn-tab" onclick="switchTab('tabCreateUser', this)">
        <span>➕</span> Create Editor / Promoter
      </button>
      <button type="button" class="btn btn-tab" onclick="switchTab('tabPayouts', this)">
        <span>💸</span> Promoter Commissions & Payouts (${promoterBookings.length})
      </button>
    </div>

    <!-- TAB 1: USERS DIRECTORY -->
    <div id="tabUsers" class="admin-tab-pane active">
      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.84rem;">
            <thead>
              <tr style="background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.5px;">
                <th style="padding: 12px 16px;">User & Identifier</th>
                <th style="padding: 12px 16px;">Role</th>
                <th style="padding: 12px 16px;">Permissions / Payment Structure</th>
                <th style="padding: 12px 16px;">Contact</th>
                <th style="padding: 12px 16px;">Status</th>
                <th style="padding: 12px 16px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => {
                const isPromoter = u.role === 'promoter';
                const isEditor = u.role === 'editor';
                const isAdmin = u.role === 'admin';

                return `
                <tr id="user-row-${u.id}" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                  <td style="padding: 14px 16px;">
                    <div style="font-weight: 700; color: #ffffff; font-size: 0.92rem;">
                      ${escapeHtml(u.full_name)}
                    </div>
                    <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;">
                      @${escapeHtml(u.username)}
                    </div>
                    ${isPromoter ? `
                      <div style="margin-top: 4px;">
                        <span style="font-family: monospace; font-size: 0.84rem; font-weight: 800; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3);">
                          🆔 ${escapeHtml(u.promoter_id)}
                        </span>
                      </div>
                    ` : ''}
                    ${isEditor && u.press_id_code ? `
                      <div style="margin-top: 4px;">
                        <span style="font-family: monospace; font-size: 0.76rem; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3);">
                          🆔 ${escapeHtml(u.press_id_code)}
                        </span>
                      </div>
                    ` : ''}
                  </td>

                  <td style="padding: 14px 16px;">
                    <span class="badge ${isAdmin ? 'badge-danger' : (isEditor ? 'badge-primary' : 'badge-purple')}" style="text-transform: uppercase; font-size: 0.72rem; font-weight: 700; padding: 4px 10px;">
                      ${isAdmin ? 'Super Admin' : (isEditor ? 'Approved Editor' : 'Promoter')}
                    </span>
                  </td>

                  <td style="padding: 14px 16px;">
                    ${isAdmin ? `
                      <span style="color: #22c55e; font-size: 0.78rem;">⭐ Full System Access</span>
                    ` : (isEditor ? `
                      <div style="max-width: 280px; display: flex; flex-wrap: wrap; gap: 4px;">
                        ${(u.permissions || []).map(p => `
                          <span style="font-size: 0.68rem; background: rgba(255,255,255,0.06); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 1px 6px;">
                            ${escapeHtml(p)}
                          </span>
                        `).join('')}
                      </div>
                    ` : `
                      <div style="font-size: 0.74rem; color: #cbd5e1; line-height: 1.4;">
                        <div>Video: <strong style="color:#22c55e;">₹${u.commissionStructure.video || 500}</strong> • Banner: <strong style="color:#22c55e;">₹${u.commissionStructure.banner || 300}</strong></div>
                        <div>Both: <strong style="color:#22c55e;">₹${u.commissionStructure.both || 800}</strong> • Influencer: <strong style="color:#22c55e;">₹${u.commissionStructure.influencer || 500}</strong></div>
                      </div>
                    `)}
                  </td>

                  <td style="padding: 14px 16px; font-size: 0.78rem;">
                    <div style="color: #cbd5e1;">✉️ ${escapeHtml(u.email)}</div>
                    ${u.mobile ? `<div style="color: #94a3b8; margin-top: 2px;">📱 ${escapeHtml(u.mobile)}</div>` : ''}
                  </td>

                  <td style="padding: 14px 16px;">
                    <span style="font-size: 0.72rem; font-weight: 700; color: ${u.is_active ? '#22c55e' : '#ef4444'};">
                      ${u.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </td>

                  <td style="padding: 14px 16px; text-align: right;">
                    <div style="display: inline-flex; gap: 6px;">
                      <!-- Change Password Action -->
                      <button type="button" onclick="openChangePasswordModal(${u.id}, '${escapeHtml(u.full_name)}', '${escapeHtml(u.username)}')" style="background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.35); color: #eab308; border-radius: 6px; padding: 5px 10px; font-size: 0.74rem; font-weight: 600; cursor: pointer;" title="Change Password">
                        🔑 Password
                      </button>

                      ${!isAdmin ? `
                        <button type="button" onclick='openEditUserModal(${JSON.stringify(u)})' style="background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); color: #38bdf8; border-radius: 6px; padding: 5px 10px; font-size: 0.74rem; font-weight: 600; cursor: pointer;" title="Edit Access & Rates">
                          ✏️ Edit
                        </button>

                        <button type="button" onclick="handleDeleteUser(${u.id}, '${escapeHtml(u.full_name)}')" style="background: transparent; border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; border-radius: 6px; padding: 5px 8px; font-size: 0.74rem; cursor: pointer;" title="Delete User">
                          🗑️
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: CREATE USER (APPROVED EDITOR OR PROMOTER) -->
    <div id="tabCreateUser" class="admin-tab-pane" style="display:none;">
      <style>
        .approved-editor-item:hover {
          background: rgba(59, 130, 246, 0.12) !important;
          border-color: rgba(59, 130, 246, 0.4) !important;
        }
        .approved-editor-item.active {
          background: rgba(37, 99, 235, 0.22) !important;
          border-color: #3b82f6 !important;
        }
        #editorDropdownItems::-webkit-scrollbar {
          width: 6px;
        }
        #editorDropdownItems::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
      </style>

      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px; max-width: 780px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
          <span>➕</span> Create New Role-Based Account
        </h3>

        <form id="createUserForm" onsubmit="handleCreateUserSubmit(event)" style="display: flex; flex-direction: column; gap: 20px;">

          <!-- Role Selector -->
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #cbd5e1; margin-bottom: 8px;">Select Role Type *</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <label id="roleOptionEditor" style="border: 2px solid #3b82f6; background: rgba(59, 130, 246, 0.12); border-radius: 10px; padding: 14px; cursor: pointer; display: block; transition: all 0.2s;">
                <input type="radio" name="newRole" value="editor" checked onchange="handleRoleTypeToggle('editor')" style="margin-right: 8px;">
                <strong style="color: #ffffff; font-size: 0.95rem;">Approved Editor</strong>
                <p style="margin: 4px 0 0 0; font-size: 0.74rem; color: #94a3b8; line-height: 1.4;">
                  Select accredited editor from Join Us applications and assign allowed newsroom modules.
                </p>
              </label>

              <label id="roleOptionPromoter" style="border: 2px solid rgba(255, 255, 255, 0.15); background: rgba(15, 23, 42, 0.6); border-radius: 10px; padding: 14px; cursor: pointer; display: block; transition: all 0.2s;">
                <input type="radio" name="newRole" value="promoter" onchange="handleRoleTypeToggle('promoter')" style="margin-right: 8px;">
                <strong style="color: #ffffff; font-size: 0.95rem;">Promoter (Ad Collection)</strong>
                <p style="margin: 4px 0 0 0; font-size: 0.74rem; color: #94a3b8; line-height: 1.4;">
                  Collects advertisement bookings. Auto-assigned <code>ND30-PRO-0000</code> ID with custom commission payouts.
                </p>
              </label>
            </div>
          </div>

          <!-- ==========================================
               SECTION: APPROVED EDITOR WORKFLOW
               ========================================== -->
          <div id="sectionApprovedEditorWorkflow" style="display: flex; flex-direction: column; gap: 16px;">
            
            <!-- 1. Searchable Dropdown for Approved Editors -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1; display: flex; align-items: center; gap: 8px;">
                  <span>Select Approved Editor *</span>
                  <span style="font-size: 0.7rem; font-weight: 600; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3);">
                    ${approvedEditors.length} Approved Editors Found
                  </span>
                </label>
                <a href="/admin/reporters" target="_blank" style="font-size: 0.72rem; color: #94a3b8; text-decoration: underline;">
                  View Applications Desk ↗
                </a>
              </div>

              <!-- Custom Dropdown Container -->
              <div style="position: relative;" id="editorDropdownWrapper">
                <!-- Dropdown Trigger Button -->
                <button type="button" id="editorDropdownToggleBtn" onclick="toggleEditorDropdown()" style="width: 100%; background: #0f172a; border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 8px; padding: 12px 16px; color: #ffffff; display: flex; justify-content: space-between; align-items: center; cursor: pointer; text-align: left; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
                  <span id="dropdownSelectedLabel" style="display: flex; align-items: center; gap: 10px; font-size: 0.88rem; color: #cbd5e1;">
                    <span style="font-size: 1.15rem; color: #38bdf8;">🔍</span>
                    <span>Click to select an approved editor...</span>
                  </span>
                  <span id="dropdownArrow" style="font-size: 0.75rem; color: #94a3b8; transition: transform 0.2s;">▼</span>
                </button>

                <!-- Dropdown Menu (With Search Icon and Real-time Filter) -->
                <div id="editorDropdownMenu" style="display: none; position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #0f172a; border: 1px solid rgba(59, 130, 246, 0.5); border-radius: 10px; box-shadow: 0 16px 36px rgba(0, 0, 0, 0.75); z-index: 100; padding: 12px;">
                  
                  <!-- Prominent Search Bar with Search Icon -->
                  <div style="position: relative; margin-bottom: 10px;">
                    <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 1.05rem; color: #38bdf8; pointer-events: none;">🔍</span>
                    <input type="text" id="editorSearchInput" placeholder="Search approved editor by name, district, or Press ID..." oninput="filterApprovedEditors()" style="width: 100%; background: #020617; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 6px; padding: 9px 12px 9px 38px; font-size: 0.86rem; box-sizing: border-box; outline: none;" autocomplete="off">
                  </div>

                  <!-- Scrollable List of Approved Candidates -->
                  <div id="editorDropdownItems" style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
                    ${approvedEditors.length === 0 ? `
                      <div style="padding: 24px 16px; text-align: center; color: #94a3b8;">
                        <div style="font-size: 1.8rem; margin-bottom: 6px;">📋</div>
                        <div style="color: #f59e0b; font-weight: 700; font-size: 0.9rem;">No Approved Editors Available</div>
                        <p style="font-size: 0.76rem; color: #94a3b8; margin: 4px 0 0 0;">
                          Only applicants approved as "Editor" in <a href="/admin/reporters" style="color: #38bdf8; text-decoration: underline;">Join Us</a> appear in this list.
                        </p>
                      </div>
                    ` : approvedEditors.map(a => {
                      const hasAccount = !!a.user_id;
                      const initials = (a.full_name || 'ED').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                      const locationStr = [a.village_town, a.district, a.state].filter(Boolean).join(', ');

                      return `
                      <div class="approved-editor-item"
                           id="dropdown-item-${a.id}"
                           onclick="selectApprovedEditor(${a.id})"
                           data-search="${escapeHtml(((a.full_name || '') + ' ' + (a.press_id_code || '') + ' ' + (a.district || '') + ' ' + (a.village_town || '') + ' ' + (a.email || '')).toLowerCase())}"
                           style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.15s;">
                        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                          <div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #fff; font-weight: 700; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,0.2); flex-shrink: 0;">
                            ${escapeHtml(initials)}
                          </div>
                          <div style="min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                              <strong style="color: #ffffff; font-size: 0.92rem;">${escapeHtml(a.full_name)}</strong>
                              ${a.press_id_code ? `
                                <span style="font-family: monospace; font-size: 0.72rem; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3);">
                                  🆔 ${escapeHtml(a.press_id_code)}
                                </span>
                              ` : ''}
                            </div>
                            <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                              📍 ${escapeHtml(locationStr || a.area || 'Assam')} • ✉️ ${escapeHtml(a.email)} ${a.mobile_no ? `• 📱 ${escapeHtml(a.mobile_no)}` : ''}
                            </div>
                          </div>
                        </div>
                        <div style="text-align: right; flex-shrink: 0; margin-left: 10px;">
                          <span style="font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; ${hasAccount ? 'background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3);' : 'background: rgba(59, 130, 246, 0.15); color: #38bdf8; border: 1px solid rgba(59, 130, 246, 0.3);'}">
                            ${hasAccount ? '● Active Login' : '✨ Ready to Setup'}
                          </span>
                        </div>
                      </div>
                      `;
                    }).join('')}
                  </div>

                  <!-- No Results Found Box -->
                  <div id="editorNoResults" style="display: none; padding: 18px 12px; text-align: center; color: #94a3b8; font-size: 0.8rem;">
                    🔍 No approved editor found matching your search.
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Selected Editor Showcase Details Card -->
            <div id="selectedEditorCard" style="display: none; background: rgba(30, 58, 138, 0.2); border: 2px solid #3b82f6; border-radius: 10px; padding: 16px; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.18);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div id="selectedEditorAvatar" style="width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #1d4ed8, #3b82f6); color: #fff; font-weight: 800; font-size: 1rem; display: flex; align-items: center; justify-content: center; border: 2px solid #60a5fa; flex-shrink: 0;">
                    ED
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                      <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px;">✓ Verified Approved Editor</span>
                      <span id="selectedEditorPressIdBadge" style="font-family: monospace; font-size: 0.72rem; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3);"></span>
                      <span id="selectedEditorStatusBadge" style="font-size: 0.7rem; font-weight: 700; padding: 1px 6px; border-radius: 4px;"></span>
                    </div>
                    <h4 id="selectedEditorName" style="color: #ffffff; font-size: 1.1rem; font-weight: 800; margin: 2px 0 0 0;"></h4>
                    <div id="selectedEditorLocation" style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;"></div>
                  </div>
                </div>
                <button type="button" onclick="openEditorPickerAgain()" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.25); color: #cbd5e1; border-radius: 6px; padding: 6px 12px; font-size: 0.76rem; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                  <span>🔄</span> Change Editor
                </button>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(59, 130, 246, 0.25); font-size: 0.78rem;">
                <div><span style="color: #94a3b8;">Email:</span> <strong id="selectedEditorEmailDisplay" style="color: #e2e8f0;"></strong></div>
                <div><span style="color: #94a3b8;">Mobile:</span> <strong id="selectedEditorMobileDisplay" style="color: #e2e8f0;"></strong></div>
              </div>
            </div>

            <!-- Hidden Inputs for Selected Editor Data -->
            <input type="hidden" id="selectedEditorAppId" value="">
            <input type="hidden" id="selectedEditorUserId" value="">
            <input type="hidden" id="selectedEditorPressId" value="">
            <input type="hidden" id="selectedEditorFullName" value="">
            <input type="hidden" id="selectedEditorEmail" value="">
            <input type="hidden" id="selectedEditorMobile" value="">

            <!-- 3. Editor Account Credentials (Username & Password) -->
            <div id="editorCredentialsSection" style="display: none; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 16px;">
              <div style="font-size: 0.82rem; font-weight: 700; color: #ffffff; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                <span>🔑</span> Editor Login Credentials
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div>
                  <label style="display: block; font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Username *</label>
                  <input type="text" id="newEditorUsername" placeholder="e.g. editor_anupam" required style="width: 100%; background: #020617; color: #fff; border: 1px solid rgba(255,255,255,0.18); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;">
                </div>

                <div>
                  <label style="display: block; font-size: 0.76rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">
                    <span id="editorPasswordLabel">Create Password *</span>
                  </label>
                  <div style="position: relative; display: flex; align-items: center;">
                    <input type="password" id="newEditorPassword" placeholder="Minimum 4 characters" minlength="4" style="width: 100%; background: #020617; color: #fff; border: 1px solid rgba(255,255,255,0.18); border-radius: 6px; padding: 9px 12px; padding-right: 42px; font-size: 0.86rem; box-sizing: border-box;">
                    <button type="button" onclick="togglePasswordVisibility('newEditorPassword', this)" style="position: absolute; right: 10px; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.15rem; padding: 4px;" title="Show / Hide Password">👁️</button>
                  </div>
                  <span id="editorPasswordHint" style="font-size: 0.7rem; color: #64748b; margin-top: 3px; display: block;">You can change or reset this password anytime from this dashboard.</span>
                </div>
              </div>
            </div>

            <!-- 4. Assign Allowed Options / Modules for this Editor -->
            <div id="sectionEditorPermissions" style="display: none; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 10px; padding: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                <div>
                  <div style="font-size: 0.86rem; font-weight: 700; color: #38bdf8;">
                    Assign Allowed Options / Modules for this Editor:
                  </div>
                  <p style="font-size: 0.74rem; color: #94a3b8; margin: 3px 0 0 0;">
                    The editor will be restricted to ONLY the selected tools upon login. All other admin pages will be blocked.
                  </p>
                </div>

                <!-- Quick Preset Buttons -->
                <div style="display: flex; gap: 6px;">
                  <button type="button" onclick="quickSelectPerms('all')" style="background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); color: #38bdf8; border-radius: 4px; padding: 4px 9px; font-size: 0.7rem; font-weight: 600; cursor: pointer;">
                    Select All
                  </button>
                  <button type="button" onclick="quickSelectPerms('standard')" style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.35); color: #22c55e; border-radius: 4px; padding: 4px 9px; font-size: 0.7rem; font-weight: 600; cursor: pointer;">
                    Standard Newsroom
                  </button>
                  <button type="button" onclick="quickSelectPerms('none')" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #94a3b8; border-radius: 4px; padding: 4px 9px; font-size: 0.7rem; cursor: pointer;">
                    Clear
                  </button>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin-top: 14px;">
                ${AVAILABLE_MODULES.map(m => `
                  <label style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 9px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; color: #e2e8f0; transition: border 0.15s;">
                    <input type="checkbox" name="editorPerms" value="${m.slug}" ${['editor', 'articles', 'dashboard'].includes(m.slug) ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6;">
                    <span>${m.icon} ${m.name}</span>
                  </label>
                `).join('')}
              </div>
            </div>

          </div>

          <!-- ==========================================
               SECTION: PROMOTER WORKFLOW (AD COLLECTION)
               ========================================== -->
          <div id="sectionPromoterWorkflow" style="display: none; flex-direction: column; gap: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Promoter Full Name *</label>
                <input type="text" id="promoterFullName" placeholder="e.g. Priya Kalita" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;">
              </div>
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Username *</label>
                <input type="text" id="promoterUsername" placeholder="e.g. priya_promoter" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Email Address *</label>
                <input type="email" id="promoterEmail" placeholder="priya@example.com" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;">
              </div>
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Mobile Number</label>
                <input type="tel" id="promoterMobile" placeholder="10-digit mobile number" maxlength="10" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; font-size: 0.86rem; box-sizing: border-box;">
              </div>
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">Create Password *</label>
              <div style="position: relative; display: flex; align-items: center;">
                <input type="password" id="promoterPassword" placeholder="Minimum 4 characters" minlength="4" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 9px 12px; padding-right: 42px; font-size: 0.86rem; box-sizing: border-box;">
                <button type="button" onclick="togglePasswordVisibility('promoterPassword', this)" style="position: absolute; right: 10px; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.15rem; padding: 4px;" title="Show / Hide Password">👁️</button>
              </div>
              <span style="font-size: 0.72rem; color: #64748b; margin-top: 3px; display: block;">You can change or reset this password anytime from this dashboard.</span>
            </div>

            <!-- Promoter Commission Structure -->
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 10px; padding: 18px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <div style="font-size: 0.84rem; font-weight: 700; color: #c084fc;">
                  Promoter ID & Commission Payment Structure (INR ₹):
                </div>
                <span style="font-size: 0.72rem; color: #a855f7; background: rgba(168, 85, 247, 0.15); padding: 2px 8px; border-radius: 4px; font-family: monospace;">
                  Auto ID: ND30-PRO-XXXX
                </span>
              </div>
              <p style="font-size: 0.74rem; color: #94a3b8; margin: 0 0 14px 0;">
                Set the promoter's payout amount earned for each accepted and approved advertisement booking.
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="display: block; font-size: 0.74rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">ND30 Live Promotion Video Payout (₹)</label>
                  <input type="number" id="commVideo" value="500" min="0" step="50" style="width: 100%; background: #020617; color: #22c55e; font-weight: 700; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 12px; font-size: 0.88rem; box-sizing: border-box;">
                </div>

                <div>
                  <label style="display: block; font-size: 0.74rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">ND30 Live Promotion Banner Payout (₹)</label>
                  <input type="number" id="commBanner" value="300" min="0" step="50" style="width: 100%; background: #020617; color: #22c55e; font-weight: 700; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 12px; font-size: 0.88rem; box-sizing: border-box;">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                <div>
                  <label style="display: block; font-size: 0.74rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Both (Video & Banner) Payout (₹)</label>
                  <input type="number" id="commBoth" value="800" min="0" step="50" style="width: 100%; background: #020617; color: #22c55e; font-weight: 700; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 12px; font-size: 0.88rem; box-sizing: border-box;">
                </div>

                <div>
                  <label style="display: block; font-size: 0.74rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Other Influencer Video Payout (₹)</label>
                  <input type="number" id="commInfluencer" value="500" min="0" step="50" style="width: 100%; background: #020617; color: #22c55e; font-weight: 700; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 12px; font-size: 0.88rem; box-sizing: border-box;">
                </div>
              </div>
            </div>
          </div>

          <!-- Submit Action -->
          <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <button type="submit" id="createUserBtn" class="btn btn-primary" style="padding: 11px 26px; font-weight: 700; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 8px;">
              <span>✨</span> <span id="createUserBtnLabel">Assign Permissions & Save Editor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
              <span>✨</span> Create User Account
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- TAB 3: PROMOTER COMMISSIONS & PAYOUTS LEDGER -->
    <div id="tabPayouts" class="admin-tab-pane" style="display:none;">
      <div style="background: var(--admin-card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
        <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 1rem; font-weight: 700; color: #ffffff; margin: 0;">
              Promoter Advertisement Bookings & Commission Settlement
            </h3>
            <span style="font-size: 0.74rem; color: #94a3b8;">
              When advertisement bookings are Approved, commission is Earned. Marking as Paid updates the promoter portal in real-time.
            </span>
          </div>
          <div style="font-size: 0.82rem; color: #94a3b8;">
            Pending Balance: <strong style="color: #eab308; font-size: 1rem;">₹${Number(pendingPayouts).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        ${promoterBookings.length === 0 ? `
          <div style="padding: 40px 20px; text-align: center; color: #94a3b8;">
            <div style="font-size: 2rem; margin-bottom: 6px;">💼</div>
            <div style="color: #ffffff; font-weight: 600;">No promoter bookings recorded yet</div>
            <p style="font-size: 0.78rem; margin-top: 4px;">When promoters submit advertisement requests or clients enter a promoter ID, commission entries appear here.</p>
          </div>
        ` : `
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.84rem;">
              <thead>
                <tr style="background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.5px;">
                  <th style="padding: 12px 16px;">Booking & Date</th>
                  <th style="padding: 12px 16px;">Promoter</th>
                  <th style="padding: 12px 16px;">Advertiser / Business</th>
                  <th style="padding: 12px 16px;">Campaign Format</th>
                  <th style="padding: 12px 16px;">Booking Status</th>
                  <th style="padding: 12px 16px;">Commission</th>
                  <th style="padding: 12px 16px;">Payout Status</th>
                  <th style="padding: 12px 16px; text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${promoterBookings.map(b => {
                  const commStatus = b.commission_status || 'In Process';
                  const isPaid = commStatus.toLowerCase() === 'paid';
                  const isEarned = commStatus.toLowerCase() === 'earned';
                  const isRejected = (b.status || '').toLowerCase() === 'rejected' || commStatus.toLowerCase() === 'rejected';

                  let badgeColor = 'rgba(234, 179, 8, 0.15); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.35);';
                  if (isPaid) badgeColor = 'rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.35);';
                  else if (isEarned) badgeColor = 'rgba(59, 130, 246, 0.15); color: #38bdf8; border: 1px solid rgba(59, 130, 246, 0.35);';
                  else if (isRejected) badgeColor = 'rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.35);';

                  return `
                  <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <td style="padding: 14px 16px;">
                      <strong style="font-family: monospace; color: #38bdf8;">${b.booking_id}</strong>
                      <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                        ${new Date(b.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>

                    <td style="padding: 14px 16px;">
                      <strong style="color: #ffffff;">${escapeHtml(b.promoter_name || 'Promoter')}</strong>
                      <div style="font-size: 0.74rem; color: #38bdf8; font-family: monospace;">
                        ${escapeHtml(b.promoter_id)}
                      </div>
                    </td>

                    <td style="padding: 14px 16px;">
                      <div style="font-weight: 600; color: #ffffff;">${escapeHtml(b.business_name)}</div>
                      <div style="font-size: 0.74rem; color: #94a3b8;">${escapeHtml(b.contact_name)}</div>
                    </td>

                    <td style="padding: 14px 16px; font-size: 0.78rem; color: #cbd5e1;">
                      ${escapeHtml(b.promotion_type)}
                    </td>

                    <td style="padding: 14px 16px;">
                      <span class="badge ${b.status.toLowerCase() === 'approved' ? 'badge-info' : (b.status.toLowerCase() === 'completed' ? 'badge-success' : (b.status.toLowerCase() === 'rejected' ? 'badge-danger' : 'badge-warning'))}" style="font-size: 0.7rem;">
                        ${b.status}
                      </span>
                    </td>

                    <td style="padding: 14px 16px;">
                      <strong style="font-size: 0.95rem; color: ${isRejected ? '#64748b' : '#22c55e'};">
                        ₹${isRejected ? 0 : Number(b.commission_amount || 0).toLocaleString('en-IN')}
                      </strong>
                    </td>

                    <td style="padding: 14px 16px;">
                      <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; background: ${badgeColor}">
                        ${isPaid ? '✅ Paid' : (isEarned ? '🎯 Earned (Unpaid)' : (isRejected ? '❌ ₹0 (Rejected)' : '⏳ In Process'))}
                      </span>
                      ${b.commission_payment_ref ? `
                        <div style="font-size: 0.68rem; color: #94a3b8; margin-top: 3px; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(b.commission_payment_ref)}">
                          ${escapeHtml(b.commission_payment_ref)}
                        </div>
                      ` : ''}
                    </td>

                    <td style="padding: 14px 16px; text-align: right;">
                      ${!isPaid && !isRejected ? `
                        <button type="button" onclick="openPayoutModal(${b.id}, '${b.booking_id}', '${escapeHtml(b.promoter_name || '')}', ${b.commission_amount})" style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); color: #22c55e; border-radius: 6px; padding: 5px 10px; font-size: 0.74rem; font-weight: 600; cursor: pointer;">
                          💸 Mark Paid
                        </button>
                      ` : `
                        <span style="font-size: 0.74rem; color: #64748b;">${isPaid ? 'Settled' : 'Closed'}</span>
                      `}
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

  </div>

  <!-- MODAL: CHANGE PASSWORD -->
  <div id="changePasswordModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:999999; align-items:center; justify-content:center; padding:16px;">
    <div style="background:#1e293b; border:1px solid rgba(255,255,255,0.15); border-radius:12px; width:100%; max-width:400px; padding:22px; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
      <h3 style="font-size:1.1rem; color:#fff; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
        <span>🔑 Change Password</span>
        <button type="button" onclick="closeChangePasswordModal()" style="background:none; border:none; color:#94a3b8; font-size:1.4rem; cursor:pointer;">&times;</button>
      </h3>
      <p style="font-size:0.78rem; color:#94a3b8; margin:0 0 16px 0;">
        Update login password for <strong id="pwModalUserName" style="color:#ffffff;"></strong>.
      </p>

      <input type="hidden" id="pwModalUserId">

      <div style="margin-bottom:14px;">
        <label style="display:block; font-size:0.78rem; font-weight:600; color:#cbd5e1; margin-bottom:6px;">New Password *</label>
        <div style="position:relative; display:flex; align-items:center;">
          <input type="password" id="pwModalNewPassword" placeholder="Minimum 4 characters" minlength="4" required style="width:100%; background:#0f172a; color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; padding:9px 12px; padding-right:42px; font-size:0.88rem; box-sizing:border-box;">
          <button type="button" onclick="togglePasswordVisibility('pwModalNewPassword', this)" style="position:absolute; right:10px; background:none; border:none; color:#94a3b8; cursor:pointer; font-size:1.15rem; padding:4px;" title="Show / Hide Password">👁️</button>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" onclick="closeChangePasswordModal()" class="btn btn-secondary" style="padding:7px 14px;">Cancel</button>
        <button type="button" onclick="submitPasswordChange()" class="btn btn-primary" style="padding:7px 18px; font-weight:700;">Save Password</button>
      </div>
    </div>
  </div>

  <!-- MODAL: EDIT USER (PERMISSIONS OR COMMISSION) -->
  <div id="editUserModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:999999; align-items:center; justify-content:center; padding:16px;">
    <div style="background:#1e293b; border:1px solid rgba(255,255,255,0.15); border-radius:12px; width:100%; max-width:540px; padding:22px; box-shadow:0 20px 40px rgba(0,0,0,0.6); max-height:90vh; overflow-y:auto;">
      <h3 style="font-size:1.1rem; color:#fff; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
        <span>✏️ Edit User Settings</span>
        <button type="button" onclick="closeEditUserModal()" style="background:none; border:none; color:#94a3b8; font-size:1.4rem; cursor:pointer;">&times;</button>
      </h3>
      <p style="font-size:0.78rem; color:#94a3b8; margin:0 0 16px 0;">
        Update permissions and rates for <strong id="editModalUserName" style="color:#ffffff;"></strong> (<span id="editModalUserRole" style="text-transform:capitalize;"></span>).
      </p>

      <input type="hidden" id="editModalUserId">
      <input type="hidden" id="editModalRoleType">

      <div style="margin-bottom:12px;">
        <label style="display:block; font-size:0.76rem; font-weight:600; color:#94a3b8; margin-bottom:4px;">Full Name</label>
        <input type="text" id="editModalFullName" style="width:100%; background:#0f172a; color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:8px 10px; font-size:0.84rem; box-sizing:border-box;">
      </div>

      <div style="margin-bottom:12px;">
        <label style="display:block; font-size:0.76rem; font-weight:600; color:#94a3b8; margin-bottom:4px;">Email Address</label>
        <input type="email" id="editModalEmail" style="width:100%; background:#0f172a; color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:8px 10px; font-size:0.84rem; box-sizing:border-box;">
      </div>

      <div style="margin-bottom:12px;">
        <label style="display:block; font-size:0.76rem; font-weight:600; color:#94a3b8; margin-bottom:4px;">Mobile</label>
        <input type="tel" id="editModalMobile" style="width:100%; background:#0f172a; color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:8px 10px; font-size:0.84rem; box-sizing:border-box;">
      </div>

      <!-- Editor Permissions Box in Edit Modal -->
      <div id="editEditorPermsBox" style="display:none; margin-bottom:14px; background:rgba(15, 23, 42, 0.6); padding:12px; border-radius:8px; border:1px solid rgba(59, 130, 246, 0.2);">
        <div style="font-size:0.8rem; font-weight:700; color:#38bdf8; margin-bottom:8px;">Allowed Options for this Editor:</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          ${AVAILABLE_MODULES.map(m => `
            <label style="display:flex; align-items:center; gap:6px; font-size:0.76rem; color:#cbd5e1; cursor:pointer;">
              <input type="checkbox" name="editPermItem" value="${m.slug}" style="accent-color:#3b82f6;">
              <span>${m.icon} ${m.name}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- Promoter Commission Box in Edit Modal -->
      <div id="editPromoterCommBox" style="display:none; margin-bottom:14px; background:rgba(15, 23, 42, 0.6); padding:12px; border-radius:8px; border:1px solid rgba(168, 85, 247, 0.2);">
        <div style="font-size:0.8rem; font-weight:700; color:#c084fc; margin-bottom:8px;">Commission Payout Structure (₹):</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div>
            <label style="font-size:0.72rem; color:#94a3b8;">Video (₹)</label>
            <input type="number" id="editCommVideo" min="0" style="width:100%; background:#020617; color:#22c55e; font-weight:700; border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:6px 10px; font-size:0.82rem; box-sizing:border-box;">
          </div>
          <div>
            <label style="font-size:0.72rem; color:#94a3b8;">Banner (₹)</label>
            <input type="number" id="editCommBanner" min="0" style="width:100%; background:#020617; color:#22c55e; font-weight:700; border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:6px 10px; font-size:0.82rem; box-sizing:border-box;">
          </div>
          <div>
            <label style="font-size:0.72rem; color:#94a3b8;">Both (₹)</label>
            <input type="number" id="editCommBoth" min="0" style="width:100%; background:#020617; color:#22c55e; font-weight:700; border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:6px 10px; font-size:0.82rem; box-sizing:border-box;">
          </div>
          <div>
            <label style="font-size:0.72rem; color:#94a3b8;">Influencer (₹)</label>
            <input type="number" id="editCommInfluencer" min="0" style="width:100%; background:#020617; color:#22c55e; font-weight:700; border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:6px 10px; font-size:0.82rem; box-sizing:border-box;">
          </div>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <label style="display:flex; align-items:center; gap:8px; font-size:0.8rem; color:#fff; cursor:pointer;">
          <input type="checkbox" id="editModalIsActive" style="width:18px; height:18px; accent-color:#22c55e;">
          <span>Account Active & Enabled</span>
        </label>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" onclick="closeEditUserModal()" class="btn btn-secondary" style="padding:7px 14px;">Cancel</button>
        <button type="button" onclick="submitEditUser()" class="btn btn-primary" style="padding:7px 18px; font-weight:700;">Save Changes</button>
      </div>
    </div>
  </div>

  <!-- MODAL: MARK PAYOUT PAID -->
  <div id="payoutModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:999999; align-items:center; justify-content:center; padding:16px;">
    <div style="background:#1e293b; border:1px solid rgba(34, 197, 94, 0.3); border-radius:12px; width:100%; max-width:420px; padding:22px; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
      <h3 style="font-size:1.1rem; color:#fff; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
        <span>💸 Settle Commission Payout</span>
        <button type="button" onclick="closePayoutModal()" style="background:none; border:none; color:#94a3b8; font-size:1.4rem; cursor:pointer;">&times;</button>
      </h3>
      <p style="font-size:0.78rem; color:#94a3b8; margin:0 0 14px 0;">
        Marking as Paid updates promoter ledger. Promoter will see <strong>"✅ Paid"</strong>.
      </p>

      <input type="hidden" id="payoutModalBookingId">

      <div style="background:rgba(15,23,42,0.6); padding:10px 14px; border-radius:8px; margin-bottom:14px; border:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:0.74rem; color:#94a3b8;">Promoter: <strong id="payoutModalPromoterName" style="color:#ffffff;"></strong></div>
        <div style="font-size:0.74rem; color:#94a3b8; margin-top:2px;">Booking: <strong id="payoutModalRef" style="color:#38bdf8; font-family:monospace;"></strong></div>
        <div style="font-size:0.9rem; font-weight:800; color:#22c55e; margin-top:4px;">Payout Amount: ₹<span id="payoutModalAmount">0</span></div>
      </div>

      <div style="margin-bottom:16px;">
        <label style="display:block; font-size:0.78rem; font-weight:600; color:#cbd5e1; margin-bottom:6px;">Payment Method & Transaction Reference *</label>
        <input type="text" id="payoutModalRefInput" placeholder="e.g. Paid via GPay UPI Ref: 4892019401" required style="width:100%; background:#0f172a; color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; padding:9px 12px; font-size:0.84rem; box-sizing:border-box;">
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" onclick="closePayoutModal()" class="btn btn-secondary" style="padding:7px 14px;">Cancel</button>
        <button type="button" onclick="submitPayoutPaid()" class="btn btn-primary" style="padding:7px 18px; font-weight:700; background:#059669;">Confirm Paid</button>
      </div>
    </div>
  </div>

  <script>
    const approvedEditorsList = ${JSON.stringify(approvedEditors)};

    function togglePasswordVisibility(inputId, btn) {
      const input = document.getElementById(inputId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerText = '🙈';
      } else {
        input.type = 'password';
        btn.innerText = '👁️';
      }
    }

    function switchTab(tabId, btn) {
      document.querySelectorAll('.admin-tab-pane').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
      const activeTab = document.getElementById(tabId);
      if (activeTab) activeTab.style.display = 'block';
      if (btn) btn.classList.add('active');
    }

    function handleRoleTypeToggle(role) {
      const isPromoter = role === 'promoter';
      const optEditor = document.getElementById('roleOptionEditor');
      const optPromoter = document.getElementById('roleOptionPromoter');
      const secEditor = document.getElementById('sectionApprovedEditorWorkflow');
      const secPromoter = document.getElementById('sectionPromoterWorkflow');
      const btnLabel = document.getElementById('createUserBtnLabel');

      if (isPromoter) {
        optPromoter.style.borderColor = '#a855f7';
        optPromoter.style.background = 'rgba(168, 85, 247, 0.12)';
        optEditor.style.borderColor = 'rgba(255,255,255,0.15)';
        optEditor.style.background = 'rgba(15, 23, 42, 0.6)';
        if (secEditor) secEditor.style.display = 'none';
        if (secPromoter) secPromoter.style.display = 'flex';
        if (btnLabel) btnLabel.innerText = 'Create Promoter Account';
      } else {
        optEditor.style.borderColor = '#3b82f6';
        optEditor.style.background = 'rgba(59, 130, 246, 0.12)';
        optPromoter.style.borderColor = 'rgba(255,255,255,0.15)';
        optPromoter.style.background = 'rgba(15, 23, 42, 0.6)';
        if (secEditor) secEditor.style.display = 'flex';
        if (secPromoter) secPromoter.style.display = 'none';
        
        const hasUserId = document.getElementById('selectedEditorUserId')?.value;
        const editorName = document.getElementById('selectedEditorFullName')?.value;
        if (btnLabel) {
          if (hasUserId) {
            btnLabel.innerText = 'Save & Update Permissions' + (editorName ? ' for ' + editorName : '');
          } else if (editorName) {
            btnLabel.innerText = 'Activate Account & Assign Permissions';
          } else {
            btnLabel.innerText = 'Assign Permissions & Save Editor';
          }
        }
      }
    }

    // Dropdown toggle
    function toggleEditorDropdown() {
      const menu = document.getElementById('editorDropdownMenu');
      const arrow = document.getElementById('dropdownArrow');
      if (!menu) return;

      const isHidden = menu.style.display === 'none' || !menu.style.display;
      menu.style.display = isHidden ? 'block' : 'none';
      if (arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';

      if (isHidden) {
        const searchInput = document.getElementById('editorSearchInput');
        if (searchInput) {
          setTimeout(() => searchInput.focus(), 50);
        }
      }
    }

    // Filter approved editors in dropdown by name, press id, or district
    function filterApprovedEditors() {
      const query = (document.getElementById('editorSearchInput')?.value || '').toLowerCase().trim();
      const items = document.querySelectorAll('.approved-editor-item');
      let visibleCount = 0;

      items.forEach(item => {
        const searchText = (item.getAttribute('data-search') || '').toLowerCase();
        if (!query || searchText.includes(query)) {
          item.style.display = 'flex';
          visibleCount++;
        } else {
          item.style.display = 'none';
        }
      });

      const noRes = document.getElementById('editorNoResults');
      if (noRes) noRes.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    // Select an approved editor from dropdown
    function selectApprovedEditor(appId) {
      const editor = approvedEditorsList.find(e => Number(e.id) === Number(appId));
      if (!editor) return;

      // Close dropdown menu
      const menu = document.getElementById('editorDropdownMenu');
      if (menu) menu.style.display = 'none';
      const arrow = document.getElementById('dropdownArrow');
      if (arrow) arrow.style.transform = 'rotate(0deg)';

      // Highlight active item
      document.querySelectorAll('.approved-editor-item').forEach(el => el.classList.remove('active'));
      const activeEl = document.getElementById('dropdown-item-' + appId);
      if (activeEl) activeEl.classList.add('active');

      // Update trigger button label
      const selectedLabel = document.getElementById('dropdownSelectedLabel');
      if (selectedLabel) {
        selectedLabel.innerHTML = '<span style="font-size:1.1rem; color:#22c55e;">✅</span> <strong style="color:#ffffff;">' +
          escapeHtmlJs(editor.full_name) + '</strong> <span style="font-size:0.75rem; color:#38bdf8; font-family:monospace;">(' +
          escapeHtmlJs(editor.press_id_code || 'Press ID') + ')</span>';
      }

      // Populate hidden inputs
      document.getElementById('selectedEditorAppId').value = editor.id;
      document.getElementById('selectedEditorUserId').value = editor.user_id || '';
      document.getElementById('selectedEditorPressId').value = editor.press_id_code || '';
      document.getElementById('selectedEditorFullName').value = editor.full_name;
      document.getElementById('selectedEditorEmail').value = editor.email;
      document.getElementById('selectedEditorMobile').value = editor.mobile_no || '';

      // Populate Selected Editor Showcase Card
      const card = document.getElementById('selectedEditorCard');
      if (card) {
        card.style.display = 'block';
        document.getElementById('selectedEditorName').innerText = editor.full_name;
        document.getElementById('selectedEditorPressIdBadge').innerText = editor.press_id_code ? '🆔 ' + editor.press_id_code : '🆔 Press ID: Ready';
        
        const loc = [editor.village_town, editor.district, editor.state].filter(Boolean).join(', ') || editor.area || 'Assam';
        document.getElementById('selectedEditorLocation').innerText = '📍 ' + loc;
        document.getElementById('selectedEditorEmailDisplay').innerText = editor.email;
        document.getElementById('selectedEditorMobileDisplay').innerText = editor.mobile_no || 'Not provided';

        const statusBadge = document.getElementById('selectedEditorStatusBadge');
        if (statusBadge) {
          if (editor.user_id) {
            statusBadge.innerText = '● Active Login (@' + (editor.user_username || 'editor') + ')';
            statusBadge.style.background = 'rgba(34, 197, 94, 0.2)';
            statusBadge.style.color = '#22c55e';
            statusBadge.style.border = '1px solid rgba(34, 197, 94, 0.4)';
          } else {
            statusBadge.innerText = '✨ Ready to Activate';
            statusBadge.style.background = 'rgba(56, 189, 248, 0.2)';
            statusBadge.style.color = '#38bdf8';
            statusBadge.style.border = '1px solid rgba(56, 189, 248, 0.4)';
          }
        }

        const initials = (editor.full_name || 'ED').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const avatar = document.getElementById('selectedEditorAvatar');
        if (avatar) avatar.innerText = initials;
      }

      // Show credentials & permissions sections
      const credSec = document.getElementById('editorCredentialsSection');
      if (credSec) credSec.style.display = 'block';

      const permSec = document.getElementById('sectionEditorPermissions');
      if (permSec) permSec.style.display = 'block';

      // Pre-fill Username
      const usernameInput = document.getElementById('newEditorUsername');
      if (usernameInput) {
        if (editor.user_username) {
          usernameInput.value = editor.user_username;
        } else {
          const cleanName = (editor.full_name || 'editor').toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 16);
          usernameInput.value = 'editor_' + cleanName;
        }
      }

      // Password configuration
      const passwordInput = document.getElementById('newEditorPassword');
      const passwordLabel = document.getElementById('editorPasswordLabel');
      const passwordHint = document.getElementById('editorPasswordHint');
      const submitBtnLabel = document.getElementById('createUserBtnLabel');

      if (editor.user_id) {
        if (passwordInput) {
          passwordInput.required = false;
          passwordInput.value = '';
          passwordInput.placeholder = 'Leave blank to keep current, or enter new';
        }
        if (passwordLabel) passwordLabel.innerText = 'Change Password (Optional)';
        if (passwordHint) passwordHint.innerText = 'Leave empty to preserve existing password, or enter new password to update.';
        if (submitBtnLabel) submitBtnLabel.innerText = 'Save & Update Permissions for ' + editor.full_name;
      } else {
        if (passwordInput) {
          passwordInput.required = true;
          passwordInput.value = '';
          passwordInput.placeholder = 'Minimum 4 characters';
        }
        if (passwordLabel) passwordLabel.innerText = 'Create Password *';
        if (passwordHint) passwordHint.innerText = 'Password required for editor to sign in at /login.';
        if (submitBtnLabel) submitBtnLabel.innerText = '✨ Activate Account & Assign Permissions';
      }

      // Pre-check permissions
      let assignedPerms = ['dashboard', 'editor', 'articles'];
      if (editor.user_permissions) {
        try {
          assignedPerms = typeof editor.user_permissions === 'string' ? JSON.parse(editor.user_permissions) : editor.user_permissions;
        } catch(e) {
          assignedPerms = ['dashboard', 'editor', 'articles'];
        }
      }

      document.querySelectorAll('input[name="editorPerms"]').forEach(checkbox => {
        checkbox.checked = assignedPerms.includes(checkbox.value);
      });
    }

    // Change editor / open picker again
    function openEditorPickerAgain() {
      toggleEditorDropdown();
    }

    // Quick Select Presets for Editor Permissions
    function quickSelectPerms(mode) {
      const checkboxes = document.querySelectorAll('input[name="editorPerms"]');
      if (mode === 'all') {
        checkboxes.forEach(c => c.checked = true);
      } else if (mode === 'standard') {
        const standardModules = ['dashboard', 'editor', 'articles'];
        checkboxes.forEach(c => c.checked = standardModules.includes(c.value));
      } else if (mode === 'none') {
        checkboxes.forEach(c => c.checked = false);
      }
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      const wrapper = document.getElementById('editorDropdownWrapper');
      const menu = document.getElementById('editorDropdownMenu');
      if (wrapper && menu && !wrapper.contains(e.target)) {
        menu.style.display = 'none';
        const arrow = document.getElementById('dropdownArrow');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
      }
    });

    function escapeHtmlJs(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    async function handleCreateUserSubmit(event) {
      event.preventDefault();
      const btn = document.getElementById('createUserBtn');
      btn.disabled = true;

      const roleEl = document.querySelector('input[name="newRole"]:checked');
      const role = roleEl ? roleEl.value : 'editor';

      if (role === 'editor') {
        const appId = document.getElementById('selectedEditorAppId')?.value;
        if (!appId) {
          alert('Please select an Approved Editor from the dropdown list first.');
          toggleEditorDropdown();
          btn.disabled = false;
          return;
        }

        const existingUserId = document.getElementById('selectedEditorUserId')?.value;
        const fullName = document.getElementById('selectedEditorFullName')?.value.trim();
        const email = document.getElementById('selectedEditorEmail')?.value.trim();
        const mobile = document.getElementById('selectedEditorMobile')?.value.trim();
        const pressIdCode = document.getElementById('selectedEditorPressId')?.value.trim();
        const username = document.getElementById('newEditorUsername')?.value.trim();
        const password = document.getElementById('newEditorPassword')?.value.trim();

        if (!username) {
          alert('Username is required.');
          btn.disabled = false;
          return;
        }

        let permissions = [];
        document.querySelectorAll('input[name="editorPerms"]:checked').forEach(c => permissions.push(c.value));
        if (permissions.length === 0) {
          if (!confirm('No modules selected! The editor will only be able to view an empty dashboard. Continue?')) {
            btn.disabled = false;
            return;
          }
          permissions.push('dashboard');
        }

        btn.innerText = existingUserId ? 'Updating Permissions...' : 'Activating Account...';

        try {
          if (existingUserId) {
            // Update existing editor user account & permissions
            const res = await fetch('/api/admin/roles/user/' + existingUserId, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fullName,
                username,
                email,
                mobile,
                permissions,
                password: password || undefined,
                reporterAppId: Number(appId),
                pressIdCode
              })
            });

            const data = await res.json();
            if (data.success) {
              alert('Success! Permissions updated for ' + fullName + '.');
              window.location.reload();
            } else {
              alert('Error: ' + (data.error || 'Failed to update editor permissions.'));
            }
          } else {
            // Create new editor user account with assigned permissions
            if (!password || password.length < 4) {
              alert('Password must be at least 4 characters long.');
              btn.disabled = false;
              btn.innerHTML = '<span>✨</span> <span id="createUserBtnLabel">Activate Account & Assign Permissions</span>';
              return;
            }

            const res = await fetch('/api/admin/roles/user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                role: 'editor',
                fullName,
                username,
                email,
                mobile,
                password,
                permissions,
                reporterAppId: Number(appId),
                pressIdCode
              })
            });

            const data = await res.json();
            if (data.success) {
              alert('Success! Approved Editor account created for ' + fullName + ' with ' + permissions.length + ' permitted modules.');
              window.location.reload();
            } else {
              alert('Error: ' + (data.error || 'Failed to create editor account.'));
            }
          }
        } catch (err) {
          alert('Request failed: ' + err.message);
        } finally {
          btn.disabled = false;
        }

      } else {
        // PROMOTER CREATION
        btn.innerText = 'Creating Promoter...';
        const fullName = document.getElementById('promoterFullName')?.value.trim();
        const username = document.getElementById('promoterUsername')?.value.trim();
        const email = document.getElementById('promoterEmail')?.value.trim();
        const mobile = document.getElementById('promoterMobile')?.value.trim();
        const password = document.getElementById('promoterPassword')?.value.trim();

        if (!fullName || !username || !email || !password) {
          alert('Please fill in all required fields for the Promoter.');
          btn.disabled = false;
          btn.innerHTML = '<span>✨</span> <span id="createUserBtnLabel">Create Promoter Account</span>';
          return;
        }

        const commissionStructure = {
          video: parseFloat(document.getElementById('commVideo')?.value) || 500,
          banner: parseFloat(document.getElementById('commBanner')?.value) || 300,
          both: parseFloat(document.getElementById('commBoth')?.value) || 800,
          influencer: parseFloat(document.getElementById('commInfluencer')?.value) || 500
        };

        try {
          const res = await fetch('/api/admin/roles/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'promoter',
              fullName,
              username,
              email,
              mobile,
              password,
              commissionStructure
            })
          });

          const data = await res.json();
          if (data.success) {
            alert('Success! Promoter created with ID: ' + (data.user?.promoterId || data.user?.promoter_id));
            window.location.reload();
          } else {
            alert('Error: ' + (data.error || 'Failed to create promoter.'));
          }
        } catch (err) {
          alert('Request failed: ' + err.message);
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<span>✨</span> <span id="createUserBtnLabel">Create Promoter Account</span>';
        }
      }
    }

    function openChangePasswordModal(userId, fullName, username) {
      document.getElementById('pwModalUserId').value = userId;
      document.getElementById('pwModalUserName').innerText = fullName + ' (@' + username + ')';
      document.getElementById('pwModalNewPassword').value = '';
      document.getElementById('changePasswordModal').style.display = 'flex';
    }

    function closeChangePasswordModal() {
      document.getElementById('changePasswordModal').style.display = 'none';
    }

    async function submitPasswordChange() {
      const id = document.getElementById('pwModalUserId').value;
      const newPassword = document.getElementById('pwModalNewPassword').value.trim();

      if (!newPassword || newPassword.length < 4) {
        alert('Password must be at least 4 characters long.');
        return;
      }

      try {
        const res = await fetch('/api/admin/roles/user/' + id + '/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: newPassword })
        });
        const data = await res.json();
        if (data.success) {
          alert('Password successfully updated!');
          closeChangePasswordModal();
        } else {
          alert('Error: ' + (data.error || 'Failed to update password.'));
        }
      } catch (err) {
        alert('Request failed: ' + err.message);
      }
    }

    function openEditUserModal(u) {
      document.getElementById('editModalUserId').value = u.id;
      document.getElementById('editModalUserName').innerText = u.full_name;
      document.getElementById('editModalUserRole').innerText = u.role;
      document.getElementById('editModalRoleType').value = u.role;
      document.getElementById('editModalFullName').value = u.full_name;
      document.getElementById('editModalEmail').value = u.email;
      document.getElementById('editModalMobile').value = u.mobile || '';
      document.getElementById('editModalIsActive').checked = u.is_active === 1;

      const editorBox = document.getElementById('editEditorPermsBox');
      const promoterBox = document.getElementById('editPromoterCommBox');

      if (u.role === 'editor') {
        editorBox.style.display = 'block';
        promoterBox.style.display = 'none';
        const perms = u.permissions || [];
        document.querySelectorAll('input[name="editPermItem"]').forEach(ch => {
          ch.checked = perms.includes(ch.value);
        });
      } else if (u.role === 'promoter') {
        editorBox.style.display = 'none';
        promoterBox.style.display = 'block';
        const comm = u.commissionStructure || {};
        document.getElementById('editCommVideo').value = comm.video || 500;
        document.getElementById('editCommBanner').value = comm.banner || 300;
        document.getElementById('editCommBoth').value = comm.both || 800;
        document.getElementById('editCommInfluencer').value = comm.influencer || 500;
      } else {
        editorBox.style.display = 'none';
        promoterBox.style.display = 'none';
      }

      document.getElementById('editUserModal').style.display = 'flex';
    }

    function closeEditUserModal() {
      document.getElementById('editUserModal').style.display = 'none';
    }

    async function submitEditUser() {
      const id = document.getElementById('editModalUserId').value;
      const role = document.getElementById('editModalRoleType').value;
      const fullName = document.getElementById('editModalFullName').value.trim();
      const email = document.getElementById('editModalEmail').value.trim();
      const mobile = document.getElementById('editModalMobile').value.trim();
      const is_active = document.getElementById('editModalIsActive').checked;

      let permissions = undefined;
      let commissionStructure = undefined;

      if (role === 'editor') {
        permissions = [];
        document.querySelectorAll('input[name="editPermItem"]:checked').forEach(c => permissions.push(c.value));
      } else if (role === 'promoter') {
        commissionStructure = {
          video: parseFloat(document.getElementById('editCommVideo').value) || 500,
          banner: parseFloat(document.getElementById('editCommBanner').value) || 300,
          both: parseFloat(document.getElementById('editCommBoth').value) || 800,
          influencer: parseFloat(document.getElementById('editCommInfluencer').value) || 500
        };
      }

      try {
        const res = await fetch('/api/admin/roles/user/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, mobile, permissions, commissionStructure, is_active })
        });
        const data = await res.json();
        if (data.success) {
          alert('User updated successfully!');
          window.location.reload();
        } else {
          alert('Error: ' + (data.error || 'Failed to update user.'));
        }
      } catch (err) {
        alert('Update failed: ' + err.message);
      }
    }

    async function handleDeleteUser(id, name) {
      if (!confirm('Are you sure you want to delete ' + name + '? This cannot be undone.')) return;
      try {
        const res = await fetch('/api/admin/roles/user/' + id, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          document.getElementById('user-row-' + id)?.remove();
          alert('User deleted.');
        } else {
          alert('Error: ' + data.error);
        }
      } catch (e) {
        alert('Delete failed: ' + e.message);
      }
    }

    function openPayoutModal(bookingId, bookingRef, promoterName, amount) {
      document.getElementById('payoutModalBookingId').value = bookingId;
      document.getElementById('payoutModalRef').innerText = bookingRef;
      document.getElementById('payoutModalPromoterName').innerText = promoterName;
      document.getElementById('payoutModalAmount').innerText = Number(amount || 0).toLocaleString('en-IN');
      document.getElementById('payoutModalRefInput').value = 'Paid via Direct Transfer on ' + new Date().toLocaleDateString('en-IN');
      document.getElementById('payoutModal').style.display = 'flex';
    }

    function closePayoutModal() {
      document.getElementById('payoutModal').style.display = 'none';
    }

    async function submitPayoutPaid() {
      const bookingId = document.getElementById('payoutModalBookingId').value;
      const paymentRef = document.getElementById('payoutModalRefInput').value.trim();

      if (!paymentRef) {
        alert('Please enter a payment reference or transaction note.');
        return;
      }

      try {
        const res = await fetch('/api/admin/roles/payout/' + bookingId, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentRef })
        });
        const data = await res.json();
        if (data.success) {
          alert('Commission payout marked as Paid!');
          window.location.reload();
        } else {
          alert('Error: ' + (data.error || 'Failed to update payout.'));
        }
      } catch (err) {
        alert('Payout request failed: ' + err.message);
      }
    }
  </script>
  `;
}

module.exports = {
  renderRolesAdmin,
  AVAILABLE_MODULES
};

