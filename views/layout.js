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
  const anyAd = db.prepare("SELECT ad_client FROM adsense_slots WHERE is_active = 1 LIMIT 1").get();

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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
  <meta name="theme-color" content="#0b0f19" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#f8fafc" media="(prefers-color-scheme: light)">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
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
  ${anyAd ? `
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${(anyAd.ad_client || 'ca-pub-9876543210123456')}" crossorigin="anonymous"></script>
  ` : ''}

  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/reporter.css">
  <link rel="stylesheet" href="/css/advertisement.css">
  <style>
    /* Play Icon Overlay for Video Cards */
    .news-card-img-wrap,
    .hero-primary-card,
    .news-card-compact {
      position: relative;
    }
    .card-video-play-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.5) 100%);
      cursor: pointer;
      z-index: 5;
      transition: all 0.25s ease;
    }
    .card-video-play-overlay:hover {
      background: radial-gradient(circle, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%);
    }
    .card-play-button {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 18px rgba(220, 38, 38, 0.7), 0 0 0 4px rgba(255, 255, 255, 0.4);
      transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease;
      cursor: pointer;
    }
    .card-video-play-overlay:hover .card-play-button {
      transform: scale(1.15);
      box-shadow: 0 6px 26px rgba(220, 38, 38, 0.95), 0 0 0 6px rgba(255, 255, 255, 0.6);
    }
    .card-video-pill {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background: rgba(220, 38, 38, 0.95);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.6);
      pointer-events: none;
    }
    /* Video Lightbox */
    .video-lightbox-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.88);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 99999;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    }
    .video-lightbox-overlay.active {
      display: flex;
    }
    .video-lightbox-container {
      width: 100%;
      max-width: 820px;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85);
    }
    .video-lightbox-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: rgba(0, 0, 0, 0.45);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .video-lightbox-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .video-lightbox-close {
      background: rgba(255, 255, 255, 0.12);
      border: none;
      color: #fff;
      font-size: 1.25rem;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .video-lightbox-close:hover {
      background: #dc2626;
      transform: rotate(90deg);
    }
    .video-lightbox-body {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      background: #000;
    }
    .video-lightbox-body iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
    .video-lightbox-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: rgba(0, 0, 0, 0.45);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
  </style>
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
          <span class="ad-btn-icon">📢</span> <span class="nav-btn-label">Advertise With Us</span>
        </button>

        <!-- Highlighted Submit Your Interest CTA Button (Controlled via Backend Toggle) -->
        ${joinUsEnabled ? `
        <button type="button" class="reporter-cta-btn" id="navActionsReporterBtn" title="Submit Your Interest to join ND30 LIVE Network">
          <span class="rep-icon">🎙️</span> <span class="nav-btn-label">Submit Your Interest</span>
        </button>
        ` : ''}

        <!-- Mobile Language Dropdown -->
        <select onchange="window.location.href=this.value" class="mobile-lang-select" style="display:none; background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-color); border-radius:4px; padding:4px 8px; font-size:0.85rem;" aria-label="Mobile Language Picker">
          ${languages.map(l => `
            <option value="/${l.code}/" ${l.code === currentLang ? 'selected' : ''}>${l.native_name} (${l.code.toUpperCase()})</option>
          `).join('')}
        </select>
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
  ${renderNoticePanel(activeNotice, currentLang)}

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

  <!-- Frontend Facebook Video Lightbox Player Modal -->
  <div id="frontendVideoModal" class="video-lightbox-overlay" onclick="handleVideoModalBackdropClick(event)">
    <div class="video-lightbox-container" role="dialog" aria-modal="true" aria-labelledby="modalVideoTitle">
      <!-- Modal Header -->
      <div class="video-lightbox-header">
        <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1; margin-right:12px;">
          <span id="modalVideoBadge" style="background:#dc2626; color:#fff; font-size:0.72rem; font-weight:800; padding:2px 8px; border-radius:4px; flex-shrink:0;">▶ VIDEO</span>
          <h3 id="modalVideoTitle" class="video-lightbox-title">ND30 Video Coverage</h3>
        </div>
        <button type="button" class="video-lightbox-close" onclick="closeFrontendVideoModal()" title="Close Video (Esc)">&times;</button>
      </div>

      <!-- Quick Action Bar: Direct Watch on Facebook + Player Mode Switch -->
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; padding:10px 18px; background:#1e293b; border-bottom:1px solid rgba(255,255,255,0.08);">
        <a id="modalFbDirectLinkTop" href="#" target="_blank" rel="noopener noreferrer" style="background:#1877F2; color:#fff; font-weight:700; text-decoration:none; padding:7px 15px; border-radius:6px; display:inline-flex; align-items:center; gap:8px; font-size:0.85rem; box-shadow:0 2px 10px rgba(24,119,242,0.45); transition:background 0.2s ease;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          <span>▶ Watch Directly on Facebook ↗</span>
        </a>

        <button id="modalSwitchPlayerBtn" type="button" onclick="toggleFrontendVideoPlayerMode()" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.22); color:#e2e8f0; font-size:0.75rem; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600; display:inline-flex; align-items:center; gap:5px;" title="Switch embed format if video shows unavailable">
          <span>🔄</span> <span id="modalSwitchPlayerText">Switch to Post Embed</span>
        </button>
      </div>

      <!-- Video Player Body -->
      <div class="video-lightbox-body" style="background:#000;">
        <iframe id="frontendVideoIframe" src="about:blank" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" scrolling="no"></iframe>
      </div>

      <!-- Playback helper hint banner -->
      <div style="padding:8px 18px; background:#0b1120; border-top:1px solid rgba(255,255,255,0.06); font-size:0.78rem; color:#94a3b8; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <span>💡 If Facebook shows <em>"Video unavailable"</em> due to privacy or login rules, click <strong>Watch Directly on Facebook</strong> above.</span>
        <a id="modalFbDirectLinkSmall" href="#" target="_blank" rel="noopener noreferrer" style="color:#60a5fa; font-weight:700; text-decoration:none;">Open in Facebook App ↗</a>
      </div>

      <!-- Footer -->
      <div class="video-lightbox-footer">
        <a id="modalArticleLink" href="#" class="btn btn-primary btn-sm" style="display:flex; align-items:center; gap:6px; font-size:0.85rem; text-decoration:none;">
          <span>📖</span> Read Full Story ↗
        </a>
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeFrontendVideoModal()">Close</button>
      </div>
    </div>
  </div>

  <script>
    var currentActiveVideoState = {
      rawUrl: '',
      canonicalUrl: '',
      mode: 'video', // 'video' or 'post'
      articleUrl: '',
      title: ''
    };

    function buildFbEmbedSrc(url, mode) {
      if (!url) return 'about:blank';
      var clean = url.replace('m.facebook.com', 'www.facebook.com');
      var isReel = clean.includes('/reel/') || clean.includes('/share/r/');
      // For reels or forced 'post' mode, use plugins/post.php
      if (mode === 'post' || isReel) {
        return 'https://www.facebook.com/plugins/post.php?href=' + encodeURIComponent(clean) + '&show_text=false&width=780';
      }
      return 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(clean) + '&show_text=false&autoplay=true&width=780';
    }

    function openFrontendVideoModal(videoUrl, title, articleUrl) {
      if (!videoUrl) return;
      var modal = document.getElementById('frontendVideoModal');
      var iframe = document.getElementById('frontendVideoIframe');
      var titleEl = document.getElementById('modalVideoTitle');
      var linkEl = document.getElementById('modalArticleLink');
      var fbTopBtn = document.getElementById('modalFbDirectLinkTop');
      var fbSmallLink = document.getElementById('modalFbDirectLinkSmall');
      var badgeEl = document.getElementById('modalVideoBadge');
      var switchText = document.getElementById('modalSwitchPlayerText');

      var isReel = videoUrl.includes('/reel/') || videoUrl.includes('/share/r/');
      currentActiveVideoState = {
        rawUrl: videoUrl,
        canonicalUrl: videoUrl,
        mode: isReel ? 'post' : 'video',
        articleUrl: articleUrl || '#',
        title: title || 'ND30 Video Coverage'
      };

      if (titleEl) titleEl.innerText = currentActiveVideoState.title;
      if (linkEl) linkEl.href = currentActiveVideoState.articleUrl;
      if (fbTopBtn) fbTopBtn.href = videoUrl;
      if (fbSmallLink) fbSmallLink.href = videoUrl;
      if (badgeEl) badgeEl.innerText = isReel ? '▶ REEL' : '▶ VIDEO';
      if (switchText) switchText.innerText = (currentActiveVideoState.mode === 'post') ? 'Switch to Video Player' : 'Switch to Post Embed';

      // Load initial embed
      if (iframe) {
        iframe.src = buildFbEmbedSrc(videoUrl, currentActiveVideoState.mode);
      }

      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }

      // If URL is a share redirect, mobile link, or not yet canonicalized, resolve in background
      if (videoUrl.includes('/share/') || videoUrl.includes('fb.watch') || videoUrl.includes('m.facebook.com') || !videoUrl.includes('watch/?v=')) {
        fetch('/api/facebook/resolve-video?url=' + encodeURIComponent(videoUrl))
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data && data.success && data.canonicalUrl && data.canonicalUrl !== currentActiveVideoState.rawUrl) {
              currentActiveVideoState.canonicalUrl = data.canonicalUrl;
              if (fbTopBtn) fbTopBtn.href = data.canonicalUrl;
              if (fbSmallLink) fbSmallLink.href = data.canonicalUrl;
              // If previously was share/v or share/r, reload iframe with clean canonical URL
              if (currentActiveVideoState.rawUrl.includes('/share/') || currentActiveVideoState.rawUrl.includes('fb.watch')) {
                if (iframe) iframe.src = buildFbEmbedSrc(data.canonicalUrl, currentActiveVideoState.mode);
              }
            }
          })
          .catch(function() {});
      }
    }

    function toggleFrontendVideoPlayerMode() {
      var iframe = document.getElementById('frontendVideoIframe');
      var switchText = document.getElementById('modalSwitchPlayerText');
      currentActiveVideoState.mode = (currentActiveVideoState.mode === 'video') ? 'post' : 'video';
      if (switchText) {
        switchText.innerText = (currentActiveVideoState.mode === 'post') ? 'Switch to Video Player' : 'Switch to Post Embed';
      }
      var targetUrl = currentActiveVideoState.canonicalUrl || currentActiveVideoState.rawUrl;
      if (iframe) {
        iframe.src = buildFbEmbedSrc(targetUrl, currentActiveVideoState.mode);
      }
    }

    function closeFrontendVideoModal() {
      var modal = document.getElementById('frontendVideoModal');
      var iframe = document.getElementById('frontendVideoIframe');
      if (iframe) iframe.src = 'about:blank'; // stop video & audio immediately
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }

    function handleVideoModalBackdropClick(e) {
      if (e.target && e.target.id === 'frontendVideoModal') {
        closeFrontendVideoModal();
      }
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeFrontendVideoModal();
      }
    });
  </script>

  <script src="/js/main.js"></script>
  ${joinUsEnabled ? '<script src="/js/reporter.js"></script>' : ''}
  <script src="/js/advertisement.js"></script>
</body>
</html>`;
}

module.exports = {
  renderLayout
};
