/**
 * ND30 LIVE - Advertisement Service
 * Handles bookings for ND30 Live official slots and listed influencers,
 * pricing calculation, WhatsApp/Email alerts, and admin dashboard management.
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db } = require('../database/db');
const {
  sendBookingConfirmationWhatsApp,
  sendStatusUpdateWhatsApp
} = require('./whatsappService');

/**
 * Fetch Current Advertisement & System Settings
 */
function getAdvertisementSettings() {
  const row = db.prepare('SELECT * FROM ad_system_settings WHERE id = 1').get();
  if (!row) {
    db.prepare('INSERT OR IGNORE INTO ad_system_settings (id, join_us_enabled, whatsapp_otp_enabled) VALUES (1, 1, 0)').run();
    return db.prepare('SELECT * FROM ad_system_settings WHERE id = 1').get();
  }
  return row;
}

/**
 * Update Advertisement System Settings (Join Us toggle, WhatsApp OTP toggle, API keys)
 */
function updateAdvertisementSettings(updates = {}) {
  const current = getAdvertisementSettings();

  const joinUsEnabled = updates.join_us_enabled !== undefined ? (updates.join_us_enabled ? 1 : 0) : current.join_us_enabled;
  const whatsappOtpEnabled = updates.whatsapp_otp_enabled !== undefined ? (updates.whatsapp_otp_enabled ? 1 : 0) : current.whatsapp_otp_enabled;
  const whatsappNotifyEnabled = updates.whatsapp_notify_enabled !== undefined ? (updates.whatsapp_notify_enabled ? 1 : 0) : current.whatsapp_notify_enabled;
  const whatsappProvider = updates.whatsapp_provider || current.whatsapp_provider || 'meta';
  const whatsappApiKey = updates.whatsapp_api_key !== undefined ? updates.whatsapp_api_key.trim() : current.whatsapp_api_key;
  const whatsappPhoneId = updates.whatsapp_phone_number_id !== undefined ? updates.whatsapp_phone_number_id.trim() : current.whatsapp_phone_number_id;
  const emailNotifyEnabled = updates.email_notify_enabled !== undefined ? (updates.email_notify_enabled ? 1 : 0) : current.email_notify_enabled;
  const smtpHost = updates.smtp_host !== undefined ? updates.smtp_host.trim() : current.smtp_host;
  const smtpPort = updates.smtp_port !== undefined ? parseInt(updates.smtp_port) : current.smtp_port;
  const smtpUser = updates.smtp_user !== undefined ? updates.smtp_user.trim() : current.smtp_user;
  const smtpPass = updates.smtp_pass !== undefined ? updates.smtp_pass.trim() : current.smtp_pass;

  db.prepare(`
    UPDATE ad_system_settings
    SET join_us_enabled = ?,
        whatsapp_otp_enabled = ?,
        whatsapp_notify_enabled = ?,
        whatsapp_provider = ?,
        whatsapp_api_key = ?,
        whatsapp_phone_number_id = ?,
        email_notify_enabled = ?,
        smtp_host = ?,
        smtp_port = ?,
        smtp_user = ?,
        smtp_pass = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(
    joinUsEnabled,
    whatsappOtpEnabled,
    whatsappNotifyEnabled,
    whatsappProvider,
    whatsappApiKey,
    whatsappPhoneId,
    emailNotifyEnabled,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass
  );

  return getAdvertisementSettings();
}

/**
 * Format Followers / Subscribers Text
 * Automatically appends 'Subscribers' for YouTube or 'Followers' for others (e.g. '10000 Followers', '10000 Subscribers')
 */
function formatFollowersText(followers, platform = 'Instagram') {
  if (!followers) return '';
  const trimmed = String(followers).trim();
  if (!trimmed) return '';

  // If already contains follower, subscriber, sub, fan, keep it
  if (/follower|subscriber|sub\b|fan/i.test(trimmed)) {
    return trimmed;
  }

  const isYouTube = String(platform).toLowerCase().includes('youtube');
  const suffix = isYouTube ? 'Subscribers' : 'Followers';

  return `${trimmed} ${suffix}`;
}

/**
 * Get active influencers
 */
function getActiveInfluencers() {
  const rows = db.prepare('SELECT * FROM ad_influencers WHERE is_active = 1 ORDER BY sort_order ASC, name ASC').all();
  return rows.map(r => ({
    ...r,
    followers: formatFollowersText(r.followers, r.platform)
  }));
}

/**
 * Get all influencers (for admin)
 */
function getAllInfluencers() {
  const rows = db.prepare('SELECT * FROM ad_influencers ORDER BY sort_order ASC, id ASC').all();
  return rows.map(r => ({
    ...r,
    followers: formatFollowersText(r.followers, r.platform)
  }));
}

/**
 * Get active promotion types for ND30 Live
 */
function getActivePromotionTypes() {
  return db.prepare("SELECT * FROM ad_promotion_types WHERE partner_type = 'nd30' AND is_active = 1 ORDER BY sort_order ASC, id ASC").all();
}

/**
 * Get all promotion types (for admin)
 */
function getAllPromotionTypes() {
  return db.prepare('SELECT * FROM ad_promotion_types ORDER BY partner_type ASC, sort_order ASC, id ASC').all();
}

/**
 * Generate unique Human-Readable Booking ID (e.g. ND30-AD-202611-1042)
 */
function generateBookingId() {
  const now = new Date();
  const yearMonth = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');
  const countRow = db.prepare('SELECT COUNT(*) as total FROM advertisement_bookings').get();
  const sequence = 1000 + (countRow ? countRow.total + 1 : 1);
  return `ND30-AD-${yearMonth}-${sequence}`;
}

/**
 * Create a new Advertisement Booking
 */
async function createAdvertisementBooking(data) {
  const {
    partnerType,
    influencerId,
    promotionType,
    contactName,
    mobileNumber,
    isMobileVerified,
    email,
    businessName,
    businessDesc,
    villageTown,
    district,
    state,
    pincode
  } = data;

  if (!partnerType) throw new Error('Promotion partner selection is required.');
  if (!contactName || !mobileNumber || !email || !businessName) {
    throw new Error('Contact Name, Mobile, Email and Business Name are required.');
  }
  if (!villageTown || !district || !state || !pincode) {
    throw new Error('Complete business address (Village/Town, District, State, PIN) is required.');
  }

  // Check WhatsApp OTP verification if enabled (bypassed if submitted by authorized promoter)
  const settings = getAdvertisementSettings();
  const isVerified = Boolean(isMobileVerified === 1 || isMobileVerified === '1' || isMobileVerified === true || isMobileVerified === 'true' || data.promoterId || data.promoter_id);
  if (settings.whatsapp_otp_enabled && !isVerified) {
    throw new Error('Please verify your mobile number via WhatsApp OTP before submitting.');
  }

  let finalPromotionType = promotionType;
  let estimatedCharges = 0;
  let influencerName = null;

  if (partnerType === 'influencer') {
    finalPromotionType = 'Promotion Video'; // Fixed rule: Influencer promotions are always Promotion Video
    if (!influencerId) throw new Error('Please select an influencer from the list.');

    const influencer = db.prepare('SELECT * FROM ad_influencers WHERE id = ?').get(influencerId);
    if (!influencer) throw new Error('Selected influencer was not found.');

    influencerName = `${influencer.name} (${influencer.platform})`;
    estimatedCharges = influencer.charge || 0;
  } else {
    // ND30 Live official
    if (!finalPromotionType) finalPromotionType = 'Promotion Video';

    // Find charge from ad_promotion_types
    const promoRow = db.prepare("SELECT * FROM ad_promotion_types WHERE partner_type = 'nd30' AND (title = ? OR title LIKE ?)").get(
      finalPromotionType,
      `%${finalPromotionType}%`
    );

    if (promoRow) {
      estimatedCharges = promoRow.charge;
    } else {
      if (finalPromotionType === 'Promotion Video') estimatedCharges = 5000;
      else if (finalPromotionType === 'Promotion Banner') estimatedCharges = 3000;
      else if (finalPromotionType.toLowerCase().includes('both')) estimatedCharges = 7000;
    }
  }

  // Calculate promoter commission if submitted by/for a promoter
  let finalPromoterId = null;
  let finalPromoterUserId = null;
  let commissionAmount = 0;
  let commissionStatus = 'In Process';

  const rawPromoterId = data.promoterId || data.promoter_id;
  if (rawPromoterId) {
    const pUser = db.prepare("SELECT * FROM users WHERE UPPER(promoter_id) = UPPER(?) AND role = 'promoter'").get(String(rawPromoterId).trim());
    if (pUser) {
      finalPromoterId = pUser.promoter_id;
      finalPromoterUserId = pUser.id;
      const { calculatePromoterCommission } = require('./authService');
      const parsedUser = {
        ...pUser,
        commissionStructure: JSON.parse(pUser.commission_structure || '{}')
      };
      commissionAmount = calculatePromoterCommission(parsedUser, finalPromotionType, partnerType);
    }
  }

  const bookingId = generateBookingId();

  const stmt = db.prepare(`
    INSERT INTO advertisement_bookings (
      booking_id,
      partner_type,
      influencer_id,
      influencer_name,
      promotion_type,
      estimated_charges,
      charges_currency,
      contact_name,
      mobile_number,
      is_mobile_verified,
      email,
      business_name,
      business_desc,
      village_town,
      district,
      state,
      pincode,
      status,
      promoter_id,
      promoter_user_id,
      commission_amount,
      commission_status
    ) VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?)
  `);

  const info = stmt.run(
    bookingId,
    partnerType,
    influencerId || null,
    influencerName,
    finalPromotionType,
    estimatedCharges,
    contactName.trim(),
    mobileNumber.trim(),
    isMobileVerified ? 1 : 0,
    email.trim().toLowerCase(),
    businessName.trim(),
    (businessDesc || '').trim(),
    villageTown.trim(),
    district.trim(),
    state.trim(),
    pincode.trim(),
    finalPromoterId,
    finalPromoterUserId,
    commissionAmount,
    commissionStatus
  );

  const newBooking = db.prepare('SELECT * FROM advertisement_bookings WHERE id = ?').get(info.lastInsertRowid);

  // Send WhatsApp booking confirmation if enabled
  try {
    await sendBookingConfirmationWhatsApp(newBooking);
  } catch (err) {
    console.warn('[WhatsApp Confirmation Notice]:', err.message);
  }

  return newBooking;
}

/**
 * Fetch Bookings with optional status filter
 */
function getAllBookings(statusFilter = '') {
  let query = 'SELECT * FROM advertisement_bookings';
  const params = [];

  if (statusFilter && statusFilter.toLowerCase() !== 'all') {
    query += ' WHERE LOWER(status) = LOWER(?)';
    params.push(statusFilter);
  }

  query += ' ORDER BY created_at DESC, id DESC';
  return db.prepare(query).all(...params);
}

/**
 * Get Booking by ID or Booking ID
 */
function getBookingById(idOrBookingId) {
  return db.prepare('SELECT * FROM advertisement_bookings WHERE id = ? OR booking_id = ?').get(idOrBookingId, idOrBookingId);
}

/**
 * Update Booking Status (Pending, Approved, Rejected, Completed)
 */
async function updateBookingStatus(id, { status, admin_notes }) {
  const existing = db.prepare('SELECT * FROM advertisement_bookings WHERE id = ?').get(id);
  if (!existing) throw new Error('Booking not found.');

  const newStatus = status || existing.status;
  const newNotes = admin_notes !== undefined ? admin_notes : existing.admin_notes;

  // Auto-transition promoter commission status if booking has promoter
  let newCommissionStatus = existing.commission_status;
  if (existing.promoter_id) {
    const sLower = (newStatus || '').toLowerCase();
    if (sLower === 'approved' || sLower === 'completed') {
      if (existing.commission_status !== 'Paid') {
        newCommissionStatus = 'Earned';
      }
    } else if (sLower === 'rejected') {
      newCommissionStatus = 'Rejected';
    }
  }

  db.prepare(`
    UPDATE advertisement_bookings
    SET status = ?,
        admin_notes = ?,
        commission_status = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, newNotes, newCommissionStatus, id);

  const updatedBooking = db.prepare('SELECT * FROM advertisement_bookings WHERE id = ?').get(id);

  // Send WhatsApp Status Alert if changed
  if (newStatus !== existing.status) {
    try {
      await sendStatusUpdateWhatsApp(updatedBooking, newStatus, newNotes);
    } catch (err) {
      console.warn('[WhatsApp Status Notification Warning]:', err.message);
    }
  }

  return updatedBooking;
}

/**
 * Add / Edit / Delete Influencer
 */
function addInfluencer({ name, platform, handle, followers, niche, charge, bio }) {
  const formattedFollowers = formatFollowersText(followers, platform);
  const stmt = db.prepare(`
    INSERT INTO ad_influencers (name, platform, handle, followers, niche, charge, bio, is_active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM ad_influencers))
  `);
  const info = stmt.run(
    name.trim(),
    platform.trim(),
    (handle || '').trim(),
    formattedFollowers,
    (niche || '').trim(),
    parseFloat(charge) || 0,
    (bio || '').trim()
  );
  return db.prepare('SELECT * FROM ad_influencers WHERE id = ?').get(info.lastInsertRowid);
}

function updateInfluencer(id, { name, platform, handle, followers, niche, charge, bio, is_active, sort_order }) {
  const existing = db.prepare('SELECT * FROM ad_influencers WHERE id = ?').get(id);
  if (!existing) throw new Error('Influencer not found.');

  const targetPlatform = platform !== undefined ? platform.trim() : existing.platform;
  const formattedFollowers = followers !== undefined ? formatFollowersText(followers, targetPlatform) : existing.followers;

  db.prepare(`
    UPDATE ad_influencers
    SET name = COALESCE(?, name),
        platform = COALESCE(?, platform),
        handle = COALESCE(?, handle),
        followers = ?,
        niche = COALESCE(?, niche),
        charge = COALESCE(?, charge),
        bio = COALESCE(?, bio),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(
    name !== undefined ? name.trim() : null,
    platform !== undefined ? platform.trim() : null,
    handle !== undefined ? handle.trim() : null,
    formattedFollowers,
    niche !== undefined ? niche.trim() : null,
    charge !== undefined ? parseFloat(charge) : null,
    bio !== undefined ? bio.trim() : null,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    sort_order !== undefined ? parseInt(sort_order) : null,
    id
  );

  return db.prepare('SELECT * FROM ad_influencers WHERE id = ?').get(id);
}

function deleteInfluencer(id) {
  db.prepare('DELETE FROM ad_influencers WHERE id = ?').run(id);
}

/**
 * Add / Edit / Delete Promotion Type
 */
function addPromotionType({ partner_type, title, description, charge }) {
  const stmt = db.prepare(`
    INSERT INTO ad_promotion_types (partner_type, title, description, charge, is_active, sort_order)
    VALUES (?, ?, ?, ?, 1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM ad_promotion_types))
  `);
  const info = stmt.run(
    (partner_type || 'nd30').trim(),
    title.trim(),
    (description || '').trim(),
    parseFloat(charge) || 0
  );
  return db.prepare('SELECT * FROM ad_promotion_types WHERE id = ?').get(info.lastInsertRowid);
}

function updatePromotionType(id, { title, description, charge, is_active, sort_order }) {
  const existing = db.prepare('SELECT * FROM ad_promotion_types WHERE id = ?').get(id);
  if (!existing) throw new Error('Promotion type not found.');

  db.prepare(`
    UPDATE ad_promotion_types
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        charge = COALESCE(?, charge),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(
    title !== undefined ? title.trim() : null,
    description !== undefined ? description.trim() : null,
    charge !== undefined ? parseFloat(charge) : null,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    sort_order !== undefined ? parseInt(sort_order) : null,
    id
  );

  return db.prepare('SELECT * FROM ad_promotion_types WHERE id = ?').get(id);
}

function deletePromotionType(id) {
  db.prepare('DELETE FROM ad_promotion_types WHERE id = ?').run(id);
}

// Upload directory for advertisement slides
const adUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'ads');
try {
  if (!fs.existsSync(adUploadDir)) {
    fs.mkdirSync(adUploadDir, { recursive: true });
  }
} catch (e) {
  // Directory might already exist or sandbox permission
}

const adStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, adUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    cb(null, `ad_slide_${Date.now()}_${cleanBase}${ext}`);
  }
});

const uploadAdSlideImage = multer({
  storage: adStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image format "${ext}". Allowed: JPG, PNG, WEBP, GIF, SVG.`));
    }
  }
}).single('slide_image');

function getAllSlides() {
  try {
    return db.prepare('SELECT * FROM sidebar_slides ORDER BY sort_order ASC, id DESC').all();
  } catch (err) {
    console.error('[getAllSlides Error]', err.message);
    return [];
  }
}

function getActiveSlides() {
  try {
    return db.prepare('SELECT * FROM sidebar_slides WHERE is_active = 1 ORDER BY sort_order ASC, id DESC').all();
  } catch (err) {
    console.error('[getActiveSlides Error]', err.message);
    return [];
  }
}

function getSlideById(id) {
  try {
    return db.prepare('SELECT * FROM sidebar_slides WHERE id = ?').get(id);
  } catch (err) {
    console.error('[getSlideById Error]', err.message);
    return null;
  }
}

function createSlide(data, file) {
  try {
    let imageUrl = data.image_url || '';
    if (file && file.filename) {
      imageUrl = `/uploads/ads/${file.filename}`;
    }
    if (!imageUrl) {
      throw new Error('Please select an image file or enter an image URL.');
    }
    const title = (data.title || '').trim();
    const linkUrl = (data.link_url || '').trim();
    const caption = (data.caption || '').trim();
    const whatsappNumber = (data.whatsapp_number || '').trim().replace(/[^0-9+]/g, '');
    const whatsappMessage = (data.whatsapp_message || '').trim();
    const sortOrder = parseInt(data.sort_order, 10) || 1;
    const isActive = (data.is_active === '1' || data.is_active === 1 || data.is_active === true || data.is_active === 'on') ? 1 : 0;

    const res = db.prepare(`
      INSERT INTO sidebar_slides (title, image_url, link_url, caption, sort_order, is_active, whatsapp_number, whatsapp_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, imageUrl, linkUrl, caption, sortOrder, isActive, whatsappNumber, whatsappMessage);

    return getSlideById(res.lastInsertRowid);
  } catch (err) {
    console.error('[createSlide Error]', err.message);
    throw err;
  }
}

function toggleSlideStatus(id, isActive) {
  try {
    const val = isActive ? 1 : 0;
    db.prepare('UPDATE sidebar_slides SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(val, id);
    return { success: true, is_active: val };
  } catch (err) {
    console.error('[toggleSlideStatus Error]', err.message);
    throw err;
  }
}

function deleteSlide(id) {
  try {
    const slide = getSlideById(id);
    if (slide && slide.image_url && slide.image_url.startsWith('/uploads/ads/')) {
      const full = path.join(__dirname, '..', 'public', slide.image_url);
      if (fs.existsSync(full)) {
        try { fs.unlinkSync(full); } catch (e) {}
      }
    }
    db.prepare('DELETE FROM sidebar_slides WHERE id = ?').run(id);
    return true;
  } catch (err) {
    console.error('[deleteSlide Error]', err.message);
    throw err;
  }
}

module.exports = {
  formatFollowersText,
  getAdvertisementSettings,
  updateAdvertisementSettings,
  getActiveInfluencers,
  getAllInfluencers,
  getActivePromotionTypes,
  getAllPromotionTypes,
  createAdvertisementBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  addInfluencer,
  updateInfluencer,
  deleteInfluencer,
  addPromotionType,
  updatePromotionType,
  deletePromotionType,
  uploadAdSlideImage,
  getAllSlides,
  getActiveSlides,
  getSlideById,
  createSlide,
  toggleSlideStatus,
  deleteSlide
};

