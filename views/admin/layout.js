/**
 * ND30 LIVE - Admin Dashboard Master Layout
 */

function renderAdminLayout({ title, activeNav = 'dashboard', content, currentUser = null }) {
  const isAdmin = !currentUser || currentUser.role === 'admin';
  const perms = currentUser?.permissions || (isAdmin ? ['*'] : []);

  const canAccess = (slug) => {
    if (isAdmin || perms.includes('*')) return true;
    return perms.includes(slug);
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
  <meta name="theme-color" content="#0d1117">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>${title} | ND30 LIVE Admin</title>
  <link rel="icon" type="image/png" href="/images/nd30_live_logo.png">
  <link rel="stylesheet" href="/css/admin.css">
</head>
<body class="admin-body">
  <!-- Admin Sidebar (Off-Canvas Drawer on Mobile/Tablet) -->
  <aside class="admin-sidebar" id="adminSidebar">
    <div class="admin-sidebar-header" style="display:flex; align-items:center; justify-content:space-between; padding:18px 20px;">
      <a href="/admin" style="text-decoration:none; display:flex; align-items:center; gap:10px;">
        <img src="/images/nd30_live_logo.png" alt="ND30 LIVE" style="height:36px; max-width:130px; object-fit:contain;">
      </a>
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="badge ${isAdmin ? 'badge-danger' : 'badge-purple'}" style="font-size:0.65rem;">
          ${isAdmin ? 'Master CMS' : 'Editor Desk'}
        </span>
        <!-- Mobile Sidebar Close Button -->
        <button type="button" id="adminSidebarCloseBtn" class="admin-sidebar-close-btn" aria-label="Close Sidebar">✕</button>
      </div>
    </div>

    <nav class="admin-nav">
      ${(canAccess('dashboard') || canAccess('editor') || canAccess('articles') || canAccess('notice')) ? `
      <span class="admin-nav-heading">Editorial & Publishing</span>
      ${canAccess('dashboard') ? `
      <a href="/admin" class="admin-nav-item ${activeNav === 'dashboard' ? 'active' : ''}">
        <span>📊</span> Dashboard
      </a>` : ''}
      ${canAccess('editor') ? `
      <a href="/admin/editor" class="admin-nav-item ${activeNav === 'editor' ? 'active' : ''}">
        <span>✍️</span> 3-Language Editor
      </a>` : ''}
      ${canAccess('articles') ? `
      <a href="/admin/articles" class="admin-nav-item ${activeNav === 'articles' ? 'active' : ''}">
        <span>📄</span> All Articles
      </a>` : ''}
      ${canAccess('notice') ? `
      <a href="/admin/notice" class="admin-nav-item ${activeNav === 'notice' ? 'active' : ''}">
        <span>🔔</span> Notice Panel Studio
      </a>` : ''}
      ` : ''}

      ${(canAccess('facebook') || canAccess('reporters')) ? `
      <span class="admin-nav-heading">Feeds & Ingestion</span>
      ${canAccess('facebook') ? `
      <a href="/admin/facebook" class="admin-nav-item ${activeNav === 'facebook' ? 'active' : ''}">
        <span>📱</span> Facebook Import Review
      </a>` : ''}
      ${canAccess('reporters') ? `
      <a href="/admin/reporters" class="admin-nav-item ${activeNav === 'reporters' ? 'active' : ''}">
        <span>🎙️</span> Join Us & Areas
      </a>` : ''}
      ` : ''}

      ${(canAccess('social-qr') || canAccess('integrations') || canAccess('ifttt') || canAccess('advertisements') || canAccess('adsense')) ? `
      <span class="admin-nav-heading">Integrations & Workflows</span>
      ${canAccess('social-qr') ? `
      <a href="/admin/social-qr" class="admin-nav-item ${activeNav === 'social-qr' ? 'active' : ''}">
        <span>📲</span> Social QR Channels
      </a>` : ''}
      ${canAccess('integrations') ? `
      <a href="/admin/integrations" class="admin-nav-item ${activeNav === 'integrations' ? 'active' : ''}">
        <span>🔗</span> Integrations Hub
      </a>` : ''}
      ${canAccess('ifttt') ? `
      <a href="/admin/ifttt" class="admin-nav-item ${activeNav === 'ifttt' ? 'active' : ''}">
        <span>⚡</span> IFTTT Automation
      </a>` : ''}
      ${canAccess('advertisements') ? `
      <a href="/admin/advertisements" class="admin-nav-item ${activeNav === 'advertisements' ? 'active' : ''}">
        <span>📢</span> Advertisements & Bookings
      </a>` : ''}
      ${canAccess('adsense') ? `
      <a href="/admin/adsense" class="admin-nav-item ${activeNav === 'adsense' ? 'active' : ''}">
        <span>💰</span> Google AdSense
      </a>` : ''}
      ` : ''}

      ${isAdmin ? `
      <span class="admin-nav-heading">Access & Security</span>
      <a href="/admin/roles" class="admin-nav-item ${activeNav === 'roles' ? 'active' : ''}">
        <span>👥</span> Roles & Permissions
      </a>
      ` : ''}

      <span class="admin-nav-heading">Live Portals</span>
      <a href="/as/" target="_blank" class="admin-nav-item">
        <span>🌐</span> Assamese Portal (অসমীয়া)
      </a>
      <a href="/hi/" target="_blank" class="admin-nav-item">
        <span>🌐</span> Hindi Portal (हिंदी)
      </a>
      <a href="/en/" target="_blank" class="admin-nav-item">
        <span>🌐</span> English Portal
      </a>
    </nav>

    <div style="padding:16px 20px; border-top:1px solid var(--admin-border); font-size:0.8rem; color:var(--admin-muted); display:flex; justify-content:space-between; align-items:center;">
      <span>🟢 Online</span>
      <a href="/as/" target="_blank" style="color:var(--admin-red); font-weight:600; text-decoration:none;">View Site ↗</a>
    </div>
  </aside>

  <!-- Mobile Sidebar Backdrop Overlay -->
  <div class="admin-sidebar-backdrop" id="adminSidebarBackdrop"></div>

  <!-- Admin Main Content Area -->
  <div class="admin-main">
    <header class="admin-header">
      <div class="admin-title-wrap">
        <!-- Mobile Sidebar Hamburger Toggle Button -->
        <button type="button" id="adminSidebarToggleBtn" class="admin-hamburger-btn" aria-label="Toggle Sidebar Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h1 class="admin-page-title">${title}</h1>
      </div>
      <div class="admin-header-actions">
        ${canAccess('editor') ? '<a href="/admin/editor" class="btn btn-primary btn-sm admin-create-btn"><span class="btn-text-full">+ New Multilingual Story</span><span class="btn-text-short">+ New</span></a>' : ''}
        
        <div class="admin-user-pill">
          <span>👤</span>
          <span class="admin-user-name">${currentUser?.fullName || 'Super Admin'}</span>
          <span class="badge ${isAdmin ? 'badge-danger' : 'badge-primary'}" style="font-size:0.65rem; text-transform:uppercase;">
            ${currentUser?.role || 'admin'}
          </span>
        </div>

        <a href="/logout" class="btn btn-secondary btn-sm admin-logout-btn" title="Log out">
          <span>🚪</span> <span class="logout-text">Logout</span>
        </a>
      </div>
    </header>

    <main class="admin-content">
      ${content}
    </main>
  </div>

  <script src="/js/admin.js"></script>
</body>
</html>`;
}

module.exports = {
  renderAdminLayout
};
