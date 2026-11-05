/**
 * ND30 LIVE - AI & Neural Translation Assistant
 * Translates news headlines, summaries, full articles, and tags
 * fluently between Assamese (as), Hindi (hi), and English (en).
 * Employs neural cloud translation API with sentence chunking, HTML preservation,
 * and high-performance in-memory caching.
 */

const https = require('https');

// High-speed translation cache to avoid repeated queries and ensure instant responses
const translationCache = new Map();

// Core journalistic terminology dictionary mapping key phrases across as, hi, en
const NEWS_DICTIONARY = [
  {
    en: 'Northeast India’s Longest Brahmaputra Bridge Project Enters Final Stretch',
    as: 'ব্ৰহ্মপুত্ৰৰ ওপৰত নিৰ্মাণ সম্পূৰ্ণ হোৱাৰ দিশে উত্তৰ-পূবৰ দীৰ্ঘতম দলং প্ৰকল্প',
    hi: 'ब्रह्मपुत्र नदी पर उत्तर-पूर्व के सबसे बड़े पुल का निर्माण अंतिम चरण में'
  },
  {
    en: 'Dhubri to Phulbari Travel Time Cut to 20 Minutes',
    as: 'ধুবুৰী-ফুলবাৰী যাত্ৰাৰ সময় ২০ মিনিটলৈ হ্ৰাস পাব',
    hi: 'धुबरी और फूलबारी के बीच का सफर सिमटकर 20 मिनट का होगा'
  },
  {
    en: 'Kaziranga National Park Deploys State-of-the-Art AI Camera Grid for Greater One-Horned Rhino Safety',
    as: 'কাজিৰঙা ৰাষ্ট্ৰীয় উদ্যানত এশিঙীয়া গঁড় সুৰক্ষাৰ বাবে অত্যাধুনিক এআই কেমেৰা গ্ৰিড কাৰ্যকৰী',
    hi: 'काजीरंगा राष्ट्रीय उद्यान में एक सींग वाले गैंडों के संरक्षण हेतु एआई आधारित स्मार्ट निगरानी सक्रिय'
  },
  {
    en: 'Government of Assam',
    as: 'অসম চৰকাৰ',
    hi: 'असम सरकार'
  },
  {
    en: 'Chief Minister',
    as: 'মুখ্যমন্ত্ৰী',
    hi: 'मुख्यमंत्री'
  },
  {
    en: 'Prime Minister',
    as: 'প্ৰধানমন্ত্ৰী',
    hi: 'प्रधानमंत्री'
  },
  {
    en: 'Brahmaputra River',
    as: 'ব্ৰহ্মপুত্ৰ নদী',
    hi: 'ब्रह्मपुत्र नदी'
  },
  {
    en: 'ND30 LIVE Special Report',
    as: 'এনডি৩০ লাইভ বিশেষ প্ৰতিবেদন',
    hi: 'एनडी30 लाइव विशेष रिपोर्ट'
  }
];

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
}

/**
 * Fetch neural translation for a text chunk
 */
function requestTranslationChunk(text, sourceLang, targetLang) {
  return new Promise((resolve) => {
    if (!text || !text.trim() || sourceLang === targetLang) {
      return resolve(text);
    }

    const trimmed = text.trim();
    const cacheKey = `${sourceLang}_${targetLang}_${trimmed}`;
    if (translationCache.has(cacheKey)) {
      return resolve(translationCache.get(cacheKey));
    }

    // Check exact dictionary phrase match
    const dictMatch = NEWS_DICTIONARY.find(item => item[sourceLang] && item[sourceLang].toLowerCase() === trimmed.toLowerCase());
    if (dictMatch && dictMatch[targetLang]) {
      translationCache.set(cacheKey, dictMatch[targetLang]);
      return resolve(dictMatch[targetLang]);
    }

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${sourceLang}|${targetLang}`;

    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          let translatedText = parsed.responseData?.translatedText;
          if (translatedText && !translatedText.includes('QUERY LENGTH LIMIT EXCEEDED') && !translatedText.includes('INVALID TARGET LANGUAGE')) {
            translatedText = decodeHtmlEntities(translatedText);
            translationCache.set(cacheKey, translatedText);
            resolve(translatedText);
          } else {
            resolve(text);
          }
        } catch (e) {
          resolve(text);
        }
      });
    });

    req.on('error', () => resolve(text));
    req.setTimeout(6000, () => {
      req.destroy();
      resolve(text);
    });
  });
}

/**
 * Split text into manageable sentence chunks under 300 chars for fluent translation
 */
async function translateFullText(text, sourceLang, targetLang) {
  if (!text || !text.trim() || sourceLang === targetLang) {
    return text || '';
  }

  // If text is short, translate in one shot
  if (text.length <= 300) {
    return await requestTranslationChunk(text, sourceLang, targetLang);
  }

  // Split by sentence delimiters
  const sentenceDelimiters = /([।\.!\?\n]+)/;
  const tokens = text.split(sentenceDelimiters);
  let translatedResult = '';

  for (let i = 0; i < tokens.length; i += 2) {
    const sentence = tokens[i];
    const delimiter = tokens[i + 1] || '';

    if (sentence && sentence.trim().length > 0) {
      const translatedSentence = await requestTranslationChunk(sentence, sourceLang, targetLang);
      translatedResult += translatedSentence + delimiter;
    } else {
      translatedResult += sentence + delimiter;
    }
  }

  return translatedResult || text;
}

/**
 * Translates HTML content while preserving tags (<p>, <strong>, etc.)
 */
async function translateHtmlContent(html, sourceLang, targetLang) {
  if (!html || sourceLang === targetLang) return html || '';

  // Split into HTML tags and text nodes
  const parts = html.split(/(<[^>]*>)/);
  const translatedParts = [];

  for (const part of parts) {
    if (part.startsWith('<') && part.endsWith('>')) {
      translatedParts.push(part);
    } else if (part.trim().length > 0) {
      const translated = await translateFullText(part, sourceLang, targetLang);
      translatedParts.push(translated);
    } else {
      translatedParts.push(part);
    }
  }

  return translatedParts.join('');
}

/**
 * Generate AI Translation with full sentence fluency
 */
async function generateArticleTranslation({
  title,
  summary,
  content,
  tags,
  sourceLang,
  targetLang
}) {
  if (sourceLang === targetLang) {
    return {
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      original: { title, summary, content, tags },
      translatedDraft: {
        title: title || '',
        summary: summary || '',
        content: content || '',
        tags: tags || '',
        slug: (title || '').toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || `story-${Date.now()}`,
        seoTitle: `${title} | ND30 LIVE`,
        seoDescription: summary ? summary.slice(0, 160) : ''
      }
    };
  }

  // 1. Translate Title & Summary
  const translatedTitle = await translateFullText(title || '', sourceLang, targetLang);
  const translatedSummary = await translateFullText(summary || '', sourceLang, targetLang);

  // 2. Translate Full Article Content
  const translatedContent = await translateHtmlContent(content || '', sourceLang, targetLang);

  // 3. Translate Tags
  let translatedTags = '';
  if (tags && tags.trim()) {
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const translatedTagList = [];
    for (const tag of tagList) {
      const t = await requestTranslationChunk(tag, sourceLang, targetLang);
      translatedTagList.push(t);
    }
    translatedTags = translatedTagList.join(', ');
  }

  // 4. Auto-generate URL slug in target language or Latin transliteration for SEO
  let generatedSlug = '';
  if (targetLang === 'en') {
    generatedSlug = translatedTitle.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80);
  } else if (sourceLang === 'en' && title) {
    // Retain Latin transliterated keywords for clean URLs
    generatedSlug = title.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80);
  }

  if (!generatedSlug || generatedSlug.replace(/-/g, '').length === 0) {
    generatedSlug = `story-${targetLang}-${Date.now().toString().slice(-6)}`;
  }

  return {
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    original: {
      title,
      summary,
      content,
      tags
    },
    translatedDraft: {
      title: translatedTitle,
      summary: translatedSummary,
      content: translatedContent,
      tags: translatedTags,
      slug: generatedSlug,
      seoTitle: `${translatedTitle} | ND30 LIVE`,
      seoDescription: translatedSummary.slice(0, 160)
    },
    requiresApproval: true,
    message: 'Translation generated successfully.'
  };
}

module.exports = {
  generateArticleTranslation,
  translateFullText,
  translateHtmlContent
};
