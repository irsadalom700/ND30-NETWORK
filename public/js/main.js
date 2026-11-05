/**
 * ND30 LIVE - Main Client Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Toggle (Dark / Light)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('nd30_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('nd30_theme', nextTheme);
      updateThemeIcon(nextTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    themeToggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  }

  // 2. Reading Progress Bar on Article Pages
  const progressBar = document.getElementById('articleProgressBar');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = scrolled + '%';
    });
  }

  // 3. Share Buttons
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const type = btn.getAttribute('data-share');
      const url = window.location.href;
      const title = document.title;

      if (type === 'copy') {
        navigator.clipboard.writeText(url).then(() => {
          showToast('Link copied to clipboard!');
        });
      } else if (type === 'tg') {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
      } else if (type === 'wa') {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
      } else if (type === 'fb') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      } else if (type === 'x') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
      }
    });
  });

  // 4. Toast notification helper
  function showToast(msg) {
    let toast = document.getElementById('globalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalToast';
      toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#ef4444;color:#fff;padding:10px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.4);font-size:0.9rem;font-weight:600;z-index:9999;transition:opacity 0.3s ease;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 2800);
  }
});
