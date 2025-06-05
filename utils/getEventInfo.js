import openai from './openaiClient.js';
import { logTokenUsage } from './logTokenUsage.cjs';

// Check for typical fallback disclaimers
function looksLikeFailure(text) {
  const lower = text.toLowerCase();
  return lower.includes("as an ai model") ||
         lower.includes("i don't have access") ||
         lower.includes("check local listings") ||
         lower.length < 100;
}

// Check if it looks like badly formatted or wrapped JSON
function looksLikeInvalidJson(text) {
  return (
    looksLikeFailure(text) ||
    text.includes("```") ||
    !text.trim().startsWith("[") ||
    !text.trim().endsWith("]")
  );
}

export async function getEventRecommendations(city, preferences) {
  const interestList = Object.entries(preferences)
    .filter(([_, v]) => v)
    .map(([k]) => k)
    .join(', ') || 'none';

  

    const prompt = (city, interests) => `
    You are a local event planner in ${city}. Based on user interests: ${interests}, suggest 5–7 highly relevant events.
    
    Today's date is ${new Date().toISOString().slice(0, 10)}. Use it to categorize dates accurately.
    
    Requirements:
    - Each event must have a real future date in YYYY-MM-DD format
    - Include: "emoji", "name", "description", "date", "time", "indoor" (true/false), and "when"
    - For events happening on the upcoming Saturday or Sunday, set "when": "this weekend"
    - For all future dates not this weekend, set "when": "upcoming"
    - You MUST only use these exact values for "when": "this weekend" or "upcoming"
    - Events must be sorted in ascending order by date
    - DO NOT include disclaimers like "As an AI..." or suggestions to check local listings
    
    Return ONLY a JSON array like this:
    
    [
      {
        "emoji": "🎤",
        "name": "Jazz in the Park",
        "description": "Live outdoor jazz concert with food trucks",
        "location": "Santa Clarita Park, Mountain View, CA"
        "date": "2025-06-08",
        "time": "6:00 PM",
        "indoor": false,
        "when": "this weekend"
      }
    ]
    `;



  const callLLM = async (temp = 0.4) => {
    const res = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt(city, interestList) }],
      temperature: temp
    });
    return res.choices?.[0]?.message?.content?.trim() || '';
  };

  

  let response = await callLLM();

  logTokenUsage('getEventRecommendations: ', response?.usage, { city });

  if (looksLikeInvalidJson(response)) {
    console.warn('⚠️ Weak event format or fallback message, retrying...');
    response = await callLLM(0.2);
  }

  try {
    const json = JSON.parse(response);
    // console.log('🎯 Final parsed event list:', json);

    if (!Array.isArray(json)) throw new Error('Expected array of events');
    return json;
  } catch (err) {
    console.error('❌ Failed to parse event JSON:', err.message);
    return []; // fallback gracefully
  }
}
