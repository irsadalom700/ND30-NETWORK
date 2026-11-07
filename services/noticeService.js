/**
 * ND30 LIVE - Frontend Notice Panel Service
 * Manages notice banner configuration, file uploads for small photos/icons,
 * styling presets, 5 text animation engines, and live On/Off visibility state.
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db } = require('../database/db');

// Ensure upload directory exists for notice images
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'notices');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration for Notice Thumbnails / Photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    cb(null, `notice_${Date.now()}_${cleanBase}${ext}`);
  }
});

const uploadNoticeImage = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image format "${ext}". Allowed formats: JPG, PNG, WEBP, GIF, SVG.`));
    }
  }
}).single('notice_photo');

/**
 * Get active notice for frontend display
 * Returns null if no notice is active or if is_active == 0
 */
function getActiveNotice() {
  try {
    const notice = db.prepare(`
      SELECT * FROM frontend_notices 
      WHERE is_active = 1 
      ORDER BY updated_at DESC, id DESC 
      LIMIT 1
    `).get();
    return notice || null;
  } catch (err) {
    console.error('[NoticeService getActiveNotice Error]', err.message);
    return null;
  }
}

/**
 * Get the primary/latest notice for admin editing
 */
function getNotice() {
  try {
    let notice = db.prepare(`
      SELECT * FROM frontend_notices 
      ORDER BY updated_at DESC, id DESC 
      LIMIT 1
    `).get();

    if (!notice) {
      // Create a default if table is empty
      const info = db.prepare(`
        INSERT INTO frontend_notices (
          title, message, image_url, link_url, link_text,
          badge_text, badge_bg, badge_color, animation_type, bg_theme,
          text_color, font_size, font_weight, is_active, show_close_button
        ) VALUES (
          'ND30 LIVE Official Notice',
          'উত্তৰ-পূবৰ নিৰ্ভীক আৰু নিৰপেক্ষ সংবাদ মাধ্যম ND30 LIVE লৈ স্বাগতম! Welcome to ND30 LIVE Digital Portal.',
          '/images/nd30_live_logo.png',
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
      notice = db.prepare('SELECT * FROM frontend_notices WHERE id = ?').get(info.lastInsertRowid);
    }

    if (notice) {
      if (!notice.message_as) notice.message_as = notice.message || '';
      if (!notice.message_hi) notice.message_hi = 'पूर्वोत्तर के निर्भीक और निष्पक्ष समाचार माध्यम ND30 LIVE में आपका स्वागत है! ताज़ा समाचारों के लिए जुड़े रहें।';
      if (!notice.message_en) notice.message_en = "Welcome to ND30 LIVE - Northeast India's Bold & Unbiased Digital News Portal. Stay tuned for live updates.";
      if (!notice.badge_text_as) notice.badge_text_as = '📢 বিশেষ জাননী';
      if (!notice.badge_text_hi) notice.badge_text_hi = '📢 विशेष सूचना';
      if (!notice.badge_text_en) notice.badge_text_en = '📢 SPECIAL NOTICE';
      if (!notice.badge_style) notice.badge_style = 'broadcast-pill';
      if (!notice.badge_anim) notice.badge_anim = 'neon-blink';
      if (!notice.badge_bg) notice.badge_bg = '#be123c';
    }

    return notice;
  } catch (err) {
    console.error('[NoticeService getNotice Error]', err.message);
    return null;
  }
}

/**
 * Get all notices list
 */
function getAllNotices() {
  try {
    return db.prepare('SELECT * FROM frontend_notices ORDER BY id DESC').all();
  } catch (err) {
    console.error('[NoticeService getAllNotices Error]', err.message);
    return [];
  }
}

/**
 * Get notice by ID
 */
function getNoticeById(id) {
  try {
    return db.prepare('SELECT * FROM frontend_notices WHERE id = ?').get(id);
  } catch (err) {
    console.error('[NoticeService getNoticeById Error]', err.message);
    return null;
  }
}

/**
 * Save or update notice
 */
function saveNotice(data, file = null) {
  try {
    const id = data.id ? parseInt(data.id, 10) : null;
    let imageUrl = ''; // Photo section hidden and disabled

    const title = (data.title || '').trim();
    const messageAs = (data.message_as || data.message || '').trim();
    const messageHi = (data.message_hi || '').trim();
    const messageEn = (data.message_en || '').trim();
    const message = (data.message || messageAs || messageEn || messageHi || '').trim();
    const linkUrl = (data.link_url || '').trim();
    const linkText = (data.link_text || 'পঢ়ক / Read More').trim();

    const badgeTextAs = (data.badge_text_as || '📢 বিশেষ জাননী').trim();
    const badgeTextHi = (data.badge_text_hi || '📢 विशेष सूचना').trim();
    const badgeTextEn = (data.badge_text_en || '📢 SPECIAL NOTICE').trim();
    const badgeText = (data.badge_text || badgeTextAs || '📢 বিশেষ জাননী').trim();
    const badgeStyle = data.badge_style || 'broadcast-pill';
    const badgeAnim = data.badge_anim || 'neon-blink';
    const badgeBg = data.badge_bg || '#be123c';
    const badgeColor = data.badge_color || '#ffffff';
    
    // Valid animation types: marquee, pulse-glow, typewriter, bounce-float, shimmer-shine
    const validAnims = ['marquee', 'pulse-glow', 'typewriter', 'bounce-float', 'shimmer-shine'];
    const animationType = validAnims.includes(data.animation_type) ? data.animation_type : 'marquee';

    const bgTheme = data.bg_theme || 'crimson-alert';
    const customBg = (data.custom_bg || '').trim();
    const textColor = data.text_color || '#ffffff';
    const fontSize = data.font_size || 'medium';
    const fontWeight = data.font_weight || '600';
    const isActive = (data.is_active === '1' || data.is_active === 1 || data.is_active === true || data.is_active === 'true' || data.is_active === 'on') ? 1 : 0;
    const showCloseButton = (data.show_close_button === '1' || data.show_close_button === 1 || data.show_close_button === true || data.show_close_button === 'on') ? 1 : 0;

    if (id) {
      // Update existing
      db.prepare(`
        UPDATE frontend_notices SET
          title = ?,
          message = ?,
          message_as = ?,
          message_hi = ?,
          message_en = ?,
          image_url = '',
          link_url = ?,
          link_text = ?,
          badge_text = ?,
          badge_text_as = ?,
          badge_text_hi = ?,
          badge_text_en = ?,
          badge_style = ?,
          badge_anim = ?,
          badge_bg = ?,
          badge_color = ?,
          animation_type = ?,
          bg_theme = ?,
          custom_bg = ?,
          text_color = ?,
          font_size = ?,
          font_weight = ?,
          is_active = ?,
          show_close_button = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title, message, messageAs, messageHi, messageEn, linkUrl, linkText,
        badgeText, badgeTextAs, badgeTextHi, badgeTextEn, badgeStyle, badgeAnim, badgeBg, badgeColor,
        animationType, bgTheme, customBg, textColor, fontSize, fontWeight, isActive, showCloseButton, id
      );
      return getNoticeById(id);
    } else {
      // Insert new
      const result = db.prepare(`
        INSERT INTO frontend_notices (
          title, message, message_as, message_hi, message_en,
          image_url, link_url, link_text,
          badge_text, badge_text_as, badge_text_hi, badge_text_en, badge_style, badge_anim, badge_bg, badge_color,
          animation_type, bg_theme, custom_bg, text_color, font_size, font_weight, is_active, show_close_button
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `).run(
        title, message, messageAs, messageHi, messageEn, imageUrl, linkUrl, linkText,
        badgeText, badgeTextAs, badgeTextHi, badgeTextEn, badgeStyle, badgeAnim, badgeBg, badgeColor,
        animationType, bgTheme, customBg, textColor, fontSize, fontWeight, isActive, showCloseButton
      );
      return getNoticeById(result.lastInsertRowid);
    }
  } catch (err) {
    console.error('[NoticeService saveNotice Error]', err.message);
    throw err;
  }
}

/**
 * Quick toggle On/Off status
 */
function toggleNoticeStatus(id, isActive) {
  try {
    const val = isActive ? 1 : 0;
    if (id) {
      db.prepare(`
        UPDATE frontend_notices 
        SET is_active = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(val, id);
    } else {
      // Toggle the latest notice
      db.prepare(`
        UPDATE frontend_notices 
        SET is_active = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = (SELECT id FROM frontend_notices ORDER BY updated_at DESC LIMIT 1)
      `).run(val);
    }
    return { success: true, is_active: val };
  } catch (err) {
    console.error('[NoticeService toggleNoticeStatus Error]', err.message);
    throw err;
  }
}

/**
 * Delete notice
 */
function deleteNotice(id) {
  try {
    const notice = getNoticeById(id);
    if (notice && notice.image_url && notice.image_url.startsWith('/uploads/notices/')) {
      const filePath = path.join(__dirname, '..', 'public', notice.image_url);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }
    db.prepare('DELETE FROM frontend_notices WHERE id = ?').run(id);
    return true;
  } catch (err) {
    console.error('[NoticeService deleteNotice Error]', err.message);
    throw err;
  }
}

module.exports = {
  uploadNoticeImage,
  getActiveNotice,
  getNotice,
  getAllNotices,
  getNoticeById,
  saveNotice,
  toggleNoticeStatus,
  deleteNotice
};

