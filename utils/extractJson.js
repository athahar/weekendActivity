/**
 * Attempts to extract the first valid JSON array from a messy LLM response string.
 * Strips markdown, trims text, and tries to recover from common formatting issues.
 * 
 * @param {string} text - Raw response from LLM
 * @returns {Array|undefined} Parsed JSON array or undefined if not found
 */
export function extractJson(text) {
    if (!text || typeof text !== 'string') return [];
  
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
  
    if (start === -1 || end === -1 || end <= start) {
      console.warn('⚠️ Could not locate JSON array in text');
      return [];
    }
  
    const jsonSubstring = text.slice(start, end + 1);
  
    try {
      const parsed = JSON.parse(jsonSubstring);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('❌ Failed to parse JSON from response:', err.message);
      return [];
    }
  }
  