/**
 * ND30 LIVE - Master Frontend Layout
 * Multilingual Header, 3-Language Selector, Breaking Ticker, AdSense Slots, SEO Meta
 */

const { db } = require('../database/db');
const { renderReporterModal } = require('./reporterModal');
const { renderAdvertisementModal } = require('./advertisementModal');
const { renderHeaderSocialQrHtml } = require('../services/socialQrService');
const { getAdvertisementSettings } = require('../services/advertisementService');
const { renderNoticePanel } = require('./noticePanel');
const { getActiveNotice } = require('../services/noticeService');

function renderLayout({
  title,
  description,
  lang = 'as',
  content,
  canonicalUrl = '',
  hreflangTags = '',
  jsonLd = '',
  breadcrumbJsonLd = '',
  activeCategorySlug = '',
  reqUrl = '',
  alternateLangUrls = null
}) {
  const currentLang = lang || 'as';
  const baseUrl = process.env.BASE_URL || 'http://localhost:3030';
  const adSettings = getAdvertisementSettings();
  const joinUsEnabled = adSettings.join_us_enabled === 1;

  // Get active languages
  const languages = db.prepare('SELECT * FROM languages WHERE is_active = 1 ORDER BY sort_order').all();

  // Get categories for current language
  const categories = db.prepare('SELECT * FROM categories WHERE lang_code = ? ORDER BY sort_order').all(currentLang);

  // Get breaking news for current language
  const breakingNews = db.prepare('SELECT * FROM breaking_news WHERE lang_code = ? AND is_active = 1 ORDER BY sort_order').all(currentLang);

  // Get active AdSense slots
  const headerAd = db.prepare("SELECT * FROM adsense_slots WHERE slot_key = 'header_leaderboard' AND is_active = 1").get();
  const footerAd = db.prepare("SELECT * FROM adsense_slots WHERE slot_key = 'footer_banner' AND is_active = 1").get();

  // Get Analytics
  const analytics = db.prepare('SELECT * FROM analytics_settings WHERE id = 1 AND is_active = 1').get();

  // Get active Notice Panel (returns null if turned OFF)
  const activeNotice = getActiveNotice();

  // Current Date display based on language
  const now = new Date();
  let dateString = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  let breakingLabel = 'BREAKING NEWS';
  let liveText = 'LIVE';
  let epaperText = 'E-Paper';
  let adminText = 'Admin CMS';

  if (currentLang === 'as') {
    breakingLabel = 'ব্ৰেকিং নিউজ';
    liveText = 'লাইভ সম্প্ৰচাৰ';
    epaperText = 'ই-বাতৰি কাকত';
    adminText = 'এডমিন পেনেল';
  } else if (currentLang === 'hi') {
    breakingLabel = 'ताज़ा समाचार';
    liveText = 'लाइव प्रसारण';
    epaperText = 'ई-अखबार';
    adminText = 'एडमिन पैनल';
  }

  return `<!DOCTYPE html>
<html lang="${currentLang}" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'ND30 LIVE | Northeast India & National News'}</title>
  <meta name="description" content="${description || 'ND30 LIVE - Leading independent multilingual news portal covering Assam, Northeast India, National and World news.'}">
  <link rel="icon" type="image/png" href="/images/nd30_live_logo.png">
  <link rel="shortcut icon" href="/images/nd30_live_logo.png">
  <link rel="apple-touch-icon" href="/images/nd30_live_logo.png">
  
  <!-- SEO Canonicals & Hreflang Tags -->
  ${canonicalUrl ? `<link rel="canonical" href="${canonicalUrl}">` : ''}
  ${hreflangTags}
  
  <!-- RSS Feed for this language -->
  <link rel="alternate" type="application/rss+xml" title="ND30 LIVE (${currentLang.toUpperCase()}) RSS Feed" href="/${currentLang}/rss.xml">

  <!-- OpenGraph Metadata -->
  <meta property="og:site_name" content="ND30 LIVE">
  <meta property="og:title" content="${title || 'ND30 LIVE'}">
  <meta property="og:description" content="${description || 'ND30 LIVE - Multilingual news from Assam and India'}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl || baseUrl + '/' + currentLang + '/'}">
  <meta property="og:image" content="${baseUrl}/images/nd30_live_logo.png">
  <meta property="og:locale" content="${currentLang === 'as' ? 'as_IN' : (currentLang === 'hi' ? 'hi_IN' : 'en_US')}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title || 'ND30 LIVE'}">
  <meta name="twitter:description" content="${description || 'ND30 LIVE'}">
  <meta name="twitter:image" content="${baseUrl}/images/nd30_live_logo.png">

  <!-- Schema.org JSON-LD Structured Data -->
  ${jsonLd ? `<script type="application/ld+json">\n${jsonLd}\n</script>` : ''}
  ${breadcrumbJsonLd ? `<script type="application/ld+json">\n${breadcrumbJsonLd}\n</script>` : ''}

  <!-- Google Analytics Tracking (Configurable) -->
  ${analytics && analytics.is_active && analytics.ga_measurement_id ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${analytics.ga_measurement_id}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${analytics.ga_measurement_id}', {
      'custom_map': {'dimension1': 'language'}
    });
    gtag('event', 'page_view', { 'language': '${currentLang}' });
  </script>` : ''}

  <!-- Google AdSense Script (Configurable) -->
  ${(headerAd || footerAd) ? `
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${(headerAd?.ad_client || 'ca-pub-9876543210123456')}" crossorigin="anonymous"></script>
  ` : ''}

  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/reporter.css">
  <link rel="stylesheet" href="/css/advertisement.css">
</head>
<body>
  <!-- Top Utility Bar -->
  <aside class="top-bar" aria-label="Utility navigation">
    <div class="container top-bar-inner">
      <div class="top-bar-left">
        <span class="live-badge"><span class="pulse-dot"></span> ${liveText}</span>
        <span class="current-date">📅 ${dateString}</span>
        <span>📍 Guwahati, Assam</span>
      </div>

      <div class="top-bar-right">
        <!-- Professional 3-Language Selector -->
        <nav class="lang-selector-group" aria-label="Language Selector">
          ${languages.map(l => {
            const href = (alternateLangUrls && alternateLangUrls[l.code]) ? alternateLangUrls[l.code] : `/${l.code}/`;
            return `
              <a href="${href}" class="lang-btn ${l.code === currentLang ? 'active' : ''}" title="Switch to ${l.name}">
                ${l.native_name}
                <span class="lang-tag">${l.code.toUpperCase()}</span>
              </a>
            `;
          }).join('')}
        </nav>

        <a href="/admin" class="top-link" style="color:var(--text-muted); font-size:0.8rem;">⚙️ ${adminText}</a>
        
        <button id="themeToggleBtn" class="theme-toggle-btn" title="Toggle Theme" aria-label="Toggle Dark/Light Mode">
          ☀️
        </button>
      </div>
    </div>
  </aside>

  <!-- Main Brand Header -->
  <header class="main-header">
    <div class="container header-row">
      <a href="/${currentLang}/" class="brand-logo-link" aria-label="ND30 LIVE Home">
        <div class="brand-logo-wrapper">
          <img src="/images/nd30_live_logo.png" alt="ND30 LIVE" class="brand-logo-img">
        </div>
        <div class="brand-text-block">
          <span class="brand-tagline">
            ${currentLang === 'as' ? 'উত্তৰ-পূবৰ কণ্ঠস্বৰ • নিৰ্ভীক আৰু নিৰপেক্ষ' : (currentLang === 'hi' ? 'पूर्वोत्तर की आवाज़ • निष्पक्ष व विश्वसनीय' : 'Voice of Northeast India • Bold & Unbiased')}
          </span>
        </div>
      </a>

      <!-- Official Social QR Codes Hub (Replaces Header AdSense) -->
      ${renderHeaderSocialQrHtml()}
    </div>
  </header>

  <!-- Category Sticky Navigation -->
  <nav class="category-nav-bar" aria-label="Main Navigation">
    <div class="container category-nav-inner">
      <ul class="nav-links">
        <li class="nav-item ${!activeCategorySlug ? 'active' : ''}">
          <a href="/${currentLang}/">
            ${currentLang === 'as' ? 'মুখ্য পৃষ্ঠা' : (currentLang === 'hi' ? 'मुख्य पृष्ठ' : 'Home')}
          </a>
        </li>
        ${categories.map(c => `
          <li class="nav-item ${activeCategorySlug === c.slug ? 'active' : ''}">
            <a href="/${currentLang}/${c.slug}">${c.name}</a>
          </li>
        `).join('')}
      </ul>

      <div class="nav-actions">
        <!-- Highlighted Advertise With Us CTA Button -->
        <button type="button" class="advertise-cta-btn" id="navAdvertiseBtn" title="Book Advertisement on ND30 LIVE & Influencers">
          <span class="ad-btn-icon">📢</span> Advertise With Us
        </button>

        <!-- Highlighted Join us CTA Button (Controlled via Backend Toggle) -->
        ${joinUsEnabled ? `
        <button type="button" class="reporter-cta-btn" id="navActionsReporterBtn" title="Apply to join ND30 LIVE Network">
          <span class="rep-icon">🎙️</span> Join us
        </button>
        ` : ''}

        <!-- Mobile Language Dropdown -->
        <select onchange="window.location.href=this.value" class="mobile-lang-select" style="display:none; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-color); border-radius:4px; padding:4px 8px; font-size:0.85rem;" aria-label="Mobile Language Picker">
          ${languages.map(l => `
            <option value="/${l.code}/" ${l.code === currentLang ? 'selected' : ''}>${l.native_name} (${l.code.toUpperCase()})</option>
          `).join('')}
        </select>
        
        <a href="/${currentLang}/rss.xml" title="RSS Feed" style="color:var(--accent-gold); font-size:1.1rem; padding:4px;">
          📡
        </a>
      </div>
    </div>
  </nav>

  <!-- Breaking News Live Ticker -->
  ${breakingNews.length > 0 ? `
  <section class="breaking-ticker" aria-label="Breaking News Ticker">
    <div class="ticker-label">
      <span class="pulse-dot"></span>
      ${breakingLabel}
    </div>
    <div class="ticker-content">
      <div class="ticker-marquee">
        ${breakingNews.map(bn => `
          <a href="${bn.link || '#'}" class="ticker-item">
            <span>${bn.title}</span>
            <span class="ticker-separator">✦</span>
          </a>
        `).join('')}
        ${breakingNews.map(bn => `
          <a href="${bn.link || '#'}" class="ticker-item">
            <span>${bn.title}</span>
            <span class="ticker-separator">✦</span>
          </a>
        `).join('')}
      </div>
    </div>
  </section>` : ''}

  <!-- Frontend Notice Panel (Live with On/Off State, Text Styling & 5 Animations) -->
  ${renderNoticePanel(activeNotice)}

  <!-- Main Dynamic Page Content -->
  <main class="main-content">
    ${content}
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container">
      <!-- Footer Billboard AdSense Unit -->
      ${footerAd ? `
      <div style="margin-bottom:32px; text-align:center;">
        <div class="ad-slot-container" style="max-width:970px; margin:0 auto;">
          <span class="ad-label">Advertisement • AdSense Billboard</span>
          ${footerAd.custom_html || `
          <ins class="adsbygoogle"
               style="display:inline-block;width:970px;height:90px"
               data-ad-client="${footerAd.ad_client}"
               data-ad-slot="${footerAd.ad_slot_id}"></ins>
          <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
          `}
        </div>
      </div>` : ''}

      <div class="footer-grid">
        <div>
          <a href="/${currentLang}/" class="brand-logo-link" style="margin-bottom:14px; text-decoration:none;">
            <img src="/images/nd30_live_logo.png" alt="ND30 LIVE" style="height:54px; max-width:180px; object-fit:contain; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5)); transition:transform 0.25s ease;">
          </a>
          <p style="font-size:0.85rem; line-height:1.6; margin-bottom:16px;">
            ${currentLang === 'as' 
              ? 'ND30 LIVE অসম আৰু উত্তৰ-পূৰ্বাঞ্চলৰ নিৰপেক্ষ আৰু শীৰ্ষস্থানীয় ডিজিটেল লাইভ সংবাদ মাধ্যম। সত্য, বিশ্বাসযোগ্যতা আৰু নিৰ্ভীক সাংবাদিকতা আমাৰ মূল মন্ত্ৰ।'
              : (currentLang === 'hi'
                ? 'ND30 LIVE असम और पूर्वोत्तर का अग्रणी स्वतंत्र डिजिटल समाचार संस्थान है। तथ्यपरक पत्रकारिता और निष्पक्षता हमारा संकल्प है।'
                : 'ND30 LIVE is an independent news network delivering high-impact journalism from Assam, Northeast India, and the nation.')}
          </p>
          <div style="display:flex; gap:10px;">
            <a href="https://t.me" class="share-btn tg" target="_blank" title="Telegram">✈️</a>
            <a href="https://www.facebook.com/nd30live/" class="share-btn fb" target="_blank" title="Facebook">f</a>
            <a href="https://twitter.com" class="share-btn x" target="_blank" title="X">𝕏</a>
          </div>
        </div>

        <div>
          <h4 class="footer-col-title">Language Editions</h4>
          <ul class="footer-links">
            <li><a href="/as/">অসমীয়া (Assamese)</a></li>
            <li><a href="/hi/">हिंदी (Hindi)</a></li>
            <li><a href="/en/">English Edition</a></li>
          </ul>
        </div>

        <!-- Registered Office (Animated) -->
        <div>
          <div class="footer-office-card">
            <div class="footer-office-header">
              <span class="footer-office-pulse-dot"></span>
              <h4 class="footer-office-title">Registered Office</h4>
            </div>
            <div class="footer-office-body">
              <p>📍 Chapar Town,</p>
              <p>🏛️ Dhubri (Assam)</p>
              <p>📮 PIN: 783371</p>
              <p class="footer-office-email">
                ✉️ <span>Email:</span> <a href="mailto:nd30team@gmail.com">nd30team@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>&copy; ${new Date().getFullYear()} ND30 LIVE Network. All rights reserved.</span>
        <div class="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Editorial Guidelines</a>
          <a href="#">Contact Newsroom</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Join as a Reporter Modal Popup (If Enabled) -->
  ${joinUsEnabled ? renderReporterModal(currentLang) : ''}

  <!-- Book Advertisement Modal Popup -->
  ${renderAdvertisementModal(currentLang)}

  <script src="/js/main.js"></script>
  ${joinUsEnabled ? '<script src="/js/reporter.js"></script>' : ''}
  <script src="/js/advertisement.js"></script>
</body>
</html>`;
}

module.exports = {
  renderLayout
};
