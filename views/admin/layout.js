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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ND30 LIVE Admin</title>
  <link rel="icon" type="image/png" href="/images/nd30_live_logo.png">
  <link rel="stylesheet" href="/css/admin.css">
</head>
<body class="admin-body">
  <!-- Admin Sidebar -->
  <aside class="admin-sidebar">
    <div class="admin-sidebar-header" style="display:flex; align-items:center; justify-content:space-between; padding:18px 20px;">
      <a href="/admin" style="text-decoration:none; display:flex; align-items:center; gap:10px;">
        <img src="/images/nd30_live_logo.png" alt="ND30 LIVE" style="height:36px; max-width:130px; object-fit:contain;">
      </a>
      <span class="badge ${isAdmin ? 'badge-danger' : 'badge-purple'}" style="font-size:0.65rem;">
        ${isAdmin ? 'Master CMS' : 'Editor Desk'}
      </span>
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

  <!-- Admin Main Content Area -->
  <div class="admin-main">
    <header class="admin-header">
      <div class="admin-title-wrap">
        <h1 class="admin-page-title">${title}</h1>
      </div>
      <div style="display:flex; align-items:center; gap:14px;">
        ${canAccess('editor') ? '<a href="/admin/editor" class="btn btn-primary btn-sm">+ New Multilingual Story</a>' : ''}
        
        <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.06); padding:4px 10px; border-radius:20px; border:1px solid rgba(255,255,255,0.1); font-size:0.78rem;">
          <span>👤</span>
          <span style="font-weight:600; color:#fff;">${currentUser?.fullName || 'Super Admin'}</span>
          <span class="badge ${isAdmin ? 'badge-danger' : 'badge-primary'}" style="font-size:0.65rem; text-transform:uppercase;">
            ${currentUser?.role || 'admin'}
          </span>
        </div>

        <a href="/logout" class="btn btn-secondary btn-sm" style="font-size:0.75rem; text-decoration:none;" title="Log out">
          🚪 Logout
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
