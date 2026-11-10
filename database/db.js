const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'nd30_news.db');

/**
 * Universal Dual-Engine SQLite Connection
 * 1. Attempts better-sqlite3 native driver.
 * 2. If native bindings fail (e.g. Hostinger / CloudLinux GLIBC_2.29 mismatch),
 *    automatically falls back to Node.js built-in node:sqlite (zero GLIBC dependencies!).
 */
function createDatabaseConnection() {
  // Strategy 1: Try better-sqlite3 native driver
  try {
    const Database = require('better-sqlite3');
    const bDb = new Database(dbPath);
    try { bDb.pragma('journal_mode = WAL'); } catch (e) { try { bDb.pragma('journal_mode = DELETE'); } catch (e2) {} }
    try { bDb.pragma('foreign_keys = ON'); } catch (e) {}
    console.log('✅ SQLite Database connected via better-sqlite3 native driver');
    return bDb;
  } catch (nativeErr) {
    console.warn(`⚠️ [Database] better-sqlite3 native addon failed (${nativeErr.message}).`);
    console.warn('🔄 Switching to Node.js built-in node:sqlite engine (immune to GLIBC mismatches)...');

    // Strategy 2: Node.js 22+ built-in node:sqlite engine (DatabaseSync)
    try {
      const { DatabaseSync } = require('node:sqlite');
      const syncDb = new DatabaseSync(dbPath);
      try { syncDb.exec('PRAGMA journal_mode = WAL'); } catch (e) { try { syncDb.exec('PRAGMA journal_mode = DELETE'); } catch (e2) {} }
      try { syncDb.exec('PRAGMA foreign_keys = ON'); } catch (e) {}

      function sanitizeParams(params) {
        if (!params || params.length === 0) return [];
        if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null) {
          if (Array.isArray(params[0])) {
            return params[0].map(v => (v === undefined ? null : v));
          }
          const cleanObj = {};
          for (const [k, v] of Object.entries(params[0])) {
            cleanObj[k] = v === undefined ? null : v;
          }
          return [cleanObj];
        }
        return params.map(v => (v === undefined ? null : v));
      }

      console.log('✅ SQLite Database successfully connected via Node.js built-in node:sqlite engine!');

      return {
        pragma(str) {
          try {
            return syncDb.exec('PRAGMA ' + str);
          } catch (e) {
            return null;
          }
        },
        exec(sql) {
          return syncDb.exec(sql);
        },
        prepare(sql) {
          const stmt = syncDb.prepare(sql);
          return {
            all(...params) {
              const clean = sanitizeParams(params);
              return stmt.all(...clean);
            },
            get(...params) {
              const clean = sanitizeParams(params);
              return stmt.get(...clean);
            },
            run(...params) {
              const clean = sanitizeParams(params);
              const result = stmt.run(...clean);
              return {
                changes: Number(result.changes || 0),
                lastInsertRowid: Number(result.lastInsertRowid || 0)
              };
            }
          };
        }
      };
    } catch (syncErr) {
      console.error('❌ [Database Fatal] Both better-sqlite3 and node:sqlite failed:', syncErr.message);
      throw nativeErr;
    }
  }
}

const db = createDatabaseConnection();

function initDatabase() {
  db.exec(`
    -- Languages Table
    CREATE TABLE IF NOT EXISTS languages (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      native_name TEXT NOT NULL,
      direction TEXT DEFAULT 'ltr',
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    );

    -- Categories Table (Language specific)
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lang_code TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (lang_code) REFERENCES languages(code) ON DELETE CASCADE,
      UNIQUE(lang_code, slug)
    );

    -- Articles Master Cluster (Links translations)
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      origin_source TEXT DEFAULT 'manual',
      origin_source_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Article Translations (Language specific content)
    CREATE TABLE IF NOT EXISTS article_translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id TEXT NOT NULL,
      lang_code TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      summary TEXT,
      content TEXT NOT NULL,
      category_id INTEGER,
      subcategory_slug TEXT DEFAULT '',
      tags TEXT,
      featured_image TEXT,
      image_caption TEXT,
      seo_title TEXT,
      seo_description TEXT,
      status TEXT DEFAULT 'draft',
      is_breaking INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      is_trending INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      author_name TEXT DEFAULT 'ND30 Desk',
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (lang_code) REFERENCES languages(code) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      UNIQUE(lang_code, slug),
      UNIQUE(article_id, lang_code)
    );

    -- Facebook Connected Pages
    CREATE TABLE IF NOT EXISTS facebook_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id TEXT UNIQUE NOT NULL,
      page_name TEXT NOT NULL,
      page_url TEXT,
      page_type TEXT DEFAULT 'page',
      access_token TEXT,
      default_lang_code TEXT DEFAULT 'as',
      auto_import_mode TEXT DEFAULT 'review',
      is_active INTEGER DEFAULT 1,
      last_sync_at DATETIME,
      FOREIGN KEY (default_lang_code) REFERENCES languages(code)
    );

    -- Facebook Imported Posts
    CREATE TABLE IF NOT EXISTS facebook_imported_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fb_post_id TEXT UNIQUE NOT NULL,
      page_id TEXT,
      message TEXT,
      image_url TEXT,
      created_time TEXT,
      detected_lang TEXT,
      confidence REAL,
      suggested_lang TEXT,
      assigned_lang TEXT,
      status TEXT DEFAULT 'pending_review',
      imported_article_id TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- IFTTT Connections & Credentials
    CREATE TABLE IF NOT EXISTS ifttt_connections (
      id INTEGER PRIMARY KEY,
      enabled INTEGER DEFAULT 1,
      webhook_secret TEXT NOT NULL,
      maker_key TEXT DEFAULT '',
      test_status TEXT DEFAULT 'ready',
      last_test_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- IFTTT Automation Rules
    CREATE TABLE IF NOT EXISTS ifttt_automation_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_name TEXT NOT NULL,
      event_name TEXT NOT NULL,
      lang_code TEXT NOT NULL,
      target_service TEXT DEFAULT 'ifttt_maker',
      webhook_url TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- IFTTT & Webhook Event Logs (Idempotency & Retry system)
    CREATE TABLE IF NOT EXISTS ifttt_event_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT UNIQUE NOT NULL,
      idempotency_key TEXT,
      direction TEXT NOT NULL,
      event_name TEXT NOT NULL,
      lang_code TEXT,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      http_status INTEGER,
      response_body TEXT,
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Google AdSense Placements
    CREATE TABLE IF NOT EXISTS adsense_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_key TEXT UNIQUE NOT NULL,
      slot_name TEXT NOT NULL,
      ad_client TEXT DEFAULT 'ca-pub-9876543210123456',
      ad_slot_id TEXT DEFAULT '1234567890',
      ad_format TEXT DEFAULT 'auto',
      is_active INTEGER DEFAULT 1,
      custom_html TEXT
    );

    -- Google Analytics Settings
    CREATE TABLE IF NOT EXISTS analytics_settings (
      id INTEGER PRIMARY KEY,
      ga_measurement_id TEXT DEFAULT 'G-ND30NEWS01',
      is_active INTEGER DEFAULT 1,
      track_pageviews INTEGER DEFAULT 1,
      track_language_switches INTEGER DEFAULT 1,
      track_ifttt_events INTEGER DEFAULT 1
    );

    -- Breaking News Ticker (Language specific)
    CREATE TABLE IF NOT EXISTS breaking_news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lang_code TEXT NOT NULL,
      title TEXT NOT NULL,
      link TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lang_code) REFERENCES languages(code) ON DELETE CASCADE
    );

    -- Reporter Applications (Join as a Reporter)
    CREATE TABLE IF NOT EXISTS reporter_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      father_name TEXT NOT NULL,
      mobile_no TEXT NOT NULL,
      email TEXT NOT NULL,
      village_town TEXT,
      post_office TEXT,
      police_station TEXT,
      district TEXT,
      state TEXT,
      pin_code TEXT,
      education TEXT NOT NULL,
      experience TEXT,
      previous_channel TEXT,
      adhar_file TEXT,
      pan_file TEXT,
      education_certificate_file TEXT,
      photo_file TEXT,
      biodata_file TEXT,
      email_sent INTEGER DEFAULT 0,
      email_error TEXT,
      status TEXT DEFAULT 'pending',
      press_id_code TEXT,
      press_id_qr TEXT,
      press_id_issued_at DATETIME,
      press_id_expires_at DATETIME,
      designation TEXT DEFAULT 'Reporter',
      status_email_sent INTEGER DEFAULT 0,
      status_email_error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for fast querying & SEO routes
    CREATE INDEX IF NOT EXISTS idx_translations_lang_status ON article_translations(lang_code, status);
    CREATE INDEX IF NOT EXISTS idx_translations_slug ON article_translations(lang_code, slug);
    CREATE INDEX IF NOT EXISTS idx_translations_article_id ON article_translations(article_id);
    CREATE INDEX IF NOT EXISTS idx_ifttt_event_id ON ifttt_event_logs(event_id);
    CREATE INDEX IF NOT EXISTS idx_ifttt_idempotency ON ifttt_event_logs(idempotency_key);
    CREATE INDEX IF NOT EXISTS idx_fb_post_id ON facebook_imported_posts(fb_post_id);
  `);

  // Ensure dynamic columns exist for facebook_pages
  try { db.exec('ALTER TABLE facebook_pages ADD COLUMN page_url TEXT'); } catch(e) {}
  try { db.exec("ALTER TABLE facebook_pages ADD COLUMN page_type TEXT DEFAULT 'page'"); } catch(e) {}

  // Ensure dynamic columns exist for facebook_imported_posts
  try { db.exec('ALTER TABLE facebook_imported_posts ADD COLUMN post_url TEXT'); } catch(e) {}
  try { db.exec("ALTER TABLE facebook_imported_posts ADD COLUMN media_type TEXT DEFAULT 'post'"); } catch(e) {}

  // Ensure dynamic columns exist for article_translations
  try { db.exec('ALTER TABLE article_translations ADD COLUMN video_url TEXT'); } catch(e) {}

  // Ensure dynamic columns exist for reporter_applications
  try { db.exec('ALTER TABLE reporter_applications ADD COLUMN press_id_code TEXT'); } catch(e) {}
  try { db.exec('ALTER TABLE reporter_applications ADD COLUMN press_id_qr TEXT'); } catch(e) {}
  try { db.exec('ALTER TABLE reporter_applications ADD COLUMN press_id_issued_at DATETIME'); } catch(e) {}
  try { db.exec('ALTER TABLE reporter_applications ADD COLUMN press_id_expires_at DATETIME'); } catch(e) {}
  try { db.exec("ALTER TABLE reporter_applications ADD COLUMN designation TEXT DEFAULT 'Reporter'"); } catch(e) {}
  try { db.exec("ALTER TABLE reporter_applications ADD COLUMN join_as TEXT DEFAULT 'Reporter'"); } catch(e) {}
  try { db.exec('ALTER TABLE reporter_applications ADD COLUMN area TEXT'); } catch(e) {}
  try { db.exec('ALTER TABLE reporter_applications ADD COLUMN status_email_sent INTEGER DEFAULT 0'); } catch(e) {}
  try { db.exec('ALTER TABLE reporter_applications ADD COLUMN status_email_error TEXT'); } catch(e) {}

  // Reporting Areas Table for "Join us" territory allocation
  db.exec(`
    CREATE TABLE IF NOT EXISTS reporting_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default 27 reporting areas in alphabetical order (A to Z)
  const defaultReportingAreas = [
    'Abhayapuri',
    'Agomani',
    'Barpeta Road',
    'Barpeta Town',
    'Bijni',
    'Bilasipara',
    'Boitamari',
    'Bongaigaon',
    'Chagolia',
    'Chapar',
    'Chunari',
    'Dhubri',
    'Dotoma',
    'Fakiragram',
    'Fakirganj',
    'Gauripur',
    'Goalpara',
    'Golakganj',
    'Gossaigaon',
    'Halakura',
    'Hat Singimari',
    'Jogighopa',
    'Kokrajhar',
    'Lakhipur',
    'Mankachar',
    'North Salmara',
    'Salkocha'
  ];

  const insertAreaStmt = db.prepare('INSERT OR IGNORE INTO reporting_areas (name) VALUES (?)');
  for (const area of defaultReportingAreas) {
    insertAreaStmt.run(area);
  }

  // Social QR Codes Table for Header Links (Facebook, YouTube, Instagram, X)
  db.exec(`
    CREATE TABLE IF NOT EXISTS social_qr_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      qr_data_url TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  try { db.exec('ALTER TABLE social_qr_links ADD COLUMN qr_data_url TEXT'); } catch(e) {}

  // Seed default Facebook and YouTube links if empty
  const socialCount = db.prepare('SELECT COUNT(*) as count FROM social_qr_links').get().count;
  if (socialCount === 0) {
    const insertSocial = db.prepare(`
      INSERT INTO social_qr_links (platform, title, url, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertSocial.run('facebook', 'Official Facebook Page', 'https://www.facebook.com/nd30live/', 1, 1);
    insertSocial.run('youtube', 'Official YouTube Channel', 'https://www.youtube.com/@ND30LIVE', 1, 2);
  }

  // Advertisement Booking Tables (ND30 Live & Influencer Promotions)
  db.exec(`
    CREATE TABLE IF NOT EXISTS advertisement_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT UNIQUE NOT NULL,
      partner_type TEXT NOT NULL,
      influencer_id INTEGER,
      influencer_name TEXT,
      promotion_type TEXT NOT NULL,
      estimated_charges REAL DEFAULT 0,
      charges_currency TEXT DEFAULT 'INR',
      contact_name TEXT NOT NULL,
      mobile_number TEXT NOT NULL,
      is_mobile_verified INTEGER DEFAULT 0,
      email TEXT NOT NULL,
      business_name TEXT NOT NULL,
      business_desc TEXT,
      village_town TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ad_influencers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      handle TEXT,
      followers TEXT,
      niche TEXT,
      charge REAL DEFAULT 5000,
      bio TEXT,
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ad_promotion_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_type TEXT NOT NULL DEFAULT 'nd30',
      title TEXT NOT NULL,
      description TEXT,
      charge REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ad_system_settings (
      id INTEGER PRIMARY KEY,
      join_us_enabled INTEGER DEFAULT 1,
      whatsapp_otp_enabled INTEGER DEFAULT 0,
      whatsapp_notify_enabled INTEGER DEFAULT 0,
      whatsapp_provider TEXT DEFAULT 'meta',
      whatsapp_api_key TEXT DEFAULT '',
      whatsapp_phone_number_id TEXT DEFAULT '',
      email_notify_enabled INTEGER DEFAULT 0,
      smtp_host TEXT DEFAULT '',
      smtp_port INTEGER DEFAULT 587,
      smtp_user TEXT DEFAULT '',
      smtp_pass TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Frontend Notice Panel (Live banner with text styling, animations, small photo, and On/Off control)
    CREATE TABLE IF NOT EXISTS frontend_notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT '',
      message TEXT NOT NULL,
      message_as TEXT DEFAULT '',
      message_hi TEXT DEFAULT '',
      message_en TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      link_url TEXT DEFAULT '',
      link_text TEXT DEFAULT 'পঢ়ক / Read More',
      badge_text TEXT DEFAULT '📢 বিশেষ জাননী',
      badge_text_as TEXT DEFAULT '📢 বিশেষ জাননী',
      badge_text_hi TEXT DEFAULT '📢 विशेष सूचना',
      badge_text_en TEXT DEFAULT '📢 SPECIAL NOTICE',
      badge_style TEXT DEFAULT 'broadcast-pill',
      badge_anim TEXT DEFAULT 'neon-blink',
      badge_bg TEXT DEFAULT '#dc2626',
      badge_color TEXT DEFAULT '#ffffff',
      animation_type TEXT DEFAULT 'marquee',
      bg_theme TEXT DEFAULT 'crimson-alert',
      custom_bg TEXT DEFAULT '',
      text_color TEXT DEFAULT '#ffffff',
      font_size TEXT DEFAULT 'medium',
      font_weight TEXT DEFAULT '600',
      is_active INTEGER DEFAULT 1,
      show_close_button INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Sidebar Advertisement Photo Slider
    CREATE TABLE IF NOT EXISTS sidebar_slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT '',
      image_url TEXT NOT NULL,
      link_url TEXT DEFAULT '',
      caption TEXT DEFAULT '',
      whatsapp_number TEXT DEFAULT '',
      whatsapp_message TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users & RBAC Table (Admin, Approved Editor, Promoter)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      mobile TEXT,
      role TEXT NOT NULL DEFAULT 'editor',
      promoter_id TEXT UNIQUE,
      permissions TEXT DEFAULT '["dashboard","editor","articles"]',
      commission_structure TEXT DEFAULT '{"video":500,"banner":300,"both":800,"influencer":500}',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Active User Sessions Table
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Ensure dynamic columns exist for advertisement_bookings
  try { db.exec('ALTER TABLE advertisement_bookings ADD COLUMN promoter_id TEXT'); } catch(e) {}
  try { db.exec('ALTER TABLE advertisement_bookings ADD COLUMN promoter_user_id INTEGER'); } catch(e) {}
  try { db.exec('ALTER TABLE advertisement_bookings ADD COLUMN commission_amount REAL DEFAULT 0'); } catch(e) {}
  try { db.exec("ALTER TABLE advertisement_bookings ADD COLUMN commission_status TEXT DEFAULT 'In Process'"); } catch(e) {}
  try { db.exec('ALTER TABLE advertisement_bookings ADD COLUMN commission_paid_at DATETIME'); } catch(e) {}
  try { db.exec('ALTER TABLE advertisement_bookings ADD COLUMN commission_payment_ref TEXT'); } catch(e) {}

  // Ensure dynamic columns exist for users
  try { db.exec('ALTER TABLE users ADD COLUMN reporter_app_id INTEGER'); } catch(e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN press_id_code TEXT'); } catch(e) {}

  // Seed sample approved editors in reporter_applications if none exist
  try {
    const approvedEditorCount = db.prepare(`
      SELECT COUNT(*) as count FROM reporter_applications 
      WHERE status = 'approved' AND (LOWER(join_as) = 'editor' OR LOWER(designation) = 'editor')
    `).get()?.count || 0;

    if (approvedEditorCount === 0) {
      const insertEditorApp = db.prepare(`
        INSERT INTO reporter_applications (
          full_name, father_name, mobile_no, email, village_town, district, state, pin_code,
          education, experience, designation, join_as, area, status, press_id_code
        ) VALUES (?, ?, ?, ?, ?, ?, 'Assam', ?, ?, ?, 'Editor', 'Editor', ?, 'approved', ?)
      `);

      insertEditorApp.run(
        'Anupam Baruah', 'N. Baruah', '9864098765', 'anupam.editor@nd30.live', 'Chandmari', 'Guwahati', '781003',
        'Post Graduate in Mass Communication', '5 Years Senior Sub-Editor', 'Guwahati', 'ND30-EDT-2026-0001'
      );

      insertEditorApp.run(
        'Himangshu Das', 'D. Das', '9854123456', 'himangshu.editor@nd30.live', 'Mayapuri', 'Bongaigaon', '783380',
        'Bachelor in Journalism', '3 Years Regional Desk Editor', 'Bongaigaon', 'ND30-EDT-2026-0002'
      );
    }
  } catch (err) {
    console.warn('[Seed Approved Editors Warning]', err.message);
  }

  // Seed default master administrator if none exists
  const adminUser = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
  if (!adminUser) {
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('admin123', salt, 1000, 64, 'sha512').toString('hex');
    db.prepare(`
      INSERT INTO users (username, email, password_hash, salt, full_name, role, permissions, is_active)
      VALUES (?, ?, ?, ?, ?, 'admin', '["*"]', 1)
    `).run('admin', 'admin@nd30.live', hash, salt, 'ND30 Chief Administrator');
  }

  // Seed default settings row if missing
  db.prepare(`
    INSERT OR IGNORE INTO ad_system_settings (id, join_us_enabled, whatsapp_otp_enabled, whatsapp_notify_enabled)
    VALUES (1, 1, 0, 0)
  `).run();

  // Seed default notice row in frontend_notices if empty
  const noticeCount = db.prepare('SELECT COUNT(*) as count FROM frontend_notices').get().count;
  if (noticeCount === 0) {
    db.prepare(`
      INSERT INTO frontend_notices (
        title, message, image_url, link_url, link_text,
        badge_text, badge_bg, badge_color, animation_type, bg_theme,
        text_color, font_size, font_weight, is_active, show_close_button
      ) VALUES (
        'ND30 LIVE Official Notice',
        'উত্তৰ-পূবৰ নিৰ্ভীক আৰু নিৰপেক্ষ সংবাদ মাধ্যম ND30 LIVE লৈ স্বাগতম! Welcome to ND30 LIVE Digital Portal.',
        '',
        '/as/',
        'অধিক পঢ়ক ➜',
        '📢 বিশেষ জাননী',
        '#dc2626',
        '#ffffff',
        'marquee',
        'crimson-alert',
        '#ffffff',
        'medium',
        '600',
        1,
        1
      )
    `).run();
  }

  // Clear any existing notice photos (user requested photo section hidden)
  try {
    db.prepare("UPDATE frontend_notices SET image_url = '' WHERE image_url IS NOT NULL AND image_url != ''").run();
  } catch (e) {}

  // Migrate multilingual notice message and badge style columns
  try {
    const noticeCols = db.prepare('PRAGMA table_info(frontend_notices)').all().map(c => c.name);
    if (!noticeCols.includes('message_as')) {
      db.prepare('ALTER TABLE frontend_notices ADD COLUMN message_as TEXT DEFAULT ""').run();
    }
    if (!noticeCols.includes('message_hi')) {
      db.prepare('ALTER TABLE frontend_notices ADD COLUMN message_hi TEXT DEFAULT ""').run();
    }
    if (!noticeCols.includes('message_en')) {
      db.prepare('ALTER TABLE frontend_notices ADD COLUMN message_en TEXT DEFAULT ""').run();
    }
    if (!noticeCols.includes('badge_style')) {
      db.prepare('ALTER TABLE frontend_notices ADD COLUMN badge_style TEXT DEFAULT "broadcast-pill"').run();
    }
    if (!noticeCols.includes('badge_text_as')) {
      db.prepare('ALTER TABLE frontend_notices ADD COLUMN badge_text_as TEXT DEFAULT ""').run();
    }
    if (!noticeCols.includes('badge_text_hi')) {
      db.prepare('ALTER TABLE frontend_notices ADD COLUMN badge_text_hi TEXT DEFAULT ""').run();
    }
    if (!noticeCols.includes('badge_text_en')) {
      db.prepare('ALTER TABLE frontend_notices ADD COLUMN badge_text_en TEXT DEFAULT ""').run();
    }
    if (!noticeCols.includes('badge_anim')) {
      db.prepare('ALTER TABLE frontend_notices ADD COLUMN badge_anim TEXT DEFAULT "neon-blink"').run();
    }

    const currentNotice = db.prepare('SELECT * FROM frontend_notices LIMIT 1').get();
    if (currentNotice) {
      const msgAs = currentNotice.message_as || currentNotice.message || 'উত্তৰ-পূবৰ নিৰ্ভীক আৰু নিৰপেক্ষ সংবাদ মাধ্যম ND30 LIVE লৈ স্বাগতম! সকলো শেহতীয়া বাতৰিৰ বাবে আমাৰ সৈতে থাকক।';
      const msgHi = currentNotice.message_hi || 'पूर्वोत्तर के निर्भीक और निष्पक्ष समाचार माध्यम ND30 LIVE में आपका स्वागत है! ताज़ा समाचारों के लिए जुड़े रहें।';
      const msgEn = currentNotice.message_en || "Welcome to ND30 LIVE - Northeast India's Bold & Unbiased Digital News Portal. Stay tuned for live updates.";
      const bTextAs = currentNotice.badge_text_as || '📢 বিশেষ জাননী';
      const bTextHi = currentNotice.badge_text_hi || '📢 विशेष सूचना';
      const bTextEn = currentNotice.badge_text_en || '📢 SPECIAL NOTICE';
      const bStyle = currentNotice.badge_style || 'broadcast-pill';
      const bAnim = currentNotice.badge_anim || 'neon-blink';

      db.prepare(`
        UPDATE frontend_notices 
        SET message_as = COALESCE(NULLIF(message_as, ''), ?),
            message_hi = COALESCE(NULLIF(message_hi, ''), ?),
            message_en = COALESCE(NULLIF(message_en, ''), ?),
            badge_text_as = COALESCE(NULLIF(badge_text_as, ''), ?),
            badge_text_hi = COALESCE(NULLIF(badge_text_hi, ''), ?),
            badge_text_en = COALESCE(NULLIF(badge_text_en, ''), ?),
            badge_style = COALESCE(NULLIF(badge_style, ''), ?),
            badge_anim = COALESCE(NULLIF(badge_anim, ''), ?)
        WHERE id = ?
      `).run(msgAs, msgHi, msgEn, bTextAs, bTextHi, bTextEn, bStyle, bAnim, currentNotice.id);
    }
  } catch (e) {
    console.error('[DB Notice Multilingual Migration Error]', e.message);
  }

  // Seed default sidebar advertisement slides if empty
  const slideCount = db.prepare('SELECT COUNT(*) as count FROM sidebar_slides').get().count;
  if (slideCount === 0) {
    const insertSlide = db.prepare(`
      INSERT INTO sidebar_slides (title, image_url, link_url, caption, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    insertSlide.run(
      'ND30 LIVE Broadcast Studio',
      '/uploads/nd30_news_banner.jpg',
      '/as/',
      'Advertise with Northeast India\'s Leading Digital Newsroom',
      1
    );
    insertSlide.run(
      'Brahmaputra Regional Coverage',
      '/uploads/brahmaputra_bridge.jpg',
      '/as/',
      'Connect with 500,000+ Daily Verified Viewers Across Assam',
      2
    );
    insertSlide.run(
      'ND30 3D Commercial Spotlight',
      '/images/nd30_live_logo_solid.png',
      '/as/',
      'High-Impact Digital Sponsorships & Video Ad Placements',
      3
    );
  }

  // Ensure whatsapp_number and whatsapp_message columns exist in sidebar_slides
  try {
    const slideCols = db.prepare("PRAGMA table_info(sidebar_slides)").all();
    const colNames = slideCols.map(c => c.name);
    if (!colNames.includes('whatsapp_number')) {
      db.prepare("ALTER TABLE sidebar_slides ADD COLUMN whatsapp_number TEXT DEFAULT ''").run();
    }
    if (!colNames.includes('whatsapp_message')) {
      db.prepare("ALTER TABLE sidebar_slides ADD COLUMN whatsapp_message TEXT DEFAULT ''").run();
    }
    db.prepare("UPDATE sidebar_slides SET whatsapp_number = '919876543210', whatsapp_message = 'Hello! I saw your advertisement on ND30 LIVE and would like to connect.' WHERE whatsapp_number IS NULL OR whatsapp_number = ''").run();
  } catch (e) {}

  // Seed default promotion types for ND30 Live if empty
  const promoTypeCount = db.prepare('SELECT COUNT(*) as count FROM ad_promotion_types').get().count;
  if (promoTypeCount === 0) {
    const insertPromo = db.prepare(`
      INSERT INTO ad_promotion_types (partner_type, title, description, charge, is_active, sort_order)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
    insertPromo.run('nd30', 'Promotion Video', 'Featured video report / commercial broadcast on ND30 LIVE digital channels', 5000, 1);
    insertPromo.run('nd30', 'Promotion Banner', 'High-impact sponsored banner placement across news articles and homepages', 3000, 2);
    insertPromo.run('nd30', 'Both (Video & Banner)', 'Comprehensive package including dedicated promo video and continuous banner exposure', 7000, 3);
  }

  // Seed default influencers if empty
  const inflCount = db.prepare('SELECT COUNT(*) as count FROM ad_influencers').get().count;
  if (inflCount === 0) {
    const insertInfl = db.prepare(`
      INSERT INTO ad_influencers (name, platform, handle, followers, niche, charge, bio, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertInfl.run('Priyanka Borah', 'YouTube', '@priyankaborahvlogs', '320K Subscribers', 'Lifestyle, Food & Travel', 8000, 'Top Assam lifestyle creator covering Northeast events and brand reviews.', 1);
    insertInfl.run('Deepak Nath (Assam Explorer)', 'Instagram', '@assam_explorer', '185K Followers', 'Travel, Culture & Automobiles', 6000, 'Popular digital creator showcasing authentic Assam businesses and places.', 2);
    insertInfl.run('Rupam Kalita (Guwahati Beats)', 'Multi-Platform', '@guwahatibeats', '450K Combined', 'Youth, Entertainment & Business', 12000, 'Leading entertainment and youth media brand across Guwahati and Northeast India.', 3);
    insertInfl.run('Nilakshi Sharma', 'Facebook', '@nilakshiofficial', '210K Followers', 'Fashion, Retail & Beauty', 5000, 'Influential creator with high engagement in women fashion and retail shopping.', 4);
  }

  // Seed default languages if not present
  const langCount = db.prepare('SELECT COUNT(*) as count FROM languages').get().count;
  if (langCount === 0) {
    const insertLang = db.prepare(`
      INSERT INTO languages (code, name, native_name, direction, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertLang.run('as', 'Assamese', 'অসমীয়া', 'ltr', 1, 1);
    insertLang.run('hi', 'Hindi', 'हिंदी', 'ltr', 1, 2);
    insertLang.run('en', 'English', 'English', 'ltr', 1, 3);
  }

  // Seed Categories
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (lang_code, name, slug, description, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Assamese Categories
    insertCat.run('as', 'অসম', 'assam', 'অসমৰ সাম্প্ৰতিক ঘটনা আৰু খবৰ', 1);
    insertCat.run('as', 'ৰাষ্ট্ৰীয়', 'national', 'ভাৰতৰ বিভিন্ন প্ৰান্তৰ গুৰুত্বপূৰ্ণ বাতৰি', 2);
    insertCat.run('as', 'আন্তৰ্জাতিক', 'world', 'বিশ্বৰ প্ৰেক্ষাপট আৰু বৈদেশিক ঘটনাৱলী', 3);
    insertCat.run('as', 'খেল-ধেমালি', 'sports', 'ক্ৰীড়া জগতৰ সতেজ আপডেট', 4);
    insertCat.run('as', 'প্ৰযুক্তি', 'tech', 'বিজ্ঞান, মহাকাশ আৰু আধুনিক প্ৰযুক্তি', 5);
    insertCat.run('as', 'বিনোদন', 'entertainment', 'চলচ্চিত্ৰ আৰু সংস্কৃতি', 6);

    // Hindi Categories
    insertCat.run('hi', 'असम व पूर्वोत्तर', 'assam', 'असम और पूर्वोत्तर राज्यों के ताजा समाचार', 1);
    insertCat.run('hi', 'राष्ट्रीय', 'national', 'देशभर के प्रमुख घटनाक्रम और बड़ी खबरें', 2);
    insertCat.run('hi', 'अंतरराष्ट्रीय', 'world', 'वैश्विक परिदृश्य और अंतरराष्ट्रीय समाचार', 3);
    insertCat.run('hi', 'खेल', 'sports', 'क्रिकेट, फुटबॉल और खेल जगत की खबरें', 4);
    insertCat.run('hi', 'विज्ञान व तकनीक', 'tech', 'तकनीक, गैजेट्स और अंतरिक्ष मिशन', 5);
    insertCat.run('hi', 'मनोरंजन', 'entertainment', 'सिनेमा, कला और सांस्कृतिक जगत', 6);

    // English Categories
    insertCat.run('en', 'Assam & Northeast', 'assam', 'Latest developments and news from Assam & NE', 1);
    insertCat.run('en', 'National', 'national', 'Key political, economic and social stories from India', 2);
    insertCat.run('en', 'World', 'world', 'Global affairs and international diplomacy', 3);
    insertCat.run('en', 'Sports', 'sports', 'Cricket, football, and sporting triumphs', 4);
    insertCat.run('en', 'Technology', 'tech', 'Science, aerospace, and digital innovation', 5);
    insertCat.run('en', 'Entertainment', 'entertainment', 'Cinema, culture, and lifestyle', 6);
  }

  // Seed IFTTT Connection settings
  const iftttCount = db.prepare('SELECT COUNT(*) as count FROM ifttt_connections').get().count;
  if (iftttCount === 0) {
    db.prepare(`
      INSERT INTO ifttt_connections (id, enabled, webhook_secret, maker_key, test_status)
      VALUES (1, 1, ?, ?, 'ready')
    `).run('nd30_sec_' + uuidv4().replace(/-/g, '').slice(0, 24), 'c8K3jL8n9X0m1Q2w3E4r5T');
  }

  // Seed IFTTT Rules
  const ruleCount = db.prepare('SELECT COUNT(*) as count FROM ifttt_automation_rules').get().count;
  if (ruleCount === 0) {
    const insertRule = db.prepare(`
      INSERT INTO ifttt_automation_rules (rule_name, event_name, lang_code, target_service, webhook_url, is_active, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertRule.run('Assamese News to Telegram', 'new_assamese_news', 'as', 'telegram', 'https://maker.ifttt.com/trigger/new_assamese_news/with/key/ND30_DEFAULT', 1, 'Broadcasts Assamese news headline and link to Telegram channel');
    insertRule.run('Hindi News to Social Media', 'new_hindi_news', 'hi', 'x', 'https://maker.ifttt.com/trigger/new_hindi_news/with/key/ND30_DEFAULT', 1, 'Dispatches Hindi news to Twitter/X and social pages');
    insertRule.run('English News to Telegram & Webhook', 'new_english_news', 'en', 'telegram', 'https://maker.ifttt.com/trigger/new_english_news/with/key/ND30_DEFAULT', 1, 'Sends English breaking news to Telegram channel and alerts');
    insertRule.run('Global Article Publisher to Facebook Page', 'publish_to_facebook', 'all', 'facebook', 'https://maker.ifttt.com/trigger/publish_to_facebook/with/key/ND30_DEFAULT', 1, 'Triggers Facebook post creation with deduplication tags');
  }

  // Seed Facebook Pages
  const fbCount = db.prepare('SELECT COUNT(*) as count FROM facebook_pages').get().count;
  if (fbCount === 0) {
    const insertFb = db.prepare(`
      INSERT INTO facebook_pages (page_id, page_name, page_url, page_type, access_token, default_lang_code, auto_import_mode, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertFb.run('nd30live', 'ND30 LIVE', 'https://www.facebook.com/nd30live/', 'page', 'EAAJ...SAMPLE_META_TOKEN_ND30LIVE', 'as', 'review', 1);
  }

  // Seed AdSense Slots
  const adCount = db.prepare('SELECT COUNT(*) as count FROM adsense_slots').get().count;
  if (adCount === 0) {
    const insertAd = db.prepare(`
      INSERT INTO adsense_slots (slot_key, slot_name, ad_client, ad_slot_id, ad_format, is_active, custom_html)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAd.run('header_leaderboard', 'Top Header Leaderboard (728x90)', 'ca-pub-9876543210123456', '8812390192', 'horizontal', 1, '');
    insertAd.run('in_article_top', 'In-Article Inline Ad (Responsive)', 'ca-pub-9876543210123456', '9923847102', 'fluid', 1, '');
    insertAd.run('sidebar_rectangle', 'Sidebar Sticky Medium Rectangle (300x250)', 'ca-pub-9876543210123456', '5512093847', 'rectangle', 1, '');
    insertAd.run('hero_secondary_adsense', 'Homepage Hero Stack Ad Unit (300x250 Medium Rectangle)', 'ca-pub-9876543210123456', '5512093848', 'rectangle', 1, '');
    insertAd.run('footer_banner', 'Footer Wide Billboard (970x250)', 'ca-pub-9876543210123456', '4410293845', 'horizontal', 1, '');
  }

  // Ensure hero_secondary_adsense slot exists for existing databases
  try {
    const existingHeroSlot = db.prepare("SELECT id FROM adsense_slots WHERE slot_key = 'hero_secondary_adsense'").get();
    if (!existingHeroSlot) {
      db.prepare(`
        INSERT INTO adsense_slots (slot_key, slot_name, ad_client, ad_slot_id, ad_format, is_active, custom_html)
        VALUES ('hero_secondary_adsense', 'Homepage Hero Stack Ad Unit (300x250 Medium Rectangle)', 'ca-pub-9876543210123456', '5512093848', 'rectangle', 1, '')
      `).run();
    }
  } catch (e) {}

  // Seed Analytics
  const anaCount = db.prepare('SELECT COUNT(*) as count FROM analytics_settings').get().count;
  if (anaCount === 0) {
    db.prepare(`
      INSERT INTO analytics_settings (id, ga_measurement_id, is_active, track_pageviews, track_language_switches, track_ifttt_events)
      VALUES (1, 'G-ND30NEWS01', 1, 1, 1, 1)
    `).run();
  }

  // Seed Breaking News for all 3 languages
  const bnCount = db.prepare('SELECT COUNT(*) as count FROM breaking_news').get().count;
  if (bnCount === 0) {
    const insertBN = db.prepare(`
      INSERT INTO breaking_news (lang_code, title, link, is_active, sort_order)
      VALUES (?, ?, ?, 1, ?)
    `);
    // Assamese
    insertBN.run('as', 'ব্ৰহ্মপুত্ৰৰ ওপৰত নিৰ্মাণ সম্পূৰ্ণ হোৱাৰ দিশে উত্তৰ-পূবৰ দীৰ্ঘতম দলং, যোগাযোগ ব্যৱস্থাত ঐতিহাসিক বিপ্লৱ', '/as/assam/dhubri-brahmaputra-mega-bridge-project', 1);
    insertBN.run('as', 'কাজিৰঙা ৰাষ্ট্ৰীয় উদ্যানত গঁড় সুৰক্ষাৰ নতুন প্ৰযুক্তি সংযোজন, বন বিভাগে ঘোষণা কৰিলে বিশেষ প্ৰতিবেদন', '/as/assam/kaziranga-rhino-protection-ai-surveillance', 2);
    insertBN.run('as', 'গুৱাহাটী মহানগৰীত অনুষ্ঠিত হ’ব উত্তৰ-পূব বাণিজ্য আৰু বিনিয়োগ সন্মিলন ২০২৬', '/as/assam/guwahati-northeast-trade-summit', 3);

    // Hindi
    insertBN.run('hi', 'असम: ब्रह्मपुत्र नदी पर उत्तर-पूर्व के सबसे बड़े पुल का निर्माण अंतिम चरण में, धुबरी-फुलबारी संपर्क मजबूत', '/hi/assam/brahmaputra-bridge-dhubri-connectivity', 1);
    insertBN.run('hi', 'काजीरंगा राष्ट्रीय उद्यान में एक सींग वाले गैंडों के संरक्षण के लिए नया एआई निगरानी तंत्र सक्रिय', '/hi/assam/kaziranga-rhino-conservation-ai-system', 2);
    insertBN.run('hi', 'भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) ने अगले प्रक्षेपण अभियान की तिथियों का किया औपचारिक ऐलान', '/hi/tech/isro-next-gen-satellite-launch-mission', 3);

    // English
    insertBN.run('en', 'Historic Milestone: Northeast India’s Longest Brahmaputra Bridge Project Enters Final Phase', '/en/assam/brahmaputra-bridge-dhubri-northeast-connectivity', 1);
    insertBN.run('en', 'Kaziranga National Park Deploys State-of-the-Art AI Camera Grid for Greater One-Horned Rhino Safety', '/en/assam/kaziranga-rhino-protection-ai-surveillance-system', 2);
    insertBN.run('en', 'Global Investors Forum Confirmed for Guwahati to Propel Infrastructure and Green Energy in Assam', '/en/assam/guwahati-global-investors-summit-infrastructure', 3);
  }

  // Seed linked multilingual articles
  const artCount = db.prepare('SELECT COUNT(*) as count FROM articles').get().count;
  if (artCount === 0) {
    seedArticles();
  }
}

function seedArticles() {
  const insertArticle = db.prepare(`
    INSERT INTO articles (id, origin_source, origin_source_id)
    VALUES (?, ?, ?)
  `);

  const insertTranslation = db.prepare(`
    INSERT INTO article_translations (
      article_id, lang_code, title, slug, summary, content, category_id,
      subcategory_slug, tags, featured_image, image_caption, seo_title,
      seo_description, status, is_breaking, is_featured, is_trending, views_count,
      author_name, published_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?
    )
  `);

  // Story 1: Brahmaputra River Mega Bridge
  const art1Id = 'nd30-art-brahmaputra-bridge';
  insertArticle.run(art1Id, 'manual', null);

  const asCatAssam = db.prepare("SELECT id FROM categories WHERE lang_code='as' AND slug='assam'").get()?.id;
  const hiCatAssam = db.prepare("SELECT id FROM categories WHERE lang_code='hi' AND slug='assam'").get()?.id;
  const enCatAssam = db.prepare("SELECT id FROM categories WHERE lang_code='en' AND slug='assam'").get()?.id;

  // Assamese Story 1
  insertTranslation.run(
    art1Id, 'as',
    'ব্ৰহ্মপুত্ৰৰ ওপৰত নিৰ্মাণ সম্পূৰ্ণ হোৱাৰ দিশে উত্তৰ-পূবৰ দীৰ্ঘতম দলং: ধুবুৰী-ফুলবাৰী সংযোগী এই ঐতিহাসিক প্ৰকল্পই সলনি কৰিব অৰ্থনীতি',
    'dhubri-brahmaputra-mega-bridge-project',
    'ব্ৰহ্মপুত্ৰ নদীৰ ওপৰত প্ৰায় ১৯ কিলোমিটাৰ দৈৰ্ঘ্যৰ ধুবুৰী-ফুলবাৰী সংযোগী মেগা দলং প্ৰকল্পৰ কাম দ্ৰুতগতিত আগবাঢ়িছে। ই অসম আৰু মেঘালয়ৰ মাজৰ যাতায়াতৰ সময় ৬ ঘণ্টাৰ পৰা মাত্ৰ ২০ মিনিটলৈ হ্ৰাস কৰিব।',
    `<p><strong>ধুবুৰী / গুৱাহাটী:</strong> ব্ৰহ্মপুত্ৰ নদীৰ বুকুত নিৰ্মাণৰত দেশৰ অন্যতম দীৰ্ঘতম নদী দলং ধুবুৰী-ফুলবাৰী দলং প্ৰকল্পৰ নিৰ্মাণকাৰ্য এতিয়া অন্তিম পৰ্যায়ত উপনীত হৈছে। অসমৰ ধুবুৰী জিলাৰ সৈতে মেঘালয়ৰ ফুলবাৰীক সংযোগ কৰা এই ১৯ কিলোমিটাৰ দৈৰ্ঘ্যৰ দলংখনে সমগ্ৰ উত্তৰ-পূৰ্বাঞ্চলৰ যোগাযোগ আৰু বাণিজ্যৰ ক্ষেত্ৰত এক যুগান্তকাৰী পৰিৱৰ্তন আনিব।</p>
    <p>কেন্দ্ৰীয় পথ পৰিবহণ মন্ত্ৰালয় আৰু ৰাষ্ট্ৰীয় ঘাইপথ নিৰ্মাণ নিগমৰ তথ্য অনুসৰি, নদীৰ তীব্ৰ সোঁত আৰু বাৰিষাৰ প্ৰতিকূল পৰিস্থিতিৰ মাজতো অত্যাধুনিক প্ৰযুক্তি ব্যৱহাৰ কৰি দলংখনৰ স্তম্ভসমূহ স্থাপনৰ কাম ইতিমধ্যে সম্পূৰ্ণ হৈ উঠিছে।</p>
    <h3>অৰ্থনৈতিক আৰু সামাজিক প্ৰভাৱ</h3>
    <p>বৰ্তমান ধুবুৰী আৰু ফুলবাৰীৰ মাজত নদী পাৰাপাৰৰ বাবে নাও আৰু ফেৰীৰ ওপৰত নিৰ্ভৰ কৰিবলগীয়া হয়, য’ত প্ৰায় ২.৫ ঘণ্টা সময় ব্যয় হয়। বিকল্প স্থলপথেৰে ঘূৰি যোৱাত প্ৰায় ২০০ কিলোমিটাৰ অতিক্ৰম কৰিবলগীয়া হয় আৰু ৬ ঘণ্টাতকৈ অধিক সময় লাগে। এই দলংখন মুকলি হোৱাৰ পিছত এই দুৰত্ব মাত্ৰ ২০ মিনিটতে সম্পূৰ্ণ কৰিব পৰা যাব।</p>
    <p>স্থানীয় ব্যৱসায়ী আৰু কৃষকসকলে এই দলংখনৰ জৰিয়তে নিজৰ কৃষিজাত সামগ্ৰী গুৱাহাটী আৰু শ্বিলঙৰ বৃহৎ বজাৰলৈ অতি কম সময়তে প্ৰেৰণ কৰিব পাৰিব।</p>`,
    asCatAssam, 'dhubri', 'ধুবুৰী, ব্ৰহ্মপুত্ৰ, দলং, অসম সংবাদ, আন্তঃগাঁথনি',
    '/uploads/brahmaputra_bridge.jpg',
    'ব্ৰহ্মপুত্ৰ নদীৰ ওপৰত নিৰ্মাণৰত ঐতিহাসিক ধুবুৰী-ফুলবাৰী দলং প্ৰকল্পৰ দৃশ্য। ফটো: ND30 News',
    'ব্ৰহ্মপুত্ৰৰ ওপৰত নিৰ্মাণ সম্পূৰ্ণ হোৱাৰ দিশে উত্তৰ-পূবৰ দীৰ্ঘতম দলং | ND30 News',
    'ধুবুৰী-ফুলবাৰী ব্ৰহ্মপুত্ৰ মেগা দলং প্ৰকল্পৰ শেহতীয়া অগ্ৰগতি আৰু উত্তৰ-পূবৰ অৰ্থনীতিত ইয়াৰ সুদূৰপ্ৰসাৰী প্ৰভাৱ। পঢ়ক ND30 News অসমীয়াত।',
    'published', 1, 1, 1, 4820, 'প্ৰণৱ বৰুৱা, জ্যেষ্ঠ প্ৰতিবেদক',
    new Date(Date.now() - 3600000 * 4).toISOString()
  );

  // Hindi Story 1
  insertTranslation.run(
    art1Id, 'hi',
    'ब्रह्मपुत्र नदी पर उत्तर-पूर्व के सबसे बड़े पुल का निर्माण अंतिम चरण में: धुबरी-फूलबारी के बीच का सफर सिमटेगा 20 मिनट में',
    'brahmaputra-bridge-dhubri-connectivity',
    'असम के धुबरी और मेघालय के फूलबारी को जोड़ने वाले 19 किलोमीटर लंबे महासेतु का निर्माण कार्य तीव्र गति से पूरा हो रहा है। इससे यात्रा का समय 6 घंटे से घटकर मात्र 20 मिनट रह जाएगा।',
    `<p><strong>धुबरी / गुवाहाटी:</strong> ब्रह्मपुत्र नदी पर बन रहा ऐतिहासिक 19 किलोमीटर लंबा धुबरी-फूलबारी पुल अब अपने अंतिम निर्माण चरण में पहुंच चुका है। यह पुल असम और मेघालय को सीधे जोड़ते हुए पूरे पूर्वोत्तर भारत में परिवहन और वाणिज्यिक गतिविधियों को नई गति प्रदान करेगा।</p>
    <p>राष्ट्रीय राजमार्ग एवं अवसंरचना विकास निगम के अधिकारियों के अनुसार, यह देश में किसी भी नदी पर बनने वाले सबसे लंबे पुलों में से एक है। प्रतिकूल मौसम और ब्रह्मपुत्र के तेज बहाव के बीच अत्याधुनिक इंजीनियरिंग से इसका निर्माण किया जा रहा है।</p>
    <h3>व्यापार और पर्यटन को नई संजीवनी</h3>
    <p>वर्तमान में असम के धुबरी से मेघालय जाने के लिए नाव अथवा फेरियों का सहारा लेना पड़ता है, या फिर लंबी सड़क यात्रा करनी पड़ती है जिसमें 6 से 7 घंटे लग जाते हैं। नया पुल शुरू होने से यह दूरी महज 20 मिनट में तय हो सकेगी।</p>
    <p>इससे स्थानीय किसानों, फल और सब्जी उत्पादकों को असम और पूर्वोत्तर के बड़े बाजारों तक आसान पहुंच मिलेगी।</p>`,
    hiCatAssam, 'dhubri', 'असम, धुबरी, ब्रह्मपुत्र पुल, पूर्वोत्तर, इंफ्रास्ट्रक्चर, एनडी30 न्यूज़',
    '/uploads/brahmaputra_bridge.jpg',
    'ब्रह्मपुत्र नदी पर निर्माणाधीन धुबरी-फूलबारी सेतु। फोटो: ND30 News',
    'ब्रह्मपुत्र नदी पर पूर्वोत्तर के सबसे बड़े पुल का निर्माण अंतिम चरण में | ND30 News Hindi',
    'धुबरी-फूलबारी ब्रह्मपुत्र पुल परियोजना से असम और मेघालय के बीच आवागमन होगा सुगम। ND30 News हिंदी पर पढ़ें विस्तृत रिपोर्ट।',
    'published', 1, 1, 1, 3950, 'राजेश शर्मा, विशेष संवाददाता',
    new Date(Date.now() - 3600000 * 3).toISOString()
  );

  // English Story 1
  insertTranslation.run(
    art1Id, 'en',
    'Northeast India’s Longest Brahmaputra Bridge Project Enters Final Stretch: Dhubri to Phulbari Travel Time Cut to 20 Minutes',
    'brahmaputra-bridge-dhubri-northeast-connectivity',
    'The transformative 19-km Dhubri-Phulbari bridge across the Brahmaputra River is nearing completion, slashing travel time between Assam and Meghalaya from over six hours to just twenty minutes.',
    `<p><strong>Dhubri / Guwahati:</strong> In a defining leap for infrastructure in Northeast India, the 19-kilometer-long Dhubri-Phulbari bridge spanning the mighty Brahmaputra River has entered its final construction phase. Once commissioned, it will stand as one of India's longest river bridges, linking western Assam directly with southwestern Meghalaya.</p>
    <p>Engineers from the National Highways and Infrastructure Development Corporation Limited (NHIDCL) confirmed that deep pile foundation work and superstructure installations across the riverbed have progressed on schedule despite seasonal monsoons.</p>
    <h3>Catalyst for Regional Commerce and Border Logistics</h3>
    <p>Currently, commuters and cargo vehicles between Dhubri and Phulbari must rely on precarious ferry crossings taking up to 3 hours, or navigate a grueling 200-kilometer detour via the Naranarayan Setu taking over six hours. The four-lane bridge reduces this journey to a seamless 20-minute drive.</p>
    <p>Trade analysts anticipate a multifold increase in agricultural freight, cross-border commerce towards Bhutan and Bangladesh, and medical accessibility for rural communities across the river basin.</p>`,
    enCatAssam, 'dhubri', 'Assam, Dhubri, Brahmaputra Bridge, Infrastructure, Northeast India, ND30 News',
    '/uploads/brahmaputra_bridge.jpg',
    'Panoramic view of the four-lane Brahmaputra river bridge connecting Dhubri and Phulbari. Photo: ND30 News',
    'Northeast India’s Longest Brahmaputra Bridge Project Enters Final Stretch | ND30 News English',
    'Dhubri-Phulbari 19km mega bridge across Brahmaputra nears completion. Read full in-depth coverage on ND30 News English.',
    'published', 1, 1, 1, 6120, 'Arunabh Saikia, Chief Correspondent',
    new Date(Date.now() - 3600000 * 2).toISOString()
  );

  // Story 2: Kaziranga Rhino Conservation
  const art2Id = 'nd30-art-kaziranga-rhino';
  insertArticle.run(art2Id, 'manual', null);

  // Assamese Story 2
  insertTranslation.run(
    art2Id, 'as',
    'কাজিৰঙা ৰাষ্ট্ৰীয় উদ্যানত গঁড় সুৰক্ষাৰ বাবে অত্যাধুনিক এআই নিৰীক্ষণ ব্যৱস্থা কাৰ্যকৰী, চোৰাং চিকাৰ শূন্যকৰণৰ লক্ষ্য',
    'kaziranga-rhino-protection-ai-surveillance',
    'বিশ্ব ঐতিহ্য ক্ষেত্ৰ কাজিৰঙা ৰাষ্ট্ৰীয় উদ্যানত এচিংয়া গঁড়ৰ সুৰক্ষা অধিক কটকটীয়া কৰিবলৈ কৃত্ৰিম বুদ্ধিমত্তা (AI) চালিত সেন্সৰ আৰু থাৰ্মেল কেমেৰা নেটৱৰ্ক স্থাপন কৰা হৈছে।',
    `<p><strong>কাজিৰঙা:</strong> বিশ্ব ঐতিহ্যক্ষেত্ৰ কাজিৰঙা ৰাষ্ট্ৰীয় উদ্যানত অসমৰ গৌৰৱ এশিঙীয়া গঁড়ৰ নিৰাপত্তা নিশ্চিত কৰিবলৈ অসম চৰকাৰৰ বন বিভাগে এক যুগান্তকাৰী পদক্ষেপ গ্ৰহণ কৰিছে। উদ্যানখনৰ অতি সংবেদনশীল এলেকা সমূহত অত্যাধুনিক এআই (AI) সংযোজিত ইলেক্ট্ৰনিক নিৰীক্ষণ ব্যৱস্থা আৰু স্মাৰ্ট পেট্ৰ’লিং প্ৰযুক্তি সম্পূৰ্ণৰূপে কাৰ্যকৰী কৰা হৈছে।</p>
    <p>বন বিষয়াৰ মতে, এই ব্যৱস্থাই ২৪ ঘণ্টাই উদ্যানৰ সীমাৰ ভিতৰত যিকোনো অবাঞ্চিত মানৱীয় গতিবিধি ধৰা পেলাব পাৰিব আৰু লগে লগে কমাণ্ড এণ্ড কন্ট্ৰোল ৰুমলৈ সতৰ্কবাণী প্ৰেৰণ কৰিব।</p>`,
    asCatAssam, 'wildlife', 'কাজিৰঙা, গঁড় সুৰক্ষা, অসম বন বিভাগ, বন্যপ্ৰাণী',
    '/uploads/kaziranga_rhino.jpg',
    'কাজিৰঙাৰ ঘাঁহনিত শান্তিপূৰ্ণভাৱে বিচৰণ কৰা এশিঙীয়া গঁড়। ফটো: ND30 News',
    'কাজিৰঙা ৰাষ্ট্ৰীয় উদ্যানত গঁড় সুৰক্ষাৰ বাবে এআই নিৰীক্ষণ | ND30 News',
    'কাজিৰঙাত এশিঙীয়া গঁড় সুৰক্ষাৰ বাবে অত্যাধুনিক এআই সেন্সৰ আৰু স্মাৰ্ট পেট্ৰ’লিং। পঢ়ক সবিশেষ।',
    'published', 0, 1, 1, 3420, 'ৰূপম বৰা, কাজিৰঙা প্ৰতিনিধি',
    new Date(Date.now() - 3600000 * 8).toISOString()
  );

  // Hindi Story 2
  insertTranslation.run(
    art2Id, 'hi',
    'काजीरंगा में एक सींग वाले गैंडों के संरक्षण के लिए एआई आधारित स्मार्ट निगरानी प्रणाली लागू, शिकारियों पर कड़ी नजर',
    'kaziranga-rhino-conservation-ai-system',
    'असम के विश्व प्रसिद्ध काजीरंगा राष्ट्रीय उद्यान में गैंडों की सुरक्षा को और पुख्ता करने के लिए थर्मल नाइट विज़न कैमरों और आर्टिफिशियल इंटेलिजेंस आधारित सेंसर ग्रिड को तैनात किया गया है।',
    `<p><strong>काजीरंगा:</strong> असम के विश्व धरोहर स्थल काजीरंगा राष्ट्रीय उद्यान में एक सींग वाले गैंडों की सुरक्षा के लिए अत्याधुनिक तकनीक का उपयोग शुरू हो गया है। वन विभाग ने संवेदनशील परिधियों में आर्टिफिशियल इंटेलिजेंस (AI) से लैस स्मार्ट सर्विलांस कैमरे और मोशन सेंसर ग्रिड सक्रिय कर दिए हैं।</p>
    <p>इस तकनीक से रात्रि के अंधकार में भी संदिग्ध गतिविधियों का तुरंत पता लगाया जा सकेगा और त्वरित प्रतिक्रिया बल (QRF) को ऑटोमैटिक अलर्ट भेजा जाएगा।</p>`,
    hiCatAssam, 'wildlife', 'काजीरंगा, असम, गैंडा संरक्षण, वन्यजीव, एआई तकनीक, एनडी30',
    '/uploads/kaziranga_rhino.jpg',
    'काजीरंगा राष्ट्रीय उद्यान में विशाल एक सींग वाला गैंडा। फोटो: ND30 News',
    'काजीरंगा में गैंडों के संरक्षण हेतु एआई आधारित स्मार्ट निगरानी | ND30 News Hindi',
    'काजीरंगा राष्ट्रीय उद्यान में वन्यजीव सुरक्षा को मजबूत करने वाली एआई प्रणाली की विस्तृत रिपोर्ट।',
    'published', 0, 1, 1, 2890, 'सुनील वर्मा, पर्यावरण डेस्क',
    new Date(Date.now() - 3600000 * 7).toISOString()
  );

  // English Story 2
  insertTranslation.run(
    art2Id, 'en',
    'Kaziranga National Park Deploys State-of-the-Art AI Camera Grid for Greater One-Horned Rhino Safety',
    'kaziranga-rhino-protection-ai-surveillance-system',
    'Assam’s iconic Kaziranga National Park implements an advanced Artificial Intelligence-powered thermal sensor perimeter to eliminate poaching risks and track wildlife movements.',
    `<p><strong>Kaziranga:</strong> In a formidable technological upgrade for wildlife preservation, Assam’s UNESCO World Heritage Kaziranga National Park has commissioned an end-to-end AI-powered electronic surveillance grid. The system combines high-resolution thermal imaging, acoustic tripwires, and automated night-vision drones.</p>
    <p>According to the park directorate, the automated algorithm differentiates between animal movement and illegal human trespassers, instantly transmitting real-time coordinate alerts to rapid response patrol teams.</p>`,
    enCatAssam, 'wildlife', 'Kaziranga, Assam Wildlife, One Horned Rhino, AI Conservation, ND30 News',
    '/uploads/kaziranga_rhino.jpg',
    'Greater One-Horned Rhinoceros grazing in the wetlands of Kaziranga. Photo: ND30 News',
    'Kaziranga National Park Deploys AI Camera Grid for Rhino Safety | ND30 News English',
    'State of the art AI surveillance safeguards Kaziranga rhinos in Assam. Read full analysis.',
    'published', 0, 1, 1, 4110, 'Debojit Hazarika, Environment Editor',
    new Date(Date.now() - 3600000 * 6).toISOString()
  );

  // Story 3: ND30 Studio Expansion / Broadcast Launch
  const art3Id = 'nd30-art-broadcast-expansion';
  insertArticle.run(art3Id, 'manual', null);

  const asCatTech = db.prepare("SELECT id FROM categories WHERE lang_code='as' AND slug='tech'").get()?.id;
  const hiCatTech = db.prepare("SELECT id FROM categories WHERE lang_code='hi' AND slug='tech'").get()?.id;
  const enCatTech = db.prepare("SELECT id FROM categories WHERE lang_code='en' AND slug='tech'").get()?.id;

  // Assamese Story 3
  insertTranslation.run(
    art3Id, 'as',
    'এনডি৩০ ডিজিটেল নিউজৰ ত্ৰিভাষিক মাল্টিমিডিয়া সম্প্ৰচাৰ হাব উদ্বোধন: অসমীয়া, হিন্দী আৰু ইংৰাজী সাংবাদিকতাৰ নতুন দিগন্ত',
    'nd30-multilingual-digital-broadcasting-hub',
    'উত্তৰ-পূৰ্বাঞ্চলৰ নিৰ্ভীক আৰু নিৰপেক্ষ সংবাদ মাধ্যম ND30 NEWS-এ আনুষ্ঠানিকভাৱে শুভাৰম্ভ কৰিলে ত্ৰিভাষিক ডিজিটেল প্ৰকাশন আৰু অটোমেচন নেটৱৰ্ক।',
    `<p><strong>গুৱাহাটী:</strong> উত্তৰ-পূবৰ জনসাধাৰণৰ স্বৰস্বৰূপ ND30 NEWS-এ আজি সাংবাদিকতাৰ ইতিহাসত এক নতুন অধ্যায়ৰ সূচনা কৰিলে। অত্যাধুনিক সম্প্ৰচাৰ ষ্টুডিঅ’ আৰু ত্ৰিভাষিক ডিজিটেল নিউজ পৰ্টেল উন্মোচন কৰি অসমীয়া, হিন্দী আৰু ইংৰাজী ভাষাত একেলগে সংবাদ সেৱা আগবঢ়োৱাৰ ব্যৱস্থা কাৰ্যকৰী কৰা হৈছে।</p>
    <p>নতুন মঞ্চত আইএফটিটিটি (IFTTT) অটোমেচন, ফেচবুক লাইভ ইন্টিগ্ৰেচন আৰু নিৰপেক্ষ সাংবাদিকতাৰ দ্বাৰা ব্ৰহ্মপুত্ৰ উপত্যকাৰ পৰা বিশ্বৰ প্ৰতিটো কোণলৈ সত্যনিষ্ঠ সংবাদ সতেজভাৱে প্ৰেৰণ কৰা হ’ব।</p>`,
    asCatTech, 'media', 'এনডি৩০, ডিজিটেল নিউজ, অসম সংবাদ, আইএফটিটিটি, সাংবাদিকতা',
    '/uploads/nd30_news_banner.jpg',
    'ND30 NEWS আধুনিক সম্প্ৰচাৰ নিয়ন্ত্ৰণ কক্ষ আৰু ষ্টুডিঅ’। ফটো: ND30',
    'ND30 ডিজিটেল নিউজৰ ত্ৰিভাষিক হাব উদ্বোধন | ND30 News',
    'অসমীয়া, হিন্দী আৰু ইংৰাজী ত্ৰিভাষিক প্ৰকাশন ব্যৱস্থাসহ ND30 NEWS-ৰ নতুন ডিজিটেল পৰ্টেল শুভাৰম্ভ।',
    'published', 0, 1, 1, 5200, 'সম্পাদকীয় বিভাগ',
    new Date(Date.now() - 3600000 * 12).toISOString()
  );

  // Hindi Story 3
  insertTranslation.run(
    art3Id, 'hi',
    'ND30 NEWS ने शुरू किया आधुनिक त्रिभाषी प्रसारण केंद्र: असमिया, हिंदी और अंग्रेजी में निर्बाध समाचार कवरेज',
    'nd30-multilingual-broadcasting-network-launch',
    'पूर्वोत्तर भारत की आवाज ND30 NEWS ने अत्याधुनिक डिजिटल न्यूजरूम और ऑटोमेशन सिस्टम के साथ त्रिभाषी पोर्टल का भव्य शुभारंभ किया।',
    `<p><strong>गुवाहाटी:</strong> डिजिटल पत्रकारिता के क्षेत्र में क्रांतिकारी कदम उठाते हुए ND30 NEWS ने अपने नए त्रिभाषी पब्लिशिंग प्लेटफॉर्म का औपचारिक शुभारंभ किया है। अब पाठक असमिया, हिंदी और अंग्रेजी—तीनों भाषाओं में देश और पूर्वोत्तर की महत्वपूर्ण खबरों को विश्वसनीयता और गति के साथ पढ़ सकेंगे।</p>
    <p>इस आधुनिक प्रणाली में IFTTT ऑटोमेशन, सोशल मीडिया डायरेक्ट सिंक और पारदर्शी तथ्य-जांच प्रणाली शामिल है।</p>`,
    hiCatTech, 'media', 'एनडी30 न्यूज़, डिजिटल मीडिया, हिंदी समाचार, प्रसारण',
    '/uploads/nd30_news_banner.jpg',
    'ND30 NEWS का अत्याधुनिक न्यूजरूम व ब्रॉडकास्ट कंसोल। फोटो: ND30',
    'ND30 NEWS ने शुरू किया आधुनिक त्रिभाषी प्रसारण केंद्र | ND30 News Hindi',
    'असमिया, हिंदी और अंग्रेजी में एक साथ विश्वसनीय समाचार के लिए ND30 NEWS का आधुनिक डिजिटल पोर्टल।',
    'published', 0, 1, 1, 4400, 'संपादकीय टीम',
    new Date(Date.now() - 3600000 * 11).toISOString()
  );

  // English Story 3
  insertTranslation.run(
    art3Id, 'en',
    'ND30 NEWS Unveils Next-Gen Multilingual Broadcasting Hub & IFTTT Automation System',
    'nd30-multilingual-broadcasting-hub-ifttt-automation',
    'ND30 NEWS elevates digital journalism in Northeast India with an integrated tri-lingual news publishing architecture, real-time social automation, and high-fidelity reporting.',
    `<p><strong>Guwahati:</strong> Marking a major milestone in regional journalism, ND30 NEWS today announced the launch of its unified tri-lingual digital news ecosystem. Engineered to serve readers in Assamese, Hindi, and English with dedicated editorial autonomy, the platform integrates automated wire feeds, Meta Graph API ingest, and IFTTT-powered instant multichannel syndication.</p>
    <p>Readers will experience lightning-fast page delivery, dedicated language homepages, and seamless cross-lingual story switching backed by enterprise-grade SEO and data integrity protocols.</p>`,
    enCatTech, 'media', 'ND30 News, Multilingual Journalism, IFTTT Automation, Tech News',
    '/uploads/nd30_news_banner.jpg',
    'State-of-the-art ND30 NEWS multi-screen newsroom and live production studio. Photo: ND30',
    'ND30 NEWS Unveils Multilingual Broadcasting Hub | ND30 News English',
    'ND30 NEWS launches cutting-edge tri-lingual publishing system and IFTTT multi-channel automation. Read the official announcement.',
    'published', 0, 1, 1, 7150, 'Editorial Bureau',
    new Date(Date.now() - 3600000 * 10).toISOString()
  );

  // Story 4: Single-Language article test case (Assamese only) to prove requirement 2: "If a translation does not exist, show only the available language versions. Never redirect users to an unrelated article."
  const art4Id = 'nd30-art-dhubri-local-festival';
  insertArticle.run(art4Id, 'manual', null);
  insertTranslation.run(
    art4Id, 'as',
    'ধুবুৰী জিলাত ঐতিহাসিক ব্ৰহ্মপুত্ৰ মহোৎসৱৰ শুভাৰম্ভ: লোক সংস্কৃতিৰ অনন্য সমাহাৰ',
    'dhubri-brahmaputra-cultural-festival-inauguration',
    'ধুবুৰী জিলা প্ৰশাসন আৰু সংস্কৃতি বিভাগৰ উদ্যোগত ব্ৰহ্মপুত্ৰৰ বাকৰিত বৰ্ণাঢ্য কাৰ্যসূচীৰে তিনিদিনীয়া লোক মহোৎসৱ আৰম্ভ হৈছে।',
    `<p><strong>ধুবুৰী:</strong> নামনি অসমৰ ঐতিহাসিক চহৰ ধুবুৰীত আজিৰ পৰা তিনিদিনীয়া বৰ্ণাঢ্য কাৰ্যসূচীৰে ব্ৰহ্মপুত্ৰ লোক সংস্কৃতি মহোৎসৱৰ শুভাৰম্ভ ঘটিছে। নদীৰ পাৰত স্থানীয় শিল্পী আৰু বিভিন্ন জনগোষ্ঠীয় লোকসকলে নিজ নিজ পৰম্পৰাগত কৃষ্টি প্ৰদৰ্শন কৰে।</p>
    <p>উদ্বোধনী সভাত জিলা আয়ুক্তই কয় যে এই মহোৎসৱে ধুবুৰীৰ পৰ্যটন আৰু হেৰিটেজক বিশ্ব দৰবাৰত তুলি ধৰাত সহায় কৰিব।</p>`,
    asCatAssam, 'dhubri', 'ধুবুৰী, মহোৎসৱ, সংস্কৃতি, অসম',
    '/uploads/brahmaputra_bridge.jpg',
    'ধুবুৰী ব্ৰহ্মপুত্ৰ নদীৰ পাৰত অনুষ্ঠিত সাংস্কৃতিক কাৰ্যসূচী। ফটো: ND30',
    'ধুবুৰী জিলাত ঐতিহাসিক ব্ৰহ্মপুত্ৰ মহোৎসৱৰ শুভাৰম্ভ | ND30 News',
    'ধুবুৰী জিলাৰ ব্ৰহ্মপুত্ৰ লোক সংস্কৃতি মহোৎসৱৰ বিস্তৃত খবৰ। পঢ়ক ND30 Newsত।',
    'published', 0, 0, 1, 1920, 'ধুবুৰী বাৰ্তা ব্যুৰো',
    new Date(Date.now() - 3600000 * 14).toISOString()
  );
}

module.exports = {
  db,
  initDatabase
};
