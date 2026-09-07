/**
 * Gemini API integration for enhanced claim extraction and
 * Google Search grounding for corroboration.
 *
 * Falls back gracefully to regex/degraded-mode when the API
 * is unavailable or the key is invalid.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Extract factual, verifiable claims from homepage text using Gemini.
 * Returns an array of short claim strings suitable for corroboration queries.
 *
 * Falls back to the legacy regex approach on any failure.
 *
 * @param {string} text - Homepage body text
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<string[]>}
 */
export async function extractClaimsWithGemini(text, apiKey) {
  if (!apiKey || !text || text.trim().length < 30) {
    return fallbackRegexClaims(text || '');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a fact-extraction assistant. Given the following website homepage text, extract all specific, verifiable factual claims. Focus on:
- Founding year (e.g. "founded in 2015")
- Headquarters location (e.g. "headquartered in Austin, TX")
- Employee count (e.g. "over 500 employees")
- Revenue or valuation (e.g. "$50 million revenue")
- Customer/user count (e.g. "10,000+ customers")
- Awards or rankings (e.g. "#1 rated platform")
- Notable partnerships or clients (e.g. "trusted by Google")

Return ONLY a JSON array of short claim strings. If no verifiable claims are found, return an empty array [].
Do NOT include opinions, marketing language, or non-verifiable statements.

Homepage text:
"""
${text.slice(0, 3000)}
"""`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    // Parse the JSON array from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const claims = JSON.parse(jsonMatch[0]);
      if (Array.isArray(claims) && claims.length > 0) {
        // Cap at 8 claims to avoid excessive search queries
        return claims.slice(0, 8).map((c) => String(c).trim()).filter(Boolean);
      }
    }
    return fallbackRegexClaims(text);
  } catch (err) {
    // Gemini API failed — fall back to regex silently
    console.error('Gemini claim extraction failed, falling back to regex:', err.message);
    return fallbackRegexClaims(text);
  }
}

/**
 * Legacy regex-based claim extraction (kept as fallback).
 */
function fallbackRegexClaims(text) {
  const claims = [];
  const foundedMatch = text.match(/founded in (\d{4})/i);
  if (foundedMatch) claims.push(`founded in ${foundedMatch[1]}`);
  const hqMatch = text.match(/headquartered in ([A-Z][a-zA-Z\s,]+?)[.,]/);
  if (hqMatch) claims.push(`headquartered in ${hqMatch[1].trim()}`);
  const employeeMatch = text.match(/(\d[\d,]+)\+?\s*employees/i);
  if (employeeMatch) claims.push(`${employeeMatch[1]} employees`);
  const customerMatch = text.match(/(\d[\d,]+)\+?\s*(customers|clients|users)/i);
  if (customerMatch) claims.push(`${customerMatch[1]} ${customerMatch[2]}`);
  const revenueMatch = text.match(/\$\s*([\d.]+)\s*(million|billion)\s*(revenue|valuation|ARR)/i);
  if (revenueMatch) claims.push(`$${revenueMatch[1]} ${revenueMatch[2]} ${revenueMatch[3]}`);
  return claims;
}

/**
 * Create a searchFn compatible with trust-and-identity's corroboration
 * checks, powered by Gemini's grounding with Google Search.
 *
 * @param {string} apiKey - Gemini API key
 * @returns {((query: string) => Promise<{url: string}[]>) | null}
 */
export function createGeminiSearchFn(apiKey) {
  if (!apiKey) return null;

  return async function geminiSearch(query) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel(
        { model: 'gemini-2.0-flash' },
        { apiVersion: 'v1beta' }
      );

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: query }] }],
        tools: [{ googleSearch: {} }],
      });

      // Extract grounding metadata with cited URLs
      const response = result.response;
      const urls = [];

      // Check grounding metadata for search results
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web?.uri) {
            urls.push({ url: chunk.web.uri });
          }
        }
      }

      // Also check grounding supports
      if (groundingMetadata?.groundingSupports) {
        for (const support of groundingMetadata.groundingSupports) {
          if (support.segment?.sourceUri) {
            urls.push({ url: support.segment.sourceUri });
          }
        }
      }

      // Fallback: try to extract URLs from the text response itself
      if (urls.length === 0) {
        const text = response.text() || '';
        const urlMatches = text.match(/https?:\/\/[^\s)"',]+/g) || [];
        for (const u of urlMatches) {
          urls.push({ url: u });
        }
      }

      // Deduplicate
      const seen = new Set();
      return urls.filter((u) => {
        if (seen.has(u.url)) return false;
        seen.add(u.url);
        return true;
      });
    } catch (err) {
      console.error('Gemini search grounding failed:', err.message);
      return [];
    }
  };
}
