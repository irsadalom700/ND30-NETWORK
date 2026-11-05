/**
 * ND30 LIVE - IFTTT Automation & Webhook Integration Service
 * Handles outbound Maker Webhooks (Telegram, Facebook, X, etc.),
 * inbound webhooks, duplicate prevention, idempotency, retry queues,
 * and loop prevention metadata.
 */

const { db } = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

// In-memory cache for recent idempotency keys (7 days retention in SQLite)
const memoryIdempotencyCache = new Set();

/**
 * Dispatch an HTTP/HTTPS POST request with timeout and error handling
 */
function sendHttpRequest(urlStr, data, headers = {}) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(urlStr);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const postData = typeof data === 'string' ? data : JSON.stringify(data);

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'ND30-LIVE-Automation/1.0',
          ...headers
        },
        timeout: 10000 // 10s timeout
      };

      const req = client.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            body: responseBody
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          statusCode: 408,
          body: 'Request timeout after 10000ms'
        });
      });

      req.on('error', (err) => {
        resolve({
          success: false,
          statusCode: 500,
          body: err.message
        });
      });

      req.write(postData);
      req.end();
    } catch (err) {
      resolve({
        success: false,
        statusCode: 500,
        body: err.message
      });
    }
  });
}

/**
 * Trigger IFTTT Automation for a published article
 * Generates language-specific event:
 * - as -> new_assamese_news
 * - hi -> new_hindi_news
 * - en -> new_english_news
 */
async function triggerArticlePublicationEvent(articleTranslation, baseUrl = 'http://localhost:3000') {
  const conn = db.prepare('SELECT * FROM ifttt_connections WHERE id = 1').get();
  if (!conn || !conn.enabled) {
    console.log('[IFTTT] Integration disabled in settings, skipping outbound trigger.');
    return { skipped: true, reason: 'IFTTT integration is disabled' };
  }

  const langCode = articleTranslation.lang_code;
  const langNameMap = {
    'as': 'Assamese',
    'hi': 'Hindi',
    'en': 'English'
  };
  const eventNameMap = {
    'as': 'new_assamese_news',
    'hi': 'new_hindi_news',
    'en': 'new_english_news'
  };

  const eventName = eventNameMap[langCode] || `new_${langCode}_news`;
  const languageName = langNameMap[langCode] || langCode;

  // Construct absolute article URL
  const catSlug = articleTranslation.category_slug || 'news';
  const subSlug = articleTranslation.subcategory_slug ? `/${articleTranslation.subcategory_slug}` : '';
  const articleUrl = `${baseUrl}/${langCode}/${catSlug}${subSlug}/${articleTranslation.slug}`;

  // Structured Payload according to exact prompt requirement
  const eventId = `ifttt-evt-${uuidv4()}`;
  const idempotencyKey = `idem-${crypto.createHash('sha256').update(`${articleTranslation.article_id}-${langCode}-${articleTranslation.slug}`).digest('hex').slice(0, 24)}`;

  const payload = {
    event: eventName,
    language: languageName,
    headline: articleTranslation.title,
    description: articleTranslation.summary || '',
    article_url: articleUrl,
    category: articleTranslation.category_name || 'News',
    featured_image: articleTranslation.featured_image ? (articleTranslation.featured_image.startsWith('http') ? articleTranslation.featured_image : `${baseUrl}${articleTranslation.featured_image}`) : '',
    published_at: articleTranslation.published_at || new Date().toISOString(),
    source_id: `nd30-${articleTranslation.article_id}`,
    idempotency_key: idempotencyKey,
    // Loop prevention fingerprint
    nd30_origin: true,
    nd30_fingerprint: crypto.createHash('md5').update(articleTranslation.title).digest('hex')
  };

  // Find active rules for this language or global ('all')
  const rules = db.prepare(`
    SELECT * FROM ifttt_automation_rules
    WHERE is_active = 1 AND (lang_code = ? OR lang_code = 'all' OR event_name = ?)
  `).all(langCode, eventName);

  if (rules.length === 0) {
    // If no specific custom rule, check if Maker key is configured
    if (conn.maker_key && conn.maker_key.trim().length > 0) {
      rules.push({
        id: 0,
        rule_name: `Default Maker Dispatch (${eventName})`,
        event_name: eventName,
        target_service: 'ifttt_maker',
        webhook_url: `https://maker.ifttt.com/trigger/${eventName}/with/key/${conn.maker_key.trim()}`
      });
    }
  }

  const results = [];

  for (const rule of rules) {
    const targetUrl = rule.webhook_url || (conn.maker_key ? `https://maker.ifttt.com/trigger/${eventName}/with/key/${conn.maker_key.trim()}` : '');

    if (!targetUrl) {
      continue;
    }

    // Insert log entry in pending status
    const insertLog = db.prepare(`
      INSERT INTO ifttt_event_logs (
        event_id, idempotency_key, direction, event_name, lang_code,
        payload, status, retry_count
      ) VALUES (?, ?, 'outbound', ?, ?, ?, 'pending', 0)
    `);

    try {
      insertLog.run(
        eventId,
        idempotencyKey,
        eventName,
        langCode,
        JSON.stringify(payload)
      );
    } catch (err) {
      // Idempotency duplicate check
      console.warn('[IFTTT] Duplicate outbound event detected, skipping:', err.message);
      continue;
    }

    // Dispatch asynchronous webhook request
    const response = await sendHttpRequest(targetUrl, payload, {
      'X-ND30-Signature': signPayload(payload, conn.webhook_secret),
      'X-Idempotency-Key': idempotencyKey
    });

    const finalStatus = response.success ? 'success' : 'failed';
    const errorMsg = response.success ? null : `HTTP ${response.statusCode}: ${response.body.slice(0, 300)}`;

    // Update log
    db.prepare(`
      UPDATE ifttt_event_logs
      SET status = ?, http_status = ?, response_body = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE event_id = ?
    `).run(finalStatus, response.statusCode, response.body.slice(0, 1000), errorMsg, eventId);

    results.push({
      ruleId: rule.id,
      ruleName: rule.rule_name,
      eventName,
      targetUrl,
      status: finalStatus,
      statusCode: response.statusCode
    });
  }

  return {
    eventId,
    idempotencyKey,
    eventName,
    dispatchedTo: results
  };
}

/**
 * Handle incoming IFTTT Webhook with idempotency and signature verification
 */
async function handleInboundWebhook(reqBody, headers) {
  const conn = db.prepare('SELECT * FROM ifttt_connections WHERE id = 1').get();
  if (!conn || !conn.enabled) {
    return { success: false, status: 403, error: 'IFTTT integration is currently disabled' };
  }

  // 1. Signature / Secret Verification
  const providedSecret = headers['x-ifttt-secret'] || headers['x-webhook-secret'] || reqBody.secret_key;
  const providedSig = headers['x-ifttt-signature'] || headers['x-nd30-signature'];

  let isVerified = false;
  if (providedSecret && providedSecret === conn.webhook_secret) {
    isVerified = true;
  } else if (providedSig && verifySignature(reqBody, providedSig, conn.webhook_secret)) {
    isVerified = true;
  }

  if (!isVerified) {
    return { success: false, status: 401, error: 'Unauthorized: Invalid webhook secret or signature' };
  }

  // 2. Idempotency Check
  const eventId = reqBody.event_id || reqBody.id || `inbound-${uuidv4()}`;
  const idempotencyKey = reqBody.idempotency_key || eventId;

  if (memoryIdempotencyCache.has(idempotencyKey)) {
    return { success: true, status: 200, message: 'Event already processed (in-memory cache)' };
  }

  const existingLog = db.prepare('SELECT id, status FROM ifttt_event_logs WHERE idempotency_key = ?').get(idempotencyKey);
  if (existingLog) {
    return { success: true, status: 200, message: 'Event already processed (idempotent)', logId: existingLog.id };
  }

  // 3. Loop Prevention Check
  if (reqBody.nd30_origin === true || (reqBody.source_id && reqBody.source_id.startsWith('nd30-'))) {
    // Loop prevented
    db.prepare(`
      INSERT INTO ifttt_event_logs (
        event_id, idempotency_key, direction, event_name, lang_code,
        payload, status, http_status, response_body
      ) VALUES (?, ?, 'inbound', ?, ?, ?, 'success', 200, 'Loop prevented: Originated from ND30 Website')
    `).run(eventId, idempotencyKey, reqBody.event || 'loop_prevented', reqBody.language || 'unknown', JSON.stringify(reqBody));

    return {
      success: true,
      status: 200,
      loopPrevented: true,
      message: 'Loop prevented: Event originated from ND30 LIVE website'
    };
  }

  // 4. Log incoming event
  db.prepare(`
    INSERT INTO ifttt_event_logs (
      event_id, idempotency_key, direction, event_name, lang_code,
      payload, status, http_status
    ) VALUES (?, ?, 'inbound', ?, ?, ?, 'success', 200)
  `).run(
    eventId,
    idempotencyKey,
    reqBody.event || 'incoming_custom_event',
    reqBody.language || 'en',
    JSON.stringify(reqBody)
  );

  memoryIdempotencyCache.add(idempotencyKey);

  // 5. If event is a post import (e.g. from Facebook to Website via IFTTT)
  if (reqBody.event === 'import_post' || reqBody.headline || reqBody.text || reqBody.message) {
    const { detectLanguage } = require('./languageDetector');
    const headline = reqBody.headline || reqBody.title || (reqBody.message ? reqBody.message.slice(0, 100) : 'Imported Story');
    const content = reqBody.content || reqBody.message || reqBody.description || '';
    const detection = detectLanguage(`${headline} ${content}`);

    const targetLang = reqBody.language || (detection.isCertain ? detection.language : 'as');

    // Create article cluster
    const clusterId = `nd30-ifttt-${uuidv4().slice(0, 8)}`;
    db.prepare('INSERT INTO articles (id, origin_source, origin_source_id) VALUES (?, ?, ?)').run(
      clusterId,
      'ifttt',
      eventId
    );

    // Find default category
    const defaultCat = db.prepare('SELECT id FROM categories WHERE lang_code = ? LIMIT 1').get(targetLang);

    // Insert draft translation
    const slug = headline.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || `ifttt-${Date.now()}`;

    db.prepare(`
      INSERT INTO article_translations (
        article_id, lang_code, title, slug, summary, content, category_id,
        featured_image, status, author_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'IFTTT Importer')
    `).run(
      clusterId,
      targetLang,
      headline,
      slug,
      reqBody.description || content.slice(0, 200),
      `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`,
      defaultCat?.id || null,
      reqBody.featured_image || reqBody.image_url || '/uploads/nd30_news_banner.jpg'
    );

    return {
      success: true,
      status: 201,
      message: 'Article imported successfully as draft via IFTTT',
      clusterId,
      language: targetLang
    };
  }

  return {
    success: true,
    status: 200,
    message: 'IFTTT event received and logged successfully'
  };
}

/**
 * Retry a failed event
 */
async function retryFailedEvent(eventId) {
  const log = db.prepare('SELECT * FROM ifttt_event_logs WHERE event_id = ?').get(eventId);
  if (!log) {
    throw new Error('Event log not found');
  }

  const payload = JSON.parse(log.payload);
  const conn = db.prepare('SELECT * FROM ifttt_connections WHERE id = 1').get();

  let targetUrl = '';
  // Check if rule matches
  const rule = db.prepare('SELECT webhook_url FROM ifttt_automation_rules WHERE event_name = ? LIMIT 1').get(log.event_name);
  if (rule && rule.webhook_url) {
    targetUrl = rule.webhook_url;
  } else if (conn.maker_key) {
    targetUrl = `https://maker.ifttt.com/trigger/${log.event_name}/with/key/${conn.maker_key.trim()}`;
  }

  if (!targetUrl) {
    throw new Error('No target webhook URL available for retry');
  }

  // Update retry count
  const newRetryCount = (log.retry_count || 0) + 1;
  db.prepare(`
    UPDATE ifttt_event_logs
    SET status = 'retrying', retry_count = ?, updated_at = CURRENT_TIMESTAMP
    WHERE event_id = ?
  `).run(newRetryCount, eventId);

  // Send request
  const response = await sendHttpRequest(targetUrl, payload, {
    'X-ND30-Signature': signPayload(payload, conn.webhook_secret),
    'X-Idempotency-Key': log.idempotency_key
  });

  const finalStatus = response.success ? 'success' : 'failed';
  const errorMsg = response.success ? null : `HTTP ${response.statusCode}: ${response.body.slice(0, 300)}`;

  db.prepare(`
    UPDATE ifttt_event_logs
    SET status = ?, http_status = ?, response_body = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
    WHERE event_id = ?
  `).run(finalStatus, response.statusCode, response.body.slice(0, 1000), errorMsg, eventId);

  return {
    success: response.success,
    statusCode: response.statusCode,
    retryCount: newRetryCount,
    status: finalStatus
  };
}

/**
 * HMAC-SHA256 signature generator & validator
 */
function signPayload(payload, secret) {
  const content = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret || 'nd30_default_sec').update(content).digest('hex');
}

function verifySignature(payload, signature, secret) {
  const expected = signPayload(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

module.exports = {
  triggerArticlePublicationEvent,
  handleInboundWebhook,
  retryFailedEvent,
  signPayload
};
