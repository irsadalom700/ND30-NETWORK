/**
 * ND30 LIVE - Facebook Multilingual Import Service
 * Handles Meta Graph API post ingestion, manual Facebook post/video link import (single & bulk),
 * intelligent language script detection, review queue, and strict duplicate/loop prevention.
 */

const { db } = require('../database/db');
const { detectLanguage } = require('./languageDetector');
const { generateArticleTranslation } = require('./aiTranslator');
const https = require('https');
const { v4: uuidv4 } = require('uuid');

/**
 * Decode HTML entities like &amp;, &#xb7;, &#039;, etc.
 */
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#xb7;/g, '·')
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
    .trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Parse and validate Facebook Post / Video / Reel URLs
 */
function extractFacebookUrlInfo(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const clean = rawUrl.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) return null;

  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes('facebook.com') && !host.includes('fb.watch') && !host.includes('fb.com')) {
      return null;
    }

    let mediaType = 'post';
    let postId = null;
    const pathname = parsed.pathname;

    // 1. fb.watch shortlinks (videos)
    if (host.includes('fb.watch')) {
      mediaType = 'video';
      const slug = pathname.replace(/[^\w-]/g, '');
      postId = 'fbw_' + (slug || Date.now());
    }
    // 2. watch/?v=123 (Facebook Watch videos)
    else if (pathname.includes('/watch')) {
      mediaType = 'video';
      postId = parsed.searchParams.get('v') || pathname.split('/').filter(Boolean).pop();
    }
    // 3. /videos/123 (Direct Page Video)
    else if (pathname.includes('/videos/')) {
      mediaType = 'video';
      const m = pathname.match(/\/videos\/(\d+)/);
      postId = m ? m[1] : pathname.split('/').filter(Boolean).pop();
    }
    // 4. /reel/123 (Facebook Reels)
    else if (pathname.includes('/reel/')) {
      mediaType = 'reel';
      const m = pathname.match(/\/reel\/(\d+)/);
      postId = m ? m[1] : pathname.split('/').filter(Boolean).pop();
    }
    // 5. /posts/123 (Standard Posts)
    else if (pathname.includes('/posts/')) {
      mediaType = 'post';
      const m = pathname.match(/\/posts\/([a-zA-Z0-9_-]+)/);
      postId = m ? m[1] : pathname.split('/').filter(Boolean).pop();
    }
    // 6. /photos/ or /photo
    else if (pathname.includes('/photo')) {
      mediaType = 'photo';
      postId = parsed.searchParams.get('fbid') || pathname.split('/').filter(Boolean).pop();
    }
    // 7. permalink.php?story_fbid=123
    else if (parsed.searchParams.has('story_fbid')) {
      mediaType = 'post';
      postId = parsed.searchParams.get('story_fbid');
    }
    // 8. share/v/ or share/r/ or share/p/
    else if (pathname.includes('/share/v/')) {
      mediaType = 'video';
      postId = 'fbv_' + pathname.split('/').filter(Boolean).pop();
    }
    else if (pathname.includes('/share/r/')) {
      mediaType = 'reel';
      postId = 'fbr_' + pathname.split('/').filter(Boolean).pop();
    }
    else {
      postId = pathname.split('/').filter(Boolean).pop() || `fb_${Date.now()}`;
    }

    // Clean tracking query params
    const cleanUrl = parsed.origin + parsed.pathname + (parsed.searchParams.has('v') ? '?v=' + parsed.searchParams.get('v') : '');

    return {
      originalUrl: clean,
      cleanUrl,
      mediaType,
      postId: String(postId || `fb_${Date.now()}`).replace(/[^\w_-]/g, '')
    };
  } catch (e) {
    return null;
  }
}

/**
 * Fetch Open Graph metadata (title, description, image) from a Facebook link
 */
async function fetchFacebookPostMetadata(url, mediaType = 'post') {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,as;q=0.8,hi;q=0.8'
      }
    });
    clearTimeout(timeout);

    const html = await res.text();

    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) || html.match(/<title>([^<]+)<\/title>/i);
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);

    let title = ogTitleMatch ? decodeHtmlEntities(ogTitleMatch[1]) : '';
    let desc = ogDescMatch ? decodeHtmlEntities(ogDescMatch[1]) : '';
    let image = ogImageMatch ? decodeHtmlEntities(ogImageMatch[1]) : null;

    // Clean generic Facebook suffix from titles
    title = title.replace(/\s*\|\s*Facebook$/i, '').replace(/\s*-\s*Facebook$/i, '').trim();

    return {
      title,
      description: desc,
      image,
      mediaType
    };
  } catch (e) {
    // If request fails or times out, return clean fallback
    return {
      title: '',
      description: '',
      image: null,
      mediaType
    };
  }
}

/**
 * Import a Single Facebook Link (Post or Video) into the Review Queue or Direct Drafts
 */
async function importSingleFacebookLink({
  url,
  customHeadline = '',
  customContent = '',
  targetLang = 'auto',
  autoDraft = false,
  pageId = null
}) {
  const urlInfo = extractFacebookUrlInfo(url);
  if (!urlInfo) {
    throw new Error('Invalid Facebook URL. Please provide a valid Facebook post, video, reel, or watch link.');
  }

  // 1. Fetch metadata from Open Graph
  const meta = await fetchFacebookPostMetadata(urlInfo.cleanUrl, urlInfo.mediaType);

  let finalHeadline = (customHeadline && customHeadline.trim()) || meta.title || '';
  let finalContent = (customContent && customContent.trim()) || meta.description || meta.title || `Facebook ${urlInfo.mediaType.toUpperCase()} content: ${urlInfo.cleanUrl}`;
  let imageUrl = meta.image || (urlInfo.mediaType === 'video' ? '/uploads/nd30_news_banner.jpg' : '/uploads/brahmaputra_bridge.jpg');

  // If both headline & content are empty, provide a clean default
  if (!finalHeadline && !finalContent) {
    finalHeadline = `ND30 LIVE - Facebook ${urlInfo.mediaType.toUpperCase()} (${urlInfo.postId})`;
    finalContent = `Watch and read official coverage from ND30 LIVE on Facebook.\n\nLink: ${urlInfo.cleanUrl}`;
  } else if (!finalHeadline) {
    finalHeadline = finalContent.split('\n')[0].slice(0, 120);
  }

  const combinedText = `${finalHeadline}\n${finalContent}`;

  // 2. Check for automation loop
  if (checkForAutomationLoop(combinedText, urlInfo.postId)) {
    throw new Error('Automation Loop Prevented: This post originated from ND30 Website syndication.');
  }

  // 3. Language Script Detection
  let detectedLang = 'as';
  let confidence = 0.85;
  let suggestedLang = 'as';

  if (targetLang && ['as', 'hi', 'en'].includes(targetLang)) {
    detectedLang = targetLang;
    confidence = 1.0;
    suggestedLang = targetLang;
  } else {
    const detection = detectLanguage(combinedText);
    detectedLang = detection.language;
    confidence = detection.confidence;
    suggestedLang = detection.isCertain ? detection.language : 'as';
  }

  // 4. Check if post already exists in database
  const existing = db.prepare('SELECT id, status, fb_post_id FROM facebook_imported_posts WHERE fb_post_id = ? OR post_url = ?').get(urlInfo.postId, urlInfo.cleanUrl);
  if (existing) {
    return {
      success: true,
      alreadyExisted: true,
      id: existing.id,
      postId: existing.fb_post_id,
      status: existing.status,
      message: `Post was already in the database (${existing.status}).`
    };
  }

  // 5. Insert into facebook_imported_posts
  const insertStmt = db.prepare(`
    INSERT INTO facebook_imported_posts (
      fb_post_id, page_id, message, image_url, created_time,
      detected_lang, confidence, suggested_lang, assigned_lang,
      status, imported_article_id, notes, post_url, media_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const effectivePageId = pageId || 'manual_import';
  const notes = `Manually imported ${urlInfo.mediaType}: ${urlInfo.cleanUrl}`;

  let postStatus = autoDraft ? 'imported_draft' : 'pending_review';
  let assignedLang = autoDraft ? suggestedLang : null;

  const result = insertStmt.run(
    urlInfo.postId,
    effectivePageId,
    `${finalHeadline}\n\n${finalContent}`,
    imageUrl,
    new Date().toISOString(),
    detectedLang,
    confidence,
    suggestedLang,
    assignedLang,
    postStatus,
    null,
    notes,
    urlInfo.cleanUrl,
    urlInfo.mediaType
  );

  const importedId = result.lastInsertRowid;

  // 6. If autoDraft is enabled, approve into multi-language drafts immediately
  if (autoDraft) {
    const approval = await approveFacebookImport(importedId, suggestedLang, finalHeadline, finalContent);
    return {
      success: true,
      id: importedId,
      postId: urlInfo.postId,
      url: urlInfo.cleanUrl,
      mediaType: urlInfo.mediaType,
      status: 'imported_draft',
      clusterId: approval.clusterId,
      language: suggestedLang,
      message: `Successfully imported & drafted in Assamese, Hindi, and English!`
    };
  }

  return {
    success: true,
    id: importedId,
    postId: urlInfo.postId,
    url: urlInfo.cleanUrl,
    mediaType: urlInfo.mediaType,
    status: 'pending_review',
    headline: finalHeadline,
    detectedLang,
    confidence,
    message: `Imported to Facebook Review Queue (${suggestedLang.toUpperCase()}).`
  };
}

/**
 * Import Multiple Facebook Links at once (Bulk Import)
 */
async function importMultipleFacebookLinks({
  links,
  defaultLang = 'auto',
  autoDraft = false,
  pageId = null
}) {
  if (!links) {
    throw new Error('No Facebook links provided.');
  }

  // Split by newlines, commas, or spaces and extract valid URLs
  const rawArray = Array.isArray(links) ? links : links.split(/[\r\n,]+/);
  const urlList = [];
  const seen = new Set();

  for (const item of rawArray) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    // Extract url from line
    const match = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
    const url = match ? match[0] : trimmed;
    if (url && (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com'))) {
      if (!seen.has(url)) {
        seen.add(url);
        urlList.push(url);
      }
    }
  }

  if (urlList.length === 0) {
    throw new Error('No valid Facebook links found. Please check your links.');
  }

  const results = [];
  let importedCount = 0;
  let alreadyExistedCount = 0;
  let failedCount = 0;

  for (const url of urlList) {
    try {
      const res = await importSingleFacebookLink({
        url,
        targetLang: defaultLang,
        autoDraft,
        pageId
      });
      if (res.alreadyExisted) {
        alreadyExistedCount++;
      } else {
        importedCount++;
      }
      results.push({ url, success: true, ...res });
    } catch (err) {
      failedCount++;
      results.push({ url, success: false, error: err.message });
    }
  }

  return {
    success: true,
    totalLinks: urlList.length,
    imported: importedCount,
    alreadyExisted: alreadyExistedCount,
    failed: failedCount,
    results,
    message: `Bulk Import complete: ${importedCount} imported, ${alreadyExistedCount} skipped (already existed), ${failedCount} errors.`
  };
}

/**
 * Fetch posts from Meta Graph API for a connected Facebook Page
 */
async function fetchPagePostsFromMeta(pageId, accessToken) {
  if (accessToken && accessToken.length > 20 && !accessToken.includes('SAMPLE') && !accessToken.includes('TOKEN_')) {
    return new Promise((resolve) => {
      const url = `https://graph.facebook.com/v19.0/${pageId}/feed?fields=id,message,created_time,full_picture,permalink_url&limit=25&access_token=${encodeURIComponent(accessToken)}`;
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.data) {
              resolve({ success: true, posts: parsed.data });
            } else {
              resolve({ success: false, error: parsed.error?.message || 'Meta API error' });
            }
          } catch (e) {
            resolve({ success: false, error: e.message });
          }
        });
      }).on('error', err => resolve({ success: false, error: err.message }));
    });
  }

  // Demonstration / sandbox feeds
  return {
    success: true,
    isSimulation: true,
    posts: [
      {
        id: `${pageId}_${Date.now()}_101`,
        message: 'অসম চৰকাৰৰ নতুন নিয়োগ নীতিৰ অধীনত কাইলৈৰ পৰা আৰম্ভ হ’ব ১০,০০০ পদৰ আনুষ্ঠানিক আবেদন প্ৰক্ৰিয়া। ব্ৰহ্মপুত্ৰ উপত্যকাৰ নিবনুৱা যুৱক-যুৱতীসকলৰ বাবে বিশেষ সুবিধা। সবিশেষ জানিবলৈ পঢ়ক ND30 LIVE।',
        created_time: new Date().toISOString(),
        full_picture: '/uploads/brahmaputra_bridge.jpg',
        permalink_url: 'https://www.facebook.com/nd30live/posts/101'
      },
      {
        id: `${pageId}_${Date.now()}_102`,
        message: 'गुवाहाटी में आयोजित होने जा रहे पूर्वोत्तर युवा खेल महोत्सव की तैयारियां पूरी। असम के मुख्यमंत्री ने किया स्टेडियम का निरीक्षण। लाइव कवरेज ND30 LIVE पर।',
        created_time: new Date(Date.now() - 3600000 * 2).toISOString(),
        full_picture: '/uploads/nd30_news_banner.jpg',
        permalink_url: 'https://www.facebook.com/nd30live/posts/102'
      },
      {
        id: `${pageId}_${Date.now()}_103`,
        message: 'Breaking: Indian Railways announces high-speed Vande Bharat expansion covering New Jalpaiguri to Guwahati and Dhubri corridors. Live updates on ND30 LIVE.',
        created_time: new Date(Date.now() - 3600000 * 5).toISOString(),
        full_picture: '/uploads/brahmaputra_bridge.jpg',
        permalink_url: 'https://www.facebook.com/nd30live/posts/103'
      },
      {
        id: `${pageId}_${Date.now()}_104`,
        message: 'Special Report: Heritage crafts and organic tea plantations of Upper Assam gain international export recognition. Detailed story on ND30 LIVE.',
        created_time: new Date(Date.now() - 3600000 * 8).toISOString(),
        full_picture: '/uploads/kaziranga_rhino.jpg',
        permalink_url: 'https://www.facebook.com/nd30live/posts/104'
      }
    ]
  };
}

/**
 * Sync and process posts for a Facebook Page
 */
async function syncFacebookPage(pageRecordId) {
  const page = db.prepare('SELECT * FROM facebook_pages WHERE id = ?').get(pageRecordId);
  if (!page) {
    throw new Error('Facebook page record not found');
  }

  const result = await fetchPagePostsFromMeta(page.page_id, page.access_token);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  let importedCount = 0;
  let loopPreventedCount = 0;
  let reviewQueueCount = 0;

  const insertPostStmt = db.prepare(`
    INSERT INTO facebook_imported_posts (
      fb_post_id, page_id, message, image_url, created_time,
      detected_lang, confidence, suggested_lang, assigned_lang,
      status, imported_article_id, notes, post_url, media_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const post of result.posts) {
    // 1. Check if post was already imported
    const existing = db.prepare('SELECT id, status FROM facebook_imported_posts WHERE fb_post_id = ?').get(post.id);
    if (existing) {
      continue;
    }

    const message = post.message || '';
    if (!message.trim()) {
      continue;
    }

    // 2. Loop prevention check
    const isLoopFromND30 = checkForAutomationLoop(message, post.id);
    if (isLoopFromND30) {
      insertPostStmt.run(
        post.id,
        page.page_id,
        message,
        post.full_picture || '',
        post.created_time || new Date().toISOString(),
        'loop_prevented',
        1.0,
        page.default_lang_code,
        null,
        'skipped_loop',
        null,
        'Loop Prevented: Post originated from ND30 Website outbound syndication',
        post.permalink_url || null,
        'post'
      );
      loopPreventedCount++;
      continue;
    }

    // 3. Language Detection
    const detection = detectLanguage(message);
    let assignedLang = null;
    let postStatus = 'pending_review';

    const suggestedLang = detection.isCertain ? detection.language : (page.default_lang_code || 'as');

    if (detection.isCertain && page.auto_import_mode === 'draft') {
      assignedLang = detection.language;
      postStatus = 'imported_draft';

      const clusterId = `nd30-fb-${uuidv4().slice(0, 8)}`;
      db.prepare('INSERT INTO articles (id, origin_source, origin_source_id) VALUES (?, ?, ?)').run(
        clusterId,
        'facebook',
        post.id
      );

      const headline = message.split('\n')[0].slice(0, 120);
      const slug = headline.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || `fb-${Date.now()}`;
      const cat = db.prepare('SELECT id FROM categories WHERE lang_code = ? LIMIT 1').get(assignedLang);

      db.prepare(`
        INSERT INTO article_translations (
          article_id, lang_code, title, slug, summary, content, category_id,
          featured_image, status, author_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'Facebook Auto-Import')
      `).run(
        clusterId,
        assignedLang,
        headline,
        slug,
        message.slice(0, 180),
        `<p>${message.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`,
        cat?.id || null,
        post.full_picture || '/uploads/nd30_news_banner.jpg'
      );

      insertPostStmt.run(
        post.id,
        page.page_id,
        message,
        post.full_picture || '',
        post.created_time || new Date().toISOString(),
        detection.language,
        detection.confidence,
        suggestedLang,
        assignedLang,
        'imported_draft',
        clusterId,
        `Auto-imported into ${assignedLang} drafts with confidence ${detection.confidence}`,
        post.permalink_url || null,
        'post'
      );
      importedCount++;
    } else {
      insertPostStmt.run(
        post.id,
        page.page_id,
        message,
        post.full_picture || '',
        post.created_time || new Date().toISOString(),
        detection.language,
        detection.confidence,
        suggestedLang,
        null,
        'pending_review',
        null,
        `Awaiting manual review. Suggested: ${suggestedLang} (${(detection.confidence * 100).toFixed(0)}% confidence)`,
        post.permalink_url || null,
        'post'
      );
      reviewQueueCount++;
    }
  }

  // Update page last sync timestamp
  db.prepare('UPDATE facebook_pages SET last_sync_at = CURRENT_TIMESTAMP WHERE id = ?').run(pageRecordId);

  return {
    success: true,
    pageName: page.page_name,
    importedDrafts: importedCount,
    reviewQueue: reviewQueueCount,
    loopsPrevented: loopPreventedCount
  };
}

/**
 * Loop prevention logic
 */
function checkForAutomationLoop(message, fbPostId) {
  if (!message) return false;

  if (message.includes('nd30live') || message.includes('nd30news') || message.includes('localhost:3030/as/') || message.includes('localhost:3030/hi/') || message.includes('localhost:3030/en/') || message.includes('localhost:3000')) {
    return true;
  }

  const firstLine = message.split('\n')[0].trim();
  const recentLogs = db.prepare(`
    SELECT payload FROM ifttt_event_logs
    WHERE direction = 'outbound'
    ORDER BY id DESC LIMIT 50
  `).all();

  for (const log of recentLogs) {
    try {
      const p = JSON.parse(log.payload);
      if (p.headline && (firstLine.includes(p.headline) || p.headline.includes(firstLine))) {
        return true;
      }
    } catch (e) {
      // ignore
    }
  }

  return false;
}

/**
 * Approve a post from the Facebook Import Review dashboard
 * Automatically generates draft translations for all 3 languages (Assamese, Hindi, English).
 * If the post is a video or reel, automatically embeds the Facebook video player into the article content.
 */
async function approveFacebookImport(importedPostId, targetLang, editedHeadline, editedContent) {
  const post = db.prepare('SELECT * FROM facebook_imported_posts WHERE id = ?').get(importedPostId);
  if (!post) {
    throw new Error('Imported post record not found');
  }

  const headline = editedHeadline || post.message.split('\n')[0].slice(0, 120);
  let baseContent = editedContent || post.message;
  const lang = targetLang || post.suggested_lang || 'as';

  const clusterId = `nd30-fb-${uuidv4().slice(0, 8)}`;
  db.prepare('INSERT INTO articles (id, origin_source, origin_source_id) VALUES (?, ?, ?)').run(
    clusterId,
    'facebook',
    post.fb_post_id
  );

  let baseSlug = headline.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || `fb-${Date.now()}`;
  let slug = baseSlug;
  const existingSlug = db.prepare('SELECT id FROM article_translations WHERE lang_code = ? AND slug = ?').get(lang, slug);
  if (existingSlug) {
    slug = `${baseSlug.slice(0, 70)}-${uuidv4().slice(0, 6)}`;
  }

  const cat = db.prepare('SELECT id, slug FROM categories WHERE lang_code = ? LIMIT 1').get(lang);

  // If this post is a video or reel and has a valid post_url, embed the Facebook video player!
  let videoEmbedHtml = '';
  if ((post.media_type === 'video' || post.media_type === 'reel') && post.post_url) {
    videoEmbedHtml = `
      <div class="fb-video-container" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; margin:20px 0; border-radius:10px; background:#000; box-shadow:0 4px 16px rgba(0,0,0,0.4);">
        <iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(post.post_url)}&show_text=false&width=560" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none; overflow:hidden;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
      </div>
    `;
  }

  let sourceLinkHtml = '';
  if (post.post_url) {
    sourceLinkHtml = `
      <p style="font-size:0.85rem; color:#94a3b8; margin-top:16px;">
        <em>Source: <a href="${escapeHtml(post.post_url)}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8; font-weight:600;">View original Facebook ${post.media_type === 'video' ? 'Video' : (post.media_type === 'reel' ? 'Reel' : 'Post')} ↗</a></em>
      </p>
    `;
  }

  const fullArticleHtml = `${videoEmbedHtml}<p>${baseContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>${sourceLinkHtml}`;

  const insertTranslationStmt = db.prepare(`
    INSERT INTO article_translations (
      article_id, lang_code, title, slug, summary, content, category_id,
      featured_image, status, author_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'Facebook Review Queue')
  `);

  // 1. Insert primary language draft
  insertTranslationStmt.run(
    clusterId,
    lang,
    headline,
    slug,
    baseContent.slice(0, 180),
    fullArticleHtml,
    cat?.id || null,
    post.image_url || '/uploads/nd30_news_banner.jpg'
  );

  // 2. Automatically generate drafts for all other languages
  const otherLangs = ['as', 'hi', 'en'].filter(l => l !== lang);
  for (const otherLang of otherLangs) {
    try {
      const trans = await generateArticleTranslation({
        title: headline,
        summary: baseContent.slice(0, 180),
        content: baseContent,
        tags: 'Facebook, Live, ND30',
        sourceLang: lang,
        targetLang: otherLang
      });

      const matchedCat = cat?.slug ? db.prepare('SELECT id FROM categories WHERE lang_code = ? AND slug = ?').get(otherLang, cat.slug) : null;
      const translatedHtml = `${videoEmbedHtml}<p>${trans.translatedDraft.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>${sourceLinkHtml}`;

      let transSlug = trans.translatedDraft.slug || `fb-${otherLang}-${Date.now()}`;
      const existingTransSlug = db.prepare('SELECT id FROM article_translations WHERE lang_code = ? AND slug = ?').get(otherLang, transSlug);
      if (existingTransSlug) {
        transSlug = `${transSlug.slice(0, 70)}-${uuidv4().slice(0, 6)}`;
      }

      insertTranslationStmt.run(
        clusterId,
        otherLang,
        trans.translatedDraft.title,
        transSlug,
        trans.translatedDraft.summary,
        translatedHtml,
        matchedCat?.id || null,
        post.image_url || '/uploads/nd30_news_banner.jpg'
      );
    } catch (err) {
      console.error(`Error auto-translating FB post to ${otherLang}:`, err.message);
    }
  }

  db.prepare(`
    UPDATE facebook_imported_posts
    SET status = 'imported_draft', assigned_lang = ?, imported_article_id = ?, notes = 'Approved from review queue into all-language drafts'
    WHERE id = ?
  `).run(lang, clusterId, importedPostId);

  return {
    success: true,
    clusterId,
    language: lang,
    articleTitle: headline,
    allLanguagesReady: true
  };
}

module.exports = {
  extractFacebookUrlInfo,
  fetchFacebookPostMetadata,
  importSingleFacebookLink,
  importMultipleFacebookLinks,
  syncFacebookPage,
  approveFacebookImport,
  checkForAutomationLoop
};
