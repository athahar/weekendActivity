// agents/eventAgent.js

import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();
import { getEventInfo } from '../utils/getEventInfo.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function isValidEventRecommendation(text) {
  return text.toLowerCase().includes('event') || text.toLowerCase().includes('recommend');
}

export async function getEventRecommendations(city, preferences) {
  const events = await getEventInfo(city);

  let recommendation = '';
  let attempts = 0;
  let confidence = 'low';

  while (attempts < 2) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an event planner. Recommend one or two events based on the user\'s preferences.'
        },
        {
          role: 'user',
          content: `City: ${city}\nPreferences: ${JSON.stringify(preferences)}\nAvailable events: ${JSON.stringify(events)}`
        }
      ]
    });

    recommendation = completion.choices[0].message.content.trim();
    attempts++;

    if (isValidEventRecommendation(recommendation)) {
      confidence = 'high';
      break;
    }
  }

  return {
    recommendation,
    confidence,
    valid: confidence === 'high',
    attempts
  };
}