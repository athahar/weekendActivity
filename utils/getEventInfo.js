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

export async function getEventRecommendations(city, preferences, options = {}) {
  const { kidsAges = [], radiusMiles = 25, targetDate = '' } = options;

  const interestList = Object.entries(preferences)
    .filter(([_, v]) => v)
    .map(([k]) => k)
    .join(', ') || 'none';

  const hasKids = kidsAges.length > 0;
  const sortedAges = [...kidsAges].sort((a, b) => a - b);
  const ageDescription = hasKids
    ? `The family has ${kidsAges.length} kid(s) aged: ${sortedAges.join(', ')}. `
    : '';

  const ageGuidelines = hasKids
    ? `
    IMPORTANT — Age-based activity guidelines:
    ${sortedAges.some(a => a <= 3) ? '- For toddlers (0-3): Suggest sensory play, storytime, splash pads, petting zoos, toddler-friendly parks' : ''}
    ${sortedAges.some(a => a >= 4 && a <= 7) ? '- For young kids (4-7): Suggest hands-on crafts, beginner sports, puppet shows, nature walks, kid-friendly museums' : ''}
    ${sortedAges.some(a => a >= 8 && a <= 12) ? '- For tweens (8-12): Suggest science exhibits, adventure activities, cooking classes, escape rooms, sports camps' : ''}
    ${sortedAges.some(a => a >= 13 && a <= 17) ? '- For teens (13-17): Suggest concerts, rock climbing, volunteering, art workshops, teen-oriented events' : ''}
    - Every event MUST be suitable for at least one of the kids' age groups
    - Include a mix of events that cover different age groups when kids span multiple ranges
    - Each event must include "ageRange" (e.g., "Ages 4-7", "Ages 8+", "All ages")
    `
    : '';

  const radiusContext = `All events MUST be within ${radiusMiles} miles of ${city}.`;

  const dateContext = targetDate
    ? `The user is looking for events on or around ${targetDate}. Prioritize events on that specific date, but include nearby dates if needed.`
    : '';

    const prompt = (city, interests) => `
    You are a local event planner in ${city}. Based on user interests: ${interests}, suggest 5–7 highly relevant events.

    ${ageDescription}
    ${radiusContext}
    ${dateContext}
    Today's date is ${new Date().toISOString().slice(0, 10)}. Use it to categorize dates accurately.
    ${ageGuidelines}
    Requirements:
    - Each event must have a real future date in YYYY-MM-DD format
    - Include: "emoji", "name", "description", "date", "time", "indoor" (true/false), "when"${hasKids ? ', and "ageRange"' : ''}
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
        "location": "Santa Clarita Park, Mountain View, CA",
        "date": "2025-06-08",
        "time": "6:00 PM",
        "indoor": false,
        "when": "this weekend"${hasKids ? ',\n        "ageRange": "All ages"' : ''}
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
