/**
 * ND30 LIVE - Language Detector
 * Accurately detects Assamese (as), Hindi (hi), and English (en)
 * Analyzes unicode character ranges, unique Assamese glyphs (ৰ, ৱ),
 * Devanagari script, and distinctive linguistic vocabulary.
 */

function detectLanguage(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      language: 'unknown',
      confidence: 0,
      isCertain: false,
      reason: 'Empty text'
    };
  }

  const cleanText = text.trim();
  const totalChars = cleanText.length;

  // Unicode Ranges:
  // Assamese / Bengali block: U+0980 to U+09FF
  // Specifically Assamese exclusive characters:
  // U+09F0: Assamese Letter Ra (ৰ)
  // U+09F1: Assamese Letter Va/Wa (ৱ)
  const assameseSpecificRegex = /[\u09F0\u09F1]/g;
  const assameseBengaliBlockRegex = /[\u0980-\u09FF]/g;

  // Devanagari Block (Hindi): U+0900 to U+097F
  const devanagariRegex = /[\u0900-\u097F]/g;

  // Latin Block (English):
  const latinRegex = /[a-zA-Z]/g;

  const assameseSpecificMatches = (cleanText.match(assameseSpecificRegex) || []).length;
  const assameseBengaliMatches = (cleanText.match(assameseBengaliBlockRegex) || []).length;
  const devanagariMatches = (cleanText.match(devanagariRegex) || []).length;
  const latinMatches = (cleanText.match(latinRegex) || []).length;

  // Vocabulary keywords
  const assameseWords = ['অসম', 'ধুবুৰী', 'গুৱাহাটী', 'হৈছে', 'কৰা', 'বাতৰি', 'খবৰ', 'প্ৰকল্প', 'দলং', 'মন্ত্ৰী', 'চৰকাৰ', 'আজি', 'আৰু', 'বাবে', 'প্ৰতিবেদন', 'প্ৰশাসন', 'ৰাষ্ট্ৰীয়', 'নদী'];
  const hindiWords = ['समाचार', 'भारत', 'सरकार', 'मुख्यमंत्री', 'प्रधान', 'असम', 'पुल', 'योजना', 'परियोजना', 'किया', 'गया', 'है', 'हैं', 'और', 'के', 'की', 'का', 'से', 'में', 'पर', 'हुए'];
  const englishWords = ['news', 'assam', 'guwahati', 'bridge', 'government', 'minister', 'project', 'launch', 'police', 'india', 'today', 'said', 'after', 'with', 'state'];

  let asWordHits = 0;
  let hiWordHits = 0;
  let enWordHits = 0;

  const lowerText = cleanText.toLowerCase();

  for (const w of assameseWords) {
    if (cleanText.includes(w)) asWordHits++;
  }
  for (const w of hindiWords) {
    if (cleanText.includes(w)) hiWordHits++;
  }
  for (const w of englishWords) {
    const wordPattern = new RegExp(`\\b${w}\\b`, 'i');
    if (wordPattern.test(lowerText)) enWordHits++;
  }

  // 1. Assamese Detection Check
  if (assameseSpecificMatches > 0 || (assameseBengaliMatches > 10 && asWordHits > 0)) {
    const confidence = Math.min(
      1.0,
      0.65 + (assameseSpecificMatches * 0.1) + (asWordHits * 0.08)
    );
    return {
      language: 'as',
      languageName: 'Assamese (অসমীয়া)',
      confidence: parseFloat(confidence.toFixed(2)),
      isCertain: confidence >= 0.70,
      metrics: {
        assameseSpecificChars: assameseSpecificMatches,
        assameseBengaliChars: assameseBengaliMatches,
        keywordHits: asWordHits
      }
    };
  }

  // If there are Bengali/Assamese block characters without specific Ra/Va, check word hits
  if (assameseBengaliMatches > 5) {
    const isLikelyAssamese = asWordHits >= 1;
    const confidence = isLikelyAssamese ? 0.72 : 0.55;
    return {
      language: 'as',
      languageName: 'Assamese (অসমীয়া)',
      confidence: parseFloat(confidence.toFixed(2)),
      isCertain: isLikelyAssamese,
      metrics: {
        assameseBengaliChars: assameseBengaliMatches,
        keywordHits: asWordHits
      }
    };
  }

  // 2. Hindi Detection Check
  if (devanagariMatches > 5) {
    const scriptRatio = devanagariMatches / Math.max(totalChars, 1);
    const confidence = Math.min(1.0, 0.60 + (scriptRatio * 0.25) + (hiWordHits * 0.08));
    return {
      language: 'hi',
      languageName: 'Hindi (हिंदी)',
      confidence: parseFloat(confidence.toFixed(2)),
      isCertain: confidence >= 0.70,
      metrics: {
        devanagariChars: devanagariMatches,
        keywordHits: hiWordHits
      }
    };
  }

  // 3. English Detection Check
  if (latinMatches > 15) {
    const latinRatio = latinMatches / Math.max(totalChars, 1);
    const confidence = Math.min(1.0, 0.60 + (latinRatio * 0.2) + (enWordHits * 0.08));
    return {
      language: 'en',
      languageName: 'English',
      confidence: parseFloat(confidence.toFixed(2)),
      isCertain: confidence >= 0.70,
      metrics: {
        latinChars: latinMatches,
        keywordHits: enWordHits
      }
    };
  }

  // Ambiguous / Mixed
  return {
    language: 'uncertain',
    languageName: 'Uncertain / Multilingual',
    confidence: 0.35,
    isCertain: false,
    reason: 'Insufficient distinct script glyphs or mixed content'
  };
}

module.exports = {
  detectLanguage
};
