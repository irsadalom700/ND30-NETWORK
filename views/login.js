/**
 * ND30 LIVE - Unified Login View
 * Allows Super Admin, Approved Editors, and Promoters to log into their authorized portals.
 */

function renderLoginPage({ redirect = '', error = '' } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Login | ND30 LIVE</title>
  <link rel="icon" type="image/png" href="/images/nd30_live_logo.png">
  <link rel="stylesheet" href="/css/admin.css">
  <style>
    body.login-body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top, #1e293b 0%, #0b0f19 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: #f1f5f9;
    }

    .login-container {
      width: 100%;
      max-width: 440px;
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px 28px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(220, 38, 38, 0.15);
      position: relative;
    }

    .login-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .login-logo {
      height: 48px;
      max-width: 170px;
      object-fit: contain;
      margin-bottom: 12px;
    }

    .login-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.4px;
    }

    .login-subtitle {
      font-size: 0.82rem;
      color: #94a3b8;
      margin: 6px 0 0 0;
      line-height: 1.4;
    }

    .login-alert {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      margin-bottom: 18px;
      display: ${error ? 'block' : 'none'};
    }

    .form-group {
      margin-bottom: 18px;
    }

    .form-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 6px;
    }

    .form-input {
      width: 100%;
      background: #030712;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 11px 14px;
      color: #ffffff;
      font-size: 0.9rem;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-input:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25);
    }

    .btn-login {
      width: 100%;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 12px;
      font-size: 0.92rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-login:hover {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
    }

    .login-footer-info {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 0.74rem;
      color: #64748b;
      text-align: center;
      line-height: 1.5;
    }

    .login-footer-info code {
      color: #38bdf8;
      background: rgba(255, 255, 255, 0.06);
      padding: 1px 4px;
      border-radius: 4px;
    }
  </style>
</head>
<body class="login-body">
  <div class="login-container">
    <div class="login-header">
      <a href="/as/">
        <img src="/images/nd30_live_logo.png" alt="ND30 LIVE" class="login-logo">
      </a>
      <h1 class="login-title">Portal Sign In</h1>
      <p class="login-subtitle">
        Sign in to access your authorized Newsroom Desk, Editor Dashboard, or Promoter Portal.
      </p>
    </div>

    <div id="loginAlert" class="login-alert">${error}</div>

    <form id="loginForm" onsubmit="handleLoginSubmit(event)">
      <input type="hidden" id="loginRedirect" value="${redirect}">

      <div class="form-group">
        <label class="form-label" for="loginIdentifier">Username / Email / Promoter ID *</label>
        <input type="text" id="loginIdentifier" class="form-input" placeholder="e.g. admin or ND30-PRO-0000" required autofocus>
      </div>

      <div class="form-group">
        <label class="form-label" for="loginPassword">Password *</label>
        <div style="position: relative; display: flex; align-items: center;">
          <input type="password" id="loginPassword" class="form-input" placeholder="••••••••" required style="padding-right: 42px;">
          <button type="button" onclick="togglePasswordVisibility('loginPassword', this)" style="position: absolute; right: 10px; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.15rem; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Show / Hide Password">
            👁️
          </button>
        </div>
      </div>

      <button type="submit" id="loginSubmitBtn" class="btn-login">
        <span>🔐</span> Sign In
      </button>
    </form>

    <div class="login-footer-info">
      <div>🔒 <strong>ND30 LIVE Role-Based Security Hub</strong></div>
      <div style="margin-top:4px;">
        Super Admin: <code>admin</code> / <code>admin123</code> or <code>nd30live</code> • Promoters: enter your <code>ND30-PRO-XXXX</code> ID
      </div>
      <div style="margin-top:8px;">
        <a href="/as/" style="color:#94a3b8; text-decoration:none;">← Return to Website</a>
      </div>
    </div>
  </div>

  <script>
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

    async function handleLoginSubmit(event) {
      event.preventDefault();
      const identifier = document.getElementById('loginIdentifier').value.trim();
      const password = document.getElementById('loginPassword').value.trim();
      const redirect = document.getElementById('loginRedirect').value;
      const alertBox = document.getElementById('loginAlert');
      const submitBtn = document.getElementById('loginSubmitBtn');

      if (!identifier || !password) {
        alertBox.style.display = 'block';
        alertBox.innerText = 'Please enter both identifier and password.';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⏳</span> Verifying...';
      alertBox.style.display = 'none';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });
        const data = await res.json();

        if (data.success || data.token) {
          // If redirect specified, prefer it, otherwise use role redirect
          const target = redirect || data.redirectUrl || '/admin';
          window.location.href = target;
        } else {
          alertBox.style.display = 'block';
          alertBox.innerText = data.error || 'Invalid credentials.';
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>🔐</span> Sign In';
        }
      } catch (err) {
        alertBox.style.display = 'block';
        alertBox.innerText = 'Network error: ' + err.message;
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>🔐</span> Sign In';
      }
    }
  </script>
</body>
</html>`;
}

module.exports = {
  renderLoginPage
};

