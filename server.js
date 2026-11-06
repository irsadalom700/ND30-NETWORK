/**
 * ND30 LIVE - Main Server Application
 * Express.js, SQLite Database, Multilingual Publishing Engine,
 * Facebook Graph API Importer, IFTTT Automation Webhooks, RSS Feeds, Sitemaps.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const { db, initDatabase } = require('./database/db');
const { detectLanguage } = require('./services/languageDetector');
const { generateArticleTranslation } = require('./services/aiTranslator');
const { triggerArticlePublicationEvent, handleInboundWebhook, retryFailedEvent } = require('./services/iftttService');
const { syncFacebookPage, approveFacebookImport } = require('./services/facebookService');
const {
  generateHreflangTags,
  generateNewsArticleJsonLd,
  generateBreadcrumbJsonLd,
  generateMasterSitemapXml,
  generateLanguageSitemapXml,
  generateGoogleNewsSitemapXml,
  generateLanguageRssFeed
} = require('./services/seoService');

// Views
const { renderLayout } = require('./views/layout');
const { renderHomePage } = require('./views/home');
const { renderArticlePage } = require('./views/article');
const { renderCategoryPage } = require('./views/category');

// Admin Views
const { renderAdminLayout } = require('./views/admin/layout');
const { renderAdminDashboard } = require('./views/admin/dashboard');
const { renderEditorPage } = require('./views/admin/editor');
const { renderArticlesList } = require('./views/admin/articles');
const { renderFacebookDashboard } = require('./views/admin/facebook');
const { renderIftttStudio } = require('./views/admin/ifttt');
const { renderIntegrationsHub } = require('./views/admin/integrations');
const { renderAdSenseManager } = require('./views/admin/adsense');
const { renderReporterApplicationsAdmin } = require('./views/admin/reporters');
const { renderSocialQrAdmin } = require('./views/admin/socialQr');
const { renderAdvertisementAdmin } = require('./views/admin/advertisements');
const { renderRolesAdmin } = require('./views/admin/roles');
const { renderNoticeAdmin } = require('./views/admin/notice');
const {
  getNotice,
  saveNotice,
  toggleNoticeStatus,
  uploadNoticeImage
} = require('./services/noticeService');
const { renderLoginPage } = require('./views/login');
const { renderPromoterDashboard } = require('./views/promoter/dashboard');
const { renderVerifyPressIdPage } = require('./views/verifyPressId');
const { uploadReporterDocs, saveReporterApplication, sendApplicationEmail } = require('./services/reporterService');
const { approveReporterApplication, rejectReporterApplication, getReporterByPressId } = require('./services/pressCardService');
const {
  createUser,
  getUserById,
  getAllUsers,
  changeUserPassword,
  updateUser,
  deleteUser,
  loginUser,
  logoutUser,
  getSessionUser,
  markCommissionPaid
} = require('./services/authService');
const {
  addSocialLink,
  updateSocialLink,
  deleteSocialLink
} = require('./services/socialQrService');
const {
  createAdvertisementBooking,
  updateBookingStatus,
  updateAdvertisementSettings,
  addPromotionType,
  updatePromotionType,
  deletePromotionType,
  addInfluencer,
  updateInfluencer,
  deleteInfluencer,
  uploadAdSlideImage,
  getAllSlides,
  getActiveSlides,
  createSlide,
  toggleSlideStatus,
  deleteSlide
} = require('./services/advertisementService');
const {
  sendWhatsAppOtp,
  verifyWhatsAppOtp
} = require('./services/whatsappService');

// Initialize Database
initDatabase();

const app = express();
const PORT = process.env.PORT || 3030;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Parse cookies helper
function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (!name) return;
    const value = parts.slice(1).join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

// Session Authentication Middleware
app.use((req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.nd30_session || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '').trim() : null);
  req.user = token ? getSessionUser(token) : null;
  next();
});

// Role Guard Middlewares
function checkAdminAuth(req, res, next) {
  if (!req.user) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' });
    }
    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  if (req.user.role === 'promoter') {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ success: false, error: 'Access denied for promoter role.' });
    }
    return res.redirect('/promoter');
  }
  next();
}

function requireRoleAdmin(req, res, next) {
  if (!req.user) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' });
    }
    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  if (req.user.role !== 'admin') {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ success: false, error: 'Super Admin access required.' });
    }
    return res.status(403).send(renderAdminLayout({
      title: 'Super Admin Required',
      activeNav: 'dashboard',
      currentUser: req.user,
      content: `
        <div style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 3.5rem; margin-bottom: 16px;">🛡️</div>
          <h2 style="color: #ef4444; margin-bottom: 12px;">Super Admin Privileges Required</h2>
          <p style="color: #94a3b8; max-width: 500px; margin: 0 auto 24px;">The Roles & Permissions section can only be managed by Super Administrators.</p>
          <a href="/admin" class="btn btn-primary">Return to Permitted Dashboard</a>
        </div>
      `
    }));
  }
  next();
}

function checkModule(slug) {
  return (req, res, next) => {
    if (!req.user) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' });
      }
      return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
    }
    if (req.user.role === 'promoter') {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ success: false, error: 'Access denied for promoter role.' });
      }
      return res.redirect('/promoter');
    }
    if (req.user.role === 'admin') {
      return next();
    }
    if (req.user.role === 'editor') {
      const perms = req.user.permissions || [];
      if (perms.includes('*') || perms.includes(slug)) {
        return next();
      }
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ success: false, error: `Access denied. You do not have permission for '${slug}'.` });
      }
      return res.status(403).send(renderAdminLayout({
        title: 'Module Access Denied',
        activeNav: slug,
        currentUser: req.user,
        content: `
          <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 3.5rem; margin-bottom: 16px;">🔒</div>
            <h2 style="color: #f87171; margin-bottom: 12px;">Module Access Not Permitted</h2>
            <p style="color: #94a3b8; max-width: 540px; margin: 0 auto 24px; line-height: 1.6;">
              Your Approved Editor account (<strong>${req.user.fullName || req.user.username}</strong>) does not have permission to view or manage the <strong>${slug}</strong> module.<br>
              Admin has restricted your workspace to only the options assigned to you.
            </p>
            <div style="display: flex; justify-content: center; gap: 12px;">
              ${perms.length > 0 && perms[0] !== slug ? `<a href="/admin/${perms[0] === 'dashboard' ? '' : perms[0]}" class="btn btn-primary">Go to Permitted Workspace</a>` : ''}
              <a href="/logout" class="btn btn-secondary">Log Out</a>
            </div>
          </div>
        `
      }));
    }
    return res.redirect('/login');
  };
}

/* ==========================================================================
   PUBLIC MULTILINGUAL FRONTEND ROUTES
   ========================================================================== */

// Root URL: Smart redirection based on language preference (default: /as/)
app.get('/', (req, res) => {
  res.redirect(302, '/as/');
});

// Language Homepages: /as/, /hi/, /en/
app.get(['/:lang', '/:lang/'], (req, res, next) => {
  const { lang } = req.params;
  if (!['as', 'hi', 'en'].includes(lang)) {
    return next();
  }

  const langNames = {
    'as': 'অসমীয়া মুখ্য পৃষ্ঠা | ND30 LIVE',
    'hi': 'हिंदी मुख्य पृष्ठ | ND30 LIVE',
    'en': 'English Edition Homepage | ND30 LIVE'
  };

  const descriptions = {
    'as': 'অসম আৰু উত্তৰ-পূৰ্বাঞ্চলৰ নিৰ্ভীক আৰু নিৰপেক্ষ সংবাদ মাধ্যম ND30 LIVE। লাইভ ব্ৰেকিং নিউজ, ৰাজনীতি, অৰ্থনীতি আৰু সামাজিক খবৰ।',
    'hi': 'ND30 LIVE - असम, पूर्वोत्तर और देश-विदेश की ताज़ा एवं निष्पक्ष खबरें। पढ़ें लाइव व ब्रेकिंग न्यूज़ हिंदी में।',
    'en': 'ND30 LIVE - Authoritative and independent journalism covering Assam, Northeast India, and national developments in real time.'
  };

  const pageContent = renderHomePage(lang);
  const fullHtml = renderLayout({
    title: langNames[lang],
    description: descriptions[lang],
    lang,
    content: pageContent,
    canonicalUrl: `${BASE_URL}/${lang}/`,
    hreflangTags: `
      <link rel="alternate" hreflang="as" href="${BASE_URL}/as/" />
      <link rel="alternate" hreflang="hi" href="${BASE_URL}/hi/" />
      <link rel="alternate" hreflang="en" href="${BASE_URL}/en/" />
      <link rel="alternate" hreflang="x-default" href="${BASE_URL}/en/" />
    `,
    alternateLangUrls: { as: '/as/', hi: '/hi/', en: '/en/' }
  });

  res.send(fullHtml);
});

// Language Specific RSS Feeds: /as/rss.xml, /hi/rss.xml, /en/rss.xml
app.get('/:lang/rss.xml', (req, res, next) => {
  const { lang } = req.params;
  if (!['as', 'hi', 'en'].includes(lang)) return next();

  const rssXml = generateLanguageRssFeed(lang, BASE_URL);
  res.set('Content-Type', 'application/rss+xml; charset=UTF-8');
  res.send(rssXml);
});

// Language Specific XML Sitemaps: /as/sitemap.xml, /hi/sitemap.xml, /en/sitemap.xml
app.get('/:lang/sitemap.xml', (req, res, next) => {
  const { lang } = req.params;
  if (!['as', 'hi', 'en'].includes(lang)) return next();

  const sitemapXml = generateLanguageSitemapXml(lang, BASE_URL);
  res.set('Content-Type', 'application/xml; charset=UTF-8');
  res.send(sitemapXml);
});

// Master Sitemap Index: /sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  const masterXml = generateMasterSitemapXml(BASE_URL);
  res.set('Content-Type', 'application/xml; charset=UTF-8');
  res.send(masterXml);
});

// Google News Sitemap: /news-sitemap.xml
app.get('/news-sitemap.xml', (req, res) => {
  const newsXml = generateGoogleNewsSitemapXml(BASE_URL);
  res.set('Content-Type', 'application/xml; charset=UTF-8');
  res.send(newsXml);
});

// Direct Story Language Switcher & Instant Auto-Translator: /:lang/story/:articleId
app.get('/:lang/story/:articleId', async (req, res, next) => {
  const { lang, articleId } = req.params;
  if (!['as', 'hi', 'en'].includes(lang)) return next();

  let translation = db.prepare(`
    SELECT t.*, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.article_id = ? AND t.lang_code = ? AND t.status = 'published'
  `).get(articleId, lang);

  if (translation) {
    return res.redirect(302, `/${lang}/${translation.category_slug || 'assam'}/${translation.slug}`);
  }

  // Find any published translation for this article cluster
  const sourceTrans = db.prepare(`
    SELECT t.*, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.article_id = ? AND t.status = 'published'
    ORDER BY t.id ASC LIMIT 1
  `).get(articleId);

  if (!sourceTrans) return next();

  try {
    const result = await generateArticleTranslation({
      title: sourceTrans.title,
      summary: sourceTrans.summary,
      content: sourceTrans.content,
      tags: sourceTrans.tags,
      sourceLang: sourceTrans.lang_code,
      targetLang: lang
    });

    const draft = result.translatedDraft;
    const matchedCatId = getMatchingCategoryId(sourceTrans.category_id, lang);
    const matchedCat = matchedCatId ? db.prepare('SELECT slug FROM categories WHERE id = ?').get(matchedCatId) : null;

    db.prepare(`
      INSERT INTO article_translations (
        article_id, lang_code, title, slug, summary, content, category_id,
        subcategory_slug, tags, featured_image, image_caption, seo_title, seo_description,
        status, is_breaking, is_featured, is_trending, views_count, author_name, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      articleId,
      lang,
      draft.title,
      draft.slug,
      draft.summary,
      draft.content,
      matchedCatId,
      sourceTrans.subcategory_slug || '',
      draft.tags,
      sourceTrans.featured_image,
      sourceTrans.image_caption,
      draft.seoTitle,
      draft.seoDescription,
      sourceTrans.is_breaking,
      sourceTrans.is_featured,
      sourceTrans.is_trending,
      sourceTrans.views_count || 10,
      sourceTrans.author_name || 'ND30 LIVE Desk'
    );

    return res.redirect(302, `/${lang}/${matchedCat?.slug || 'assam'}/${draft.slug}`);
  } catch (err) {
    console.error('Error auto-translating story on-the-fly:', err.message);
    return next();
  }
});

// Article Routes:
// Case A: 3-tier URL e.g. /as/assam/dhubri/sample-assamese-news
app.get('/:lang/:category/:subcategory/:slug', (req, res, next) => {
  handleArticleRoute(req, res, next);
});

// Case B: 2-tier URL e.g. /hi/national/sample-hindi-news OR Category page /hi/national
app.get('/:lang/:category/:slug', (req, res, next) => {
  handleArticleRoute(req, res, next);
});

// Category Route: /:lang/:category
app.get('/:lang/:category', (req, res, next) => {
  const { lang, category: catSlug } = req.params;
  if (!['as', 'hi', 'en'].includes(lang)) return next();

  const cat = db.prepare('SELECT * FROM categories WHERE lang_code = ? AND slug = ?').get(lang, catSlug);
  if (!cat) {
    return next();
  }

  const articles = db.prepare(`
    SELECT t.*, c.name as category_name
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.lang_code = ? AND t.category_id = ? AND t.status = 'published'
    ORDER BY t.published_at DESC
  `).all(lang, cat.id);

  const pageContent = renderCategoryPage({ category: cat, articles, lang });
  const fullHtml = renderLayout({
    title: `${cat.name} | ND30 LIVE (${lang.toUpperCase()})`,
    description: cat.description || `News stories in ${cat.name} from ND30 LIVE`,
    lang,
    content: pageContent,
    canonicalUrl: `${BASE_URL}/${lang}/${catSlug}`,
    activeCategorySlug: catSlug,
    alternateLangUrls: {
      as: `/as/${catSlug}`,
      hi: `/hi/${catSlug}`,
      en: `/en/${catSlug}`
    }
  });

  res.send(fullHtml);
});

/**
 * Universal Article Resolver
 * Auto-detects articles across languages, performs on-the-fly auto-translation
 * if requested language translation is not yet created, and binds seamless cross-lingual navigation.
 */
async function handleArticleRoute(req, res, next) {
  const { lang, category: catSlug, subcategory, slug } = req.params;
  if (!['as', 'hi', 'en'].includes(lang)) return next();

  const targetSlug = slug || req.params.slug;

  // 1. Find translation in database for requested language
  let translation = db.prepare(`
    SELECT t.*, c.name as category_name, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.lang_code = ? AND t.slug = ? AND t.status = 'published'
  `).get(lang, targetSlug);

  // 2. If not found by slug in this language, check if slug belongs to ANY language edition of this story!
  if (!translation) {
    const siblingTrans = db.prepare(`
      SELECT t.*, c.slug as category_slug
      FROM article_translations t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.slug = ? AND t.status = 'published'
      LIMIT 1
    `).get(targetSlug);

    if (siblingTrans) {
      // Check if translation in requested language already exists for this story cluster
      translation = db.prepare(`
        SELECT t.*, c.name as category_name, c.slug as category_slug
        FROM article_translations t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.article_id = ? AND t.lang_code = ? AND t.status = 'published'
      `).get(siblingTrans.article_id, lang);

      if (translation) {
        const cat = translation.category_slug || 'assam';
        return res.redirect(302, `/${lang}/${cat}/${translation.slug}`);
      }

      // If translation does NOT exist yet -> AUTO-TRANSLATE ON THE FLY!
      try {
        const transResult = await generateArticleTranslation({
          title: siblingTrans.title,
          summary: siblingTrans.summary,
          content: siblingTrans.content,
          tags: siblingTrans.tags,
          sourceLang: siblingTrans.lang_code,
          targetLang: lang
        });

        const draft = transResult.translatedDraft;
        const matchedCatId = getMatchingCategoryId(siblingTrans.category_id, lang);
        const matchedCat = matchedCatId ? db.prepare('SELECT slug FROM categories WHERE id = ?').get(matchedCatId) : null;

        db.prepare(`
          INSERT INTO article_translations (
            article_id, lang_code, title, slug, summary, content, category_id,
            subcategory_slug, tags, featured_image, image_caption, seo_title, seo_description,
            status, is_breaking, is_featured, is_trending, views_count, author_name, published_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          siblingTrans.article_id,
          lang,
          draft.title,
          draft.slug,
          draft.summary,
          draft.content,
          matchedCatId,
          siblingTrans.subcategory_slug || '',
          draft.tags,
          siblingTrans.featured_image,
          siblingTrans.image_caption,
          draft.seoTitle,
          draft.seoDescription,
          siblingTrans.is_breaking,
          siblingTrans.is_featured,
          siblingTrans.is_trending,
          siblingTrans.views_count || 10,
          siblingTrans.author_name || 'ND30 LIVE Desk'
        );

        return res.redirect(302, `/${lang}/${matchedCat?.slug || 'assam'}/${draft.slug}`);
      } catch (err) {
        console.error('Error auto-translating on the fly in handleArticleRoute:', err.message);
      }
    }
  }

  if (!translation) {
    return next();
  }

  // Increment views count asynchronously
  db.prepare('UPDATE article_translations SET views_count = views_count + 1 WHERE id = ?').run(translation.id);

  // Find all sibling translations for the same article cluster!
  const allTranslationsForStory = db.prepare(`
    SELECT t.lang_code, t.slug, t.title, t.subcategory_slug, t.status, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.article_id = ? AND t.status = 'published'
  `).all(translation.article_id);

  // Generate alternate language URLs for the header switcher so clicking any language
  // switches directly to that story in the selected language!
  const alternateLangUrls = {};
  ['as', 'hi', 'en'].forEach(code => {
    const s = allTranslationsForStory.find(t => t.lang_code === code);
    if (s) {
      alternateLangUrls[code] = `/${code}/${s.category_slug || 'news'}/${s.slug}`;
    } else {
      alternateLangUrls[code] = `/${code}/story/${translation.article_id}`;
    }
  });

  // Find related articles in the same language and category
  const relatedArticles = db.prepare(`
    SELECT t.*, c.slug as category_slug
    FROM article_translations t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.lang_code = ? AND t.id != ? AND t.status = 'published'
    ORDER BY t.published_at DESC
    LIMIT 4
  `).all(lang, translation.id);

  // SEO tags
  const hreflangTags = generateHreflangTags(translation.article_id, lang, BASE_URL);
  const jsonLd = generateNewsArticleJsonLd(translation, BASE_URL);

  const subSlug = translation.subcategory_slug ? `/${translation.subcategory_slug}` : '';
  const canonicalUrl = `${BASE_URL}/${lang}/${translation.category_slug || 'news'}${subSlug}/${translation.slug}`;

  const breadcrumbs = [
    { name: 'Home', url: `/${lang}/` },
    { name: translation.category_name || 'News', url: `/${lang}/${translation.category_slug || 'news'}` }
  ];
  if (translation.subcategory_slug) {
    breadcrumbs.push({
      name: translation.subcategory_slug.toUpperCase(),
      url: `/${lang}/${translation.category_slug || 'news'}/${translation.subcategory_slug}`
    });
  }
  breadcrumbs.push({ name: translation.title, url: canonicalUrl.replace(BASE_URL, '') });
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs, BASE_URL);

  const pageContent = renderArticlePage({
    translation,
    allTranslationsForStory,
    relatedArticles
  });

  const fullHtml = renderLayout({
    title: translation.seo_title || `${translation.title} | ND30 LIVE`,
    description: translation.seo_description || translation.summary || translation.title,
    lang,
    content: pageContent,
    canonicalUrl,
    hreflangTags,
    jsonLd,
    breadcrumbJsonLd,
    activeCategorySlug: translation.category_slug || '',
    alternateLangUrls
  });

  res.send(fullHtml);
}

/* ==========================================================================
   INBOUND IFTTT WEBHOOK ENDPOINT
   ========================================================================== */

app.post('/api/ifttt/webhook', async (req, res) => {
  try {
    const result = await handleInboundWebhook(req.body, req.headers);
    res.status(result.status || 200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   AUTHENTICATION & PROMOTER PORTAL ROUTES
   ========================================================================== */

app.get('/login', (req, res) => {
  if (req.user) {
    if (req.user.role === 'promoter') return res.redirect('/promoter');
    return res.redirect('/admin');
  }
  const redirect = req.query.redirect || '';
  res.send(renderLoginPage(redirect));
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const result = await loginUser(identifier, password);
    console.log(`[Auth] User "${result.user.username}" (${result.user.role}) logged in successfully.`);
    res.setHeader('Set-Cookie', `nd30_session=${result.token}; Path=/; HttpOnly; Max-Age=${7 * 86400}; SameSite=Lax`);
    res.json({ success: true, ...result });
  } catch (err) {
    console.warn(`[Auth Warning] Failed sign-in attempt for identifier "${req.body?.identifier}": ${err.message}`);
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/logout', async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.nd30_session;
  if (token) {
    await logoutUser(token);
  }
  res.setHeader('Set-Cookie', 'nd30_session=; Path=/; HttpOnly; Max-Age=0');
  res.redirect('/login');
});

// Promoter Portal
app.get('/promoter', (req, res) => {
  if (!req.user) {
    return res.redirect('/login?redirect=/promoter');
  }
  if (req.user.role !== 'promoter' && req.user.role !== 'admin') {
    return res.redirect('/admin');
  }
  res.send(renderPromoterDashboard(req.user));
});

app.post('/api/promoter/book', async (req, res) => {
  try {
    const promoterId = (req.user && req.user.role === 'promoter') ? req.user.promoterId : (req.body.promoterId || null);
    const booking = await createAdvertisementBooking({
      ...req.body,
      promoterId
    });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   ADMIN MANAGEMENT ROUTES
   ========================================================================== */

app.get('/admin', checkAdminAuth, (req, res) => {
  if (req.user.role === 'editor') {
    const perms = req.user.permissions || [];
    if (!perms.includes('dashboard') && !perms.includes('*')) {
      if (perms.length > 0) {
        return res.redirect(`/admin/${perms[0]}`);
      }
    }
  }
  const content = renderAdminDashboard();
  res.send(renderAdminLayout({ title: 'Newsroom Overview', activeNav: 'dashboard', content, currentUser: req.user }));
});

app.get('/admin/editor', checkModule('editor'), (req, res) => {
  const articleId = req.query.id || null;
  const content = renderEditorPage(articleId);
  res.send(renderAdminLayout({ title: '3-Language News Publisher', activeNav: 'editor', content, currentUser: req.user }));
});

app.get('/admin/articles', checkModule('articles'), (req, res) => {
  const content = renderArticlesList();
  res.send(renderAdminLayout({ title: 'Multilingual News Library', activeNav: 'articles', content, currentUser: req.user }));
});

// Notice Panel Studio (Frontend Notice Manager with On/Off State, Text Styling & 5 Animations)
app.get('/admin/notice', checkModule('notice'), (req, res) => {
  const notice = getNotice();
  res.send(renderNoticeAdmin({
    notice,
    message: req.query.msg || '',
    error: req.query.err || '',
    currentUser: req.user
  }));
});

app.post('/admin/notice/save', checkModule('notice'), (req, res) => {
  uploadNoticeImage(req, res, (err) => {
    if (err) {
      const notice = getNotice();
      return res.status(400).send(renderNoticeAdmin({
        notice,
        error: err.message || 'Image upload error',
        currentUser: req.user
      }));
    }
    try {
      saveNotice(req.body, req.file);
      res.redirect('/admin/notice?msg=' + encodeURIComponent('Notice panel saved and published successfully!'));
    } catch (saveErr) {
      const notice = getNotice();
      res.status(500).send(renderNoticeAdmin({
        notice,
        error: saveErr.message || 'Failed to save notice',
        currentUser: req.user
      }));
    }
  });
});

app.post('/admin/notice/toggle', checkModule('notice'), (req, res) => {
  try {
    const isActive = req.body.is_active === 1 || req.body.is_active === '1' || req.body.is_active === true;
    const result = toggleNoticeStatus(req.body.id, isActive);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auto-Translate Notice Text across Assamese, Hindi, and English
app.post('/admin/notice/translate', checkModule('notice'), async (req, res) => {
  try {
    const { text, sourceLang = 'as' } = req.body;
    if (!text || !text.trim()) {
      return res.json({ success: true, translations: { as: '', hi: '', en: '' } });
    }
    const { translateFullText } = require('./services/aiTranslator');
    const cleanText = text.trim();
    const translations = {};
    for (const targetLang of ['as', 'hi', 'en']) {
      if (targetLang === sourceLang) {
        translations[targetLang] = cleanText;
      } else {
        translations[targetLang] = await translateFullText(cleanText, sourceLang, targetLang);
      }
    }
    res.json({ success: true, translations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/admin/facebook', checkModule('facebook'), (req, res) => {
  const content = renderFacebookDashboard();
  res.send(renderAdminLayout({ title: 'Facebook Import Review', activeNav: 'facebook', content, currentUser: req.user }));
});

app.get('/admin/ifttt', checkModule('ifttt'), (req, res) => {
  const content = renderIftttStudio();
  res.send(renderAdminLayout({ title: 'IFTTT Automation Studio', activeNav: 'ifttt', content, currentUser: req.user }));
});

app.get('/admin/integrations', checkModule('integrations'), (req, res) => {
  const content = renderIntegrationsHub();
  res.send(renderAdminLayout({ title: 'External Integrations Hub', activeNav: 'integrations', content, currentUser: req.user }));
});

app.get('/admin/adsense', checkModule('adsense'), (req, res) => {
  const content = renderAdSenseManager();
  res.send(renderAdminLayout({ title: 'Google AdSense Placements', activeNav: 'adsense', content, currentUser: req.user }));
});

app.get('/admin/social-qr', checkModule('social-qr'), (req, res) => {
  const content = renderSocialQrAdmin();
  res.send(renderAdminLayout({ title: 'Social QR Channels', activeNav: 'social-qr', content, currentUser: req.user }));
});

// Social QR Management Endpoints
app.post('/api/admin/social-qr', checkModule('social-qr'), async (req, res) => {
  try {
    const { platform, title, url } = req.body;
    if (!url || !platform) {
      return res.status(400).json({ success: false, error: 'Platform and URL are required.' });
    }
    const newLink = await addSocialLink({ platform, title, url });
    res.json({ success: true, link: newLink });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/social-qr/:id', checkModule('social-qr'), async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, title, url, is_active, sort_order } = req.body;
    const updated = await updateSocialLink(id, { platform, title, url, is_active, sort_order });
    res.json({ success: true, link: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/social-qr/:id', checkModule('social-qr'), (req, res) => {
  try {
    const { id } = req.params;
    deleteSocialLink(id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   ADVERTISEMENT BOOKING & COMMERCIAL HUB ROUTES
   ========================================================================== */

// Public Advertisement Booking Form Submission
app.post('/api/advertisements/book', async (req, res) => {
  try {
    const booking = await createAdvertisementBooking(req.body);
    res.json({ success: true, booking });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// WhatsApp OTP Request
app.post('/api/advertisements/send-otp', async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const result = await sendWhatsAppOtp(mobileNumber);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// WhatsApp OTP Verification
app.post('/api/advertisements/verify-otp', (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    const result = verifyWhatsAppOtp(mobileNumber, otp);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin Advertisement Hub View
app.get('/admin/advertisements', checkModule('advertisements'), (req, res) => {
  const status = req.query.status || 'all';
  const content = renderAdvertisementAdmin(status, req.query);
  res.send(renderAdminLayout({ title: 'Advertisement Bookings & Slider', activeNav: 'advertisements', content, currentUser: req.user }));
});

// Admin Booking Status Update
app.put('/api/admin/advertisements/:id/status', checkModule('advertisements'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const updated = await updateBookingStatus(id, { status, admin_notes });
    res.json({ success: true, booking: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin Settings Update (Join us ON/OFF, WhatsApp OTP ON/OFF, API Keys)
app.post('/api/admin/advertisements/settings', checkModule('advertisements'), (req, res) => {
  try {
    const settings = updateAdvertisementSettings(req.body);
    res.json({ success: true, settings });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Promotion Types CRUD
app.post('/api/admin/advertisements/promotion-types', checkModule('advertisements'), (req, res) => {
  try {
    const created = addPromotionType(req.body);
    res.json({ success: true, item: created });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/advertisements/promotion-types/:id', checkModule('advertisements'), (req, res) => {
  try {
    const { id } = req.params;
    const updated = updatePromotionType(id, req.body);
    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/advertisements/promotion-types/:id', checkModule('advertisements'), (req, res) => {
  try {
    const { id } = req.params;
    deletePromotionType(id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Influencers CRUD
app.post('/api/admin/advertisements/influencers', checkModule('advertisements'), (req, res) => {
  try {
    const created = addInfluencer(req.body);
    res.json({ success: true, item: created });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/advertisements/influencers/:id', checkModule('advertisements'), (req, res) => {
  try {
    const { id } = req.params;
    const updated = updateInfluencer(id, req.body);
    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/advertisements/influencers/:id', checkModule('advertisements'), (req, res) => {
  try {
    const { id } = req.params;
    deleteInfluencer(id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Sidebar Photo Slider (ADVERTISEMENT) Routes
app.post('/admin/advertisements/slides/add', checkModule('advertisements'), (req, res) => {
  uploadAdSlideImage(req, res, (err) => {
    if (err) {
      console.error('[Slide Upload Error]', err.message);
      return res.redirect(`/admin/advertisements?tab=slider&error=${encodeURIComponent(err.message)}`);
    }
    try {
      createSlide(req.body, req.file);
      res.redirect('/admin/advertisements?tab=slider&msg=' + encodeURIComponent('Slide uploaded and published successfully!'));
    } catch (createErr) {
      console.error('[Slide Create Error]', createErr.message);
      res.redirect(`/admin/advertisements?tab=slider&error=${encodeURIComponent(createErr.message)}`);
    }
  });
});

app.post('/admin/advertisements/slides/toggle', checkModule('advertisements'), (req, res) => {
  try {
    const { id, is_active } = req.body;
    const result = toggleSlideStatus(id, is_active);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/admin/advertisements/slides/delete/:id', checkModule('advertisements'), (req, res) => {
  try {
    deleteSlide(req.params.id);
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({ success: true });
    }
    res.redirect('/admin/advertisements?tab=slider&msg=' + encodeURIComponent('Slide deleted successfully!'));
  } catch (err) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(400).json({ success: false, error: err.message });
    }
    res.redirect(`/admin/advertisements?tab=slider&error=${encodeURIComponent(err.message)}`);
  }
});

app.get('/admin/reporters', checkModule('reporters'), (req, res) => {
  const content = renderReporterApplicationsAdmin();
  res.send(renderAdminLayout({ title: 'Reporter Applications & Recruitment', activeNav: 'reporters', content, currentUser: req.user }));
});

// Public QR Code Verification Endpoint for Press ID Cards
app.get('/verify-press-id/:pressIdCode', (req, res) => {
  const { pressIdCode } = req.params;
  const application = getReporterByPressId(pressIdCode);
  res.send(renderVerifyPressIdPage(application, pressIdCode));
});

// Reporter Application Status Update (Approve or Reject with Auto-Email & Press ID Card)
app.post('/api/admin/reporters/status', checkModule('reporters'), async (req, res) => {
  try {
    const { appId, status, reason } = req.body;
    if (!appId || !status) {
      return res.status(400).json({ success: false, error: 'Application ID and status are required.' });
    }

    if (status === 'approved') {
      const result = await approveReporterApplication(appId);
      return res.json({
        success: true,
        appId,
        status: 'approved',
        pressIdCode: result.pressIdCode,
        emailSent: result.emailSent,
        verifyUrl: result.verifyUrl,
        message: `Application approved! Press ID ${result.pressIdCode} generated and email with Press Card sent to applicant.`
      });
    } else if (status === 'rejected') {
      const result = await rejectReporterApplication(appId, reason);
      return res.json({
        success: true,
        appId,
        status: 'rejected',
        emailSent: result.emailSent,
        message: 'Application rejected and notification email sent to applicant.'
      });
    } else {
      db.prepare('UPDATE reporter_applications SET status = ? WHERE id = ?').run(status, appId);
      return res.json({ success: true, appId, status });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all Reporting Areas & Occupied status (Public & Frontend)
app.get('/api/reporting-areas', (req, res) => {
  try {
    const areas = db.prepare('SELECT id, name FROM reporting_areas WHERE is_active = 1 ORDER BY name COLLATE NOCASE ASC').all();
    const occupiedRows = db.prepare(`
      SELECT DISTINCT area, COALESCE(join_as, designation, 'Reporter') as role 
      FROM reporter_applications 
      WHERE status = 'approved' AND area IS NOT NULL AND area != ''
    `).all();

    const areaOccupiedRolesMap = {};
    occupiedRows.forEach(r => {
      const key = r.area.trim().toLowerCase();
      if (!areaOccupiedRolesMap[key]) {
        areaOccupiedRolesMap[key] = [];
      }
      if (!areaOccupiedRolesMap[key].includes(r.role)) {
        areaOccupiedRolesMap[key].push(r.role);
      }
    });

    res.json({
      success: true,
      areas: areas.map(a => a.name),
      areaDetails: areas,
      occupiedRolesMap: areaOccupiedRolesMap,
      occupiedAreas: occupiedRows.map(r => r.area)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Add New Reporting Area
app.post('/api/admin/reporting-areas', checkModule('reporters'), (req, res) => {
  try {
    const rawName = (req.body.name || '').trim();
    if (!rawName) {
      return res.status(400).json({ success: false, error: 'Area name is required.' });
    }

    // Capitalize each word nicely
    const cleanName = rawName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

    const existing = db.prepare('SELECT * FROM reporting_areas WHERE LOWER(name) = LOWER(?)').get(cleanName);
    if (existing) {
      if (!existing.is_active) {
        db.prepare('UPDATE reporting_areas SET is_active = 1 WHERE id = ?').run(existing.id);
        return res.json({ success: true, message: `Reporting area "${cleanName}" reactivated.`, area: cleanName });
      }
      return res.status(400).json({ success: false, error: `Reporting area "${cleanName}" already exists.` });
    }

    const stmt = db.prepare('INSERT INTO reporting_areas (name) VALUES (?)');
    const info = stmt.run(cleanName);

    console.log(`[Admin Area] Added new reporting area: "${cleanName}" (ID: ${info.lastInsertRowid})`);
    res.json({
      success: true,
      message: `Reporting area "${cleanName}" added successfully! It is now available in the public Join Us form.`,
      area: cleanName,
      id: info.lastInsertRowid
    });
  } catch (err) {
    console.error('[Admin Add Area Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Delete / Deactivate Reporting Area
app.delete('/api/admin/reporting-areas/:id', checkModule('reporters'), (req, res) => {
  try {
    const areaId = req.params.id;
    db.prepare('DELETE FROM reporting_areas WHERE id = ?').run(areaId);
    res.json({ success: true, message: 'Reporting area removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   ROLES, PERMISSIONS & PROMOTER MANAGEMENT (SUPER ADMIN ONLY)
   ========================================================================== */

app.get('/admin/roles', requireRoleAdmin, (req, res) => {
  const tab = req.query.tab || 'users';
  const content = renderRolesAdmin(tab);
  res.send(renderAdminLayout({ title: 'Roles & Permissions', activeNav: 'roles', content, currentUser: req.user }));
});

// Create Editor or Promoter
app.post('/api/admin/roles/user', requireRoleAdmin, async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update User details / permissions / commission structure
app.put('/api/admin/roles/user/:id', requireRoleAdmin, async (req, res) => {
  try {
    const updated = await updateUser(req.params.id, req.body);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin Change Password for Editor or Promoter
app.put('/api/admin/roles/user/:id/password', requireRoleAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }
    const result = await changeUserPassword(req.params.id, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete User
app.delete('/api/admin/roles/user/:id', requireRoleAdmin, async (req, res) => {
  try {
    const result = await deleteUser(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Mark Promoter Commission Payout as Paid
app.post('/api/admin/roles/payout/:bookingId', requireRoleAdmin, async (req, res) => {
  try {
    const { paymentRef } = req.body;
    const result = await markCommissionPaid(req.params.bookingId, paymentRef);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Join us Public Application Endpoint (Multer 1 MB limit, DB save, Email to nd30team@gmail.com)
app.post('/api/reporter/apply', (req, res) => {
  uploadReporterDocs(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeded: All uploaded documents must be strictly below 1 MB each. Please compress or choose a smaller file and try again.'
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'Error processing uploaded documents.'
      });
    }

    try {
      const {
        name,
        fatherName,
        mobileNo,
        email,
        villageTown,
        postOffice,
        policeStation,
        district,
        state,
        pinCode,
        education,
        experience,
        previousChannel,
        joinAs,
        area
      } = req.body;

      // Validate required fields
      const validRoles = ['Reporter', 'Camera Person', 'Photographer', 'Editor', 'Voice-Over'];
      const appointedRole = validRoles.includes(joinAs) ? joinAs : (joinAs || 'Reporter');

      if (!joinAs || !joinAs.trim()) {
        return res.status(400).json({ success: false, error: 'Please choose which role you want to "Join as" (Reporter, Camera Person, Photographer, Editor, or Voice-Over).' });
      }
      if (!area || !area.trim()) {
        return res.status(400).json({ success: false, error: 'Reporting Area is required. Please select an area from the dropdown.' });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Full Name is required.' });
      }
      if (!fatherName || !fatherName.trim()) {
        return res.status(400).json({ success: false, error: "Father's Name is required." });
      }
      if (!mobileNo || !mobileNo.trim()) {
        return res.status(400).json({ success: false, error: 'Mobile Number is required.' });
      }
      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, error: 'Email Address is required.' });
      }
      if (!education) {
        return res.status(400).json({ success: false, error: 'Educational Qualification is required.' });
      }
      if (!req.body.terms_agreement) {
        return res.status(400).json({ success: false, error: 'You must read and tick the Terms & Conditions Declaration to submit your application.' });
      }

      // Check required documents
      const files = req.files || {};
      if (!files.adhar || !files.adhar[0]) {
        return res.status(400).json({ success: false, error: 'Aadhar Card document is required.' });
      }
      if (!files.education_certificate || !files.education_certificate[0]) {
        return res.status(400).json({ success: false, error: 'Education Certificate document is required.' });
      }
      if (!files.photo || !files.photo[0]) {
        return res.status(400).json({ success: false, error: 'Passport Size Photo is required.' });
      }
      if (!files.biodata || !files.biodata[0]) {
        return res.status(400).json({ success: false, error: 'Biodata / Resume document is required.' });
      }

      // Save application into database
      const application = saveReporterApplication(req.body, files);

      // Forward application details & attached files to official email: nd30team@gmail.com
      const emailResult = await sendApplicationEmail(application, files);

      res.json({
        success: true,
        applicationId: application.id,
        role: appointedRole,
        area: area.trim(),
        emailSent: emailResult.sent,
        message: 'Your application has been received and forwarded to our official desk at nd30team@gmail.com!'
      });
    } catch (saveErr) {
      console.error('[Reporter Application Error]', saveErr);
      res.status(500).json({
        success: false,
        error: 'Failed to process application: ' + saveErr.message
      });
    }
  });
});

/* ==========================================================================
   ADMIN API ENDPOINTS
   ========================================================================== */

// AI Translation Assistant Endpoint
app.post('/api/admin/translate', checkModule('editor'), async (req, res) => {
  try {
    const { title, summary, content, tags, sourceLang, targetLang } = req.body;
    const translationResult = await generateArticleTranslation({
      title,
      summary,
      content,
      tags,
      sourceLang,
      targetLang
    });

    res.json({
      success: true,
      translation: translationResult
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: Get matching category across languages by slug
function getMatchingCategoryId(sourceCatId, targetLang) {
  if (!sourceCatId) return null;
  const srcCat = db.prepare('SELECT slug FROM categories WHERE id = ?').get(sourceCatId);
  if (!srcCat) return null;
  const tgtCat = db.prepare('SELECT id FROM categories WHERE lang_code = ? AND slug = ?').get(targetLang, srcCat.slug);
  return tgtCat ? tgtCat.id : null;
}

// Translate one language content to all other languages
app.post('/api/admin/translate-all', checkModule('editor'), async (req, res) => {
  try {
    const { sourceLang, title, summary, content, tags, categoryId, featuredImage, imageCaption, isBreaking, isFeatured, isTrending } = req.body;
    if (!title && !content) {
      return res.status(400).json({ success: false, error: 'News headline or story content is required to translate.' });
    }

    const allLangs = ['as', 'hi', 'en'];
    const otherLangs = allLangs.filter(l => l !== (sourceLang || 'as'));
    const translations = {};

    for (const targetLang of otherLangs) {
      const trans = await generateArticleTranslation({
        title: title || '',
        summary: summary || '',
        content: content || '',
        tags: tags || '',
        sourceLang: sourceLang || 'as',
        targetLang
      });

      const matchedCatId = getMatchingCategoryId(categoryId, targetLang);

      translations[targetLang] = {
        title: trans.translatedDraft.title,
        slug: trans.translatedDraft.slug,
        summary: trans.translatedDraft.summary,
        content: trans.translatedDraft.content,
        tags: trans.translatedDraft.tags,
        categoryId: matchedCatId,
        seoTitle: trans.translatedDraft.seoTitle,
        seoDescription: trans.translatedDraft.seoDescription,
        featuredImage: featuredImage || '/uploads/brahmaputra_bridge.jpg',
        imageCaption: imageCaption || '',
        isBreaking: isBreaking || 0,
        isFeatured: isFeatured || 0,
        isTrending: isTrending || 0
      };
    }

    res.json({ success: true, translations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save Multilingual Article Cluster (Drafting, Publishing, IFTTT Trigger)
app.post('/api/admin/articles/save', checkModule('editor'), async (req, res) => {
  try {
    const { articleId, action, translations } = req.body;

    let clusterId = articleId;
    if (!clusterId) {
      clusterId = `nd30-art-${uuidv4().slice(0, 8)}`;
      db.prepare('INSERT INTO articles (id, origin_source) VALUES (?, ?)').run(clusterId, 'manual');
    }

    let iftttDispatched = false;

    // 1. Identify non-empty languages provided by the editor
    const allLangs = ['as', 'hi', 'en'];
    const providedLangs = allLangs.filter(lang => {
      const t = translations && translations[lang];
      return t && (t.title?.trim() || t.content?.trim());
    });

    if (providedLangs.length === 0) {
      return res.status(400).json({ success: false, error: 'Please enter news content in at least one language tab.' });
    }

    // 2. AUTOMATIC ALL-LANGUAGE PUBLISHING:
    // If publishing in all languages (action === 'publish_all'), automatically auto-translate
    // and populate any missing language editions so the story is published in all 3 languages!
    if (action === 'publish_all') {
      const primaryLang = providedLangs[0];
      const primaryData = translations[primaryLang];

      for (const targetLang of allLangs) {
        if (!translations[targetLang] || (!translations[targetLang].title?.trim() && !translations[targetLang].content?.trim())) {
          const transResult = await generateArticleTranslation({
            title: primaryData.title || '',
            summary: primaryData.summary || '',
            content: primaryData.content || '',
            tags: primaryData.tags || '',
            sourceLang: primaryLang,
            targetLang
          });

          const draft = transResult.translatedDraft;
          const matchedCatId = getMatchingCategoryId(primaryData.categoryId, targetLang);

          translations[targetLang] = {
            title: draft.title,
            slug: draft.slug,
            summary: draft.summary,
            content: draft.content,
            categoryId: matchedCatId,
            tags: draft.tags,
            featuredImage: primaryData.featuredImage || '/uploads/brahmaputra_bridge.jpg',
            imageCaption: primaryData.imageCaption || '',
            seoTitle: draft.seoTitle,
            seoDescription: draft.seoDescription,
            isBreaking: primaryData.isBreaking || 0,
            isFeatured: primaryData.isFeatured || 0,
            isTrending: primaryData.isTrending || 0
          };
        }
      }
    }

    const savedLanguages = [];

    // 3. Process each language translation tab submitted or auto-generated
    for (const [langCode, data] of Object.entries(translations)) {
      if (!data.title && !data.content) continue;

      // Determine publication status based on action
      let targetStatus = 'draft';
      if (action === 'publish_all') {
        targetStatus = 'published';
      } else if (action === `publish_single_${langCode}`) {
        targetStatus = 'published';
      } else if (action === 'save_all_drafts') {
        targetStatus = 'draft';
      }

      // Generate or clean slug
      let cleanSlug = data.slug;
      if (!cleanSlug || cleanSlug.trim() === '') {
        cleanSlug = data.title.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80);
        if (!cleanSlug || cleanSlug.replace(/-/g, '').length === 0) {
          cleanSlug = `story-${langCode}-${Date.now().toString().slice(-6)}`;
        }
      }

      // Check if translation already exists for this cluster
      const existing = db.prepare('SELECT id, status FROM article_translations WHERE article_id = ? AND lang_code = ?').get(clusterId, langCode);

      const pubTime = targetStatus === 'published' ? new Date().toISOString() : null;

      if (existing) {
        db.prepare(`
          UPDATE article_translations
          SET title = ?, slug = ?, summary = ?, content = ?, category_id = ?,
              tags = ?, featured_image = ?, image_caption = ?, seo_title = ?, seo_description = ?,
              status = ?, is_breaking = ?, is_featured = ?, is_trending = ?,
              published_at = COALESCE(published_at, ?), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          data.title,
          cleanSlug,
          data.summary || '',
          data.content,
          data.categoryId || null,
          data.tags || '',
          data.featuredImage || '/uploads/brahmaputra_bridge.jpg',
          data.imageCaption || '',
          data.seoTitle || `${data.title} | ND30 LIVE`,
          data.seoDescription || (data.summary ? data.summary.slice(0, 160) : ''),
          targetStatus,
          data.isBreaking || 0,
          data.isFeatured || 0,
          data.isTrending || 0,
          pubTime,
          existing.id
        );
      } else {
        db.prepare(`
          INSERT INTO article_translations (
            article_id, lang_code, title, slug, summary, content, category_id,
            tags, featured_image, image_caption, seo_title, seo_description,
            status, is_breaking, is_featured, is_trending, published_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          clusterId,
          langCode,
          data.title,
          cleanSlug,
          data.summary || '',
          data.content,
          data.categoryId || null,
          data.tags || '',
          data.featuredImage || '/uploads/brahmaputra_bridge.jpg',
          data.imageCaption || '',
          data.seoTitle || `${data.title} | ND30 LIVE`,
          data.seoDescription || (data.summary ? data.summary.slice(0, 160) : ''),
          targetStatus,
          data.isBreaking || 0,
          data.isFeatured || 0,
          data.isTrending || 0,
          pubTime
        );
      }

      savedLanguages.push(langCode);

      // If published, trigger outbound IFTTT automation event for this language!
      if (targetStatus === 'published') {
        const catInfo = data.categoryId ? db.prepare('SELECT name, slug FROM categories WHERE id = ?').get(data.categoryId) : null;
        triggerArticlePublicationEvent({
          article_id: clusterId,
          lang_code: langCode,
          title: data.title,
          slug: cleanSlug,
          summary: data.summary,
          category_name: catInfo?.name || 'News',
          category_slug: catInfo?.slug || 'news',
          featured_image: data.featuredImage || '/uploads/brahmaputra_bridge.jpg',
          published_at: pubTime || new Date().toISOString()
        }, BASE_URL);
        iftttDispatched = true;
      }
    }

    res.json({
      success: true,
      clusterId,
      iftttTriggered: iftttDispatched
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle Article Publication Status (Hide / Unhide / Publish)
app.post('/api/admin/articles/toggle-status', checkModule('articles'), (req, res) => {
  try {
    const { articleId, langCode, action } = req.body;
    if (!articleId) {
      return res.status(400).json({ success: false, error: 'Article ID is required.' });
    }

    const cluster = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);
    if (!cluster) {
      return res.status(404).json({ success: false, error: 'Article cluster not found.' });
    }

    const translations = db.prepare('SELECT id, lang_code, status FROM article_translations WHERE article_id = ?').all(articleId);
    if (translations.length === 0) {
      return res.status(404).json({ success: false, error: 'No translations found for this article.' });
    }

    const anyPublished = translations.some(t => t.status === 'published');
    let targetStatus;

    if (action === 'hide') {
      targetStatus = 'hidden';
    } else if (action === 'unhide' || action === 'publish') {
      targetStatus = 'published';
    } else {
      // Toggle: if currently published, hide it. Otherwise publish it.
      targetStatus = anyPublished ? 'hidden' : 'published';
    }

    const pubTime = new Date().toISOString();

    if (langCode && langCode !== 'all') {
      db.prepare(`
        UPDATE article_translations
        SET status = ?,
            published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN ? ELSE published_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE article_id = ? AND lang_code = ?
      `).run(targetStatus, targetStatus, pubTime, articleId, langCode);
    } else {
      db.prepare(`
        UPDATE article_translations
        SET status = ?,
            published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN ? ELSE published_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE article_id = ?
      `).run(targetStatus, targetStatus, pubTime, articleId);
    }

    res.json({
      success: true,
      articleId,
      newStatus: targetStatus,
      message: targetStatus === 'hidden'
        ? 'Article has been hidden from public portals.'
        : 'Article is now published and visible on public portals.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Article Cluster & all language translations
app.post('/api/admin/articles/delete', checkModule('articles'), (req, res) => {
  try {
    const { articleId } = req.body;
    if (!articleId) {
      return res.status(400).json({ success: false, error: 'Article ID is required.' });
    }

    const cluster = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);
    if (!cluster) {
      return res.status(404).json({ success: false, error: 'Article cluster not found.' });
    }

    // Unlink any imported facebook post pointing to this article
    db.prepare("UPDATE facebook_imported_posts SET imported_article_id = NULL, status = 'pending_review' WHERE imported_article_id = ?").run(articleId);

    // Delete translations and article cluster
    db.prepare('DELETE FROM article_translations WHERE article_id = ?').run(articleId);
    db.prepare('DELETE FROM articles WHERE id = ?').run(articleId);

    res.json({
      success: true,
      articleId,
      message: 'Article and all translations permanently deleted.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test IFTTT Webhook Dispatcher
app.post('/api/admin/ifttt/test', checkModule('ifttt'), async (req, res) => {
  try {
    const { lang } = req.body;
    const testLang = lang || 'en';

    // Sample payload matching prompt requirement
    const testArticle = {
      article_id: `test-art-${Date.now()}`,
      lang_code: testLang,
      title: testLang === 'as' 
        ? 'এনডি৩০ পৰীক্ষামূলক বাৰ্তা: ব্ৰহ্মপুত্ৰ উপত্যকাত নতুন স্বয়ংক্ৰিয় ডিজিটেল সম্প্ৰচাৰ ব্যৱস্থা সক্ৰিয়' 
        : (testLang === 'hi' 
          ? 'एनडी30 टेस्ट संदेश: पूर्वोत्तर समाचार स्वचालन प्रणाली का सफल परीक्षण' 
          : 'ND30 Automation Test: Multilingual Webhook syndication dispatched successfully'),
      slug: `nd30-automation-test-${Date.now()}`,
      summary: 'Verified end-to-end IFTTT webhook payload delivery with structured metadata and loop prevention.',
      category_name: 'Technology',
      category_slug: 'tech',
      featured_image: '/uploads/nd30_news_banner.jpg',
      published_at: new Date().toISOString()
    };

    const result = await triggerArticlePublicationEvent(testArticle, BASE_URL);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Retry Failed IFTTT Event
app.post('/api/admin/ifttt/retry/:eventId', checkModule('ifttt'), async (req, res) => {
  try {
    const result = await retryFailedEvent(req.params.eventId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Regenerate IFTTT Webhook Secret Key
app.post('/api/admin/ifttt/regen-secret', checkModule('ifttt'), (req, res) => {
  try {
    const newSecret = 'nd30_sec_' + uuidv4().replace(/-/g, '').slice(0, 24);
    db.prepare('UPDATE ifttt_connections SET webhook_secret = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(newSecret);
    res.json({ success: true, newSecret });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Connect Facebook Page or Profile via link
app.post('/api/admin/facebook/connect', checkModule('facebook'), (req, res) => {
  try {
    let { pageUrl, pageName, pageType, defaultLang, autoImportMode, accessToken } = req.body;
    if (!pageUrl || !pageUrl.trim()) {
      return res.status(400).json({ success: false, error: 'Facebook Page or Profile link is required.' });
    }

    pageUrl = pageUrl.trim();
    let identifier = '';
    try {
      const parsedUrl = new URL(pageUrl.startsWith('http') ? pageUrl : `https://${pageUrl}`);
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        if (pathParts[0] === 'profile.php') {
          identifier = parsedUrl.searchParams.get('id') || 'profile_' + Date.now();
        } else {
          identifier = pathParts[0];
        }
      }
    } catch (e) {
      const match = pageUrl.match(/facebook\.com\/([a-zA-Z0-9._-]+)/i);
      identifier = match ? match[1] : 'fb_' + Date.now();
    }

    if (!identifier) {
      identifier = 'fb_' + Date.now();
    }

    if (!pageName || !pageName.trim()) {
      if (identifier.toLowerCase() === 'nd30live') {
        pageName = 'ND30 LIVE';
      } else {
        pageName = identifier.replace(/[-_.]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    pageType = (pageType === 'profile') ? 'profile' : 'page';
    defaultLang = ['as', 'hi', 'en'].includes(defaultLang) ? defaultLang : 'as';
    autoImportMode = ['review', 'draft'].includes(autoImportMode) ? autoImportMode : 'review';
    accessToken = accessToken ? accessToken.trim() : `TOKEN_${identifier.toUpperCase()}`;

    // Check if page already exists by page_id or page_url
    const existing = db.prepare('SELECT * FROM facebook_pages WHERE page_id = ? OR page_url = ?').get(identifier, pageUrl);

    if (existing) {
      db.prepare(`
        UPDATE facebook_pages
        SET page_name = ?, page_url = ?, page_type = ?, default_lang_code = ?, auto_import_mode = ?, access_token = ?, is_active = 1
        WHERE id = ?
      `).run(pageName, pageUrl, pageType, defaultLang, autoImportMode, accessToken, existing.id);

      const updated = db.prepare('SELECT * FROM facebook_pages WHERE id = ?').get(existing.id);
      return res.json({ success: true, message: 'Facebook connection updated successfully', page: updated });
    } else {
      const info = db.prepare(`
        INSERT INTO facebook_pages (page_id, page_name, page_url, page_type, access_token, default_lang_code, auto_import_mode, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(identifier, pageName, pageUrl, pageType, accessToken, defaultLang, autoImportMode);

      const created = db.prepare('SELECT * FROM facebook_pages WHERE id = ?').get(info.lastInsertRowid);
      return res.json({ success: true, message: 'Facebook page/profile connected successfully', page: created });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Disconnect Facebook Page or Profile
app.post('/api/admin/facebook/disconnect', checkModule('facebook'), (req, res) => {
  try {
    const { id, pageId } = req.body;
    const target = db.prepare('SELECT * FROM facebook_pages WHERE id = ? OR page_id = ?').get(id || null, pageId || null);

    if (!target) {
      return res.status(404).json({ success: false, error: 'Facebook connection not found.' });
    }

    db.prepare('DELETE FROM facebook_pages WHERE id = ?').run(target.id);
    return res.json({ success: true, message: `Successfully disconnected "${target.page_name}".` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sync Facebook Page Posts via Meta Graph API
app.post('/api/admin/facebook/sync', checkModule('facebook'), async (req, res) => {
  try {
    const { pageId } = req.body || {};
    let page;
    if (pageId) {
      page = db.prepare('SELECT id FROM facebook_pages WHERE id = ? AND is_active = 1').get(pageId);
    }
    if (!page) {
      page = db.prepare('SELECT id FROM facebook_pages WHERE is_active = 1 ORDER BY id DESC LIMIT 1').get();
    }
    if (!page) {
      return res.status(400).json({ success: false, error: 'No active Facebook page or profile configured. Please connect one first.' });
    }
    const result = await syncFacebookPage(page.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Approve Facebook Post from Review Queue
app.post('/api/admin/facebook/approve', checkModule('facebook'), async (req, res) => {
  try {
    const { postId, targetLang, headline, content } = req.body;
    const result = await approveFacebookImport(postId, targetLang, headline, content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle Hide / Restore Facebook Imported Post
app.post('/api/admin/facebook/posts/toggle-hide', checkModule('facebook'), (req, res) => {
  try {
    const { postId, action } = req.body;
    if (!postId) {
      return res.status(400).json({ success: false, error: 'Post ID is required.' });
    }

    const post = db.prepare('SELECT * FROM facebook_imported_posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Imported post not found.' });
    }

    let targetStatus;
    if (action === 'hide') {
      targetStatus = 'hidden';
    } else if (action === 'unhide') {
      targetStatus = post.imported_article_id ? 'imported_draft' : 'pending_review';
    } else {
      targetStatus = post.status === 'hidden' ? (post.imported_article_id ? 'imported_draft' : 'pending_review') : 'hidden';
    }

    db.prepare('UPDATE facebook_imported_posts SET status = ? WHERE id = ?').run(targetStatus, postId);

    res.json({
      success: true,
      postId,
      newStatus: targetStatus,
      message: targetStatus === 'hidden'
        ? 'Imported post hidden from review queue.'
        : 'Imported post restored successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Facebook Imported Post
app.post('/api/admin/facebook/posts/delete', checkModule('facebook'), (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ success: false, error: 'Post ID is required.' });
    }

    const post = db.prepare('SELECT * FROM facebook_imported_posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Imported post not found.' });
    }

    db.prepare('DELETE FROM facebook_imported_posts WHERE id = ?').run(postId);

    res.json({
      success: true,
      postId,
      message: 'Imported post deleted.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save Google AdSense Unit
app.post('/api/admin/adsense/save', checkModule('adsense'), (req, res) => {
  try {
    const { slotKey, adClient, adSlotId, isActive } = req.body;
    db.prepare(`
      UPDATE adsense_slots
      SET ad_client = ?, ad_slot_id = ?, is_active = ?
      WHERE slot_key = ?
    `).run(adClient, adSlotId, parseInt(isActive) || 0, slotKey);
    res.redirect('/admin/adsense');
  } catch (err) {
    res.status(500).send('Error updating AdSense unit: ' + err.message);
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).send(renderLayout({
    title: '404 - Page Not Found | ND30 LIVE',
    description: 'The requested page could not be located.',
    lang: 'en',
    content: `
      <div class="container" style="padding:60px 20px; text-align:center;">
        <h1 style="font-size:3rem; font-weight:900; color:var(--primary-red); margin-bottom:12px;">404</h1>
        <h2 style="font-size:1.5rem; font-weight:700; margin-bottom:16px;">Page Not Found / পৃষ্ঠা পোৱা নগল</h2>
        <p style="color:var(--text-muted); margin-bottom:24px;">The article or page you requested does not exist or has been relocated.</p>
        <div style="display:flex; justify-content:center; gap:12px;">
          <a href="/as/" class="btn btn-primary">অসমীয়া মুখ্য পৃষ্ঠা</a>
          <a href="/hi/" class="btn btn-secondary">हिंदी मुख्य पृष्ठ</a>
          <a href="/en/" class="btn btn-secondary">English Home</a>
        </div>
      </div>
    `
  }));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 ND30 LIVE Multilingual Portal & IFTTT Server Live`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🌐 Assamese Edition: http://localhost:${PORT}/as/`);
  console.log(`🌐 Hindi Edition:    http://localhost:${PORT}/hi/`);
  console.log(`🌐 English Edition:  http://localhost:${PORT}/en/`);
  console.log(`⚙️ Admin Dashboard:  http://localhost:${PORT}/admin`);
  console.log(`⚡ IFTTT Studio:     http://localhost:${PORT}/admin/ifttt`);
  console.log(`🔗 Integrations Hub: http://localhost:${PORT}/admin/integrations`);
  console.log(`====================================================`);
});

module.exports = app;
