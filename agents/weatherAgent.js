//agents/weatherAgent.js

import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

import { getWeatherInfo, WeatherError } from '../utils/getWeatherInfo.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function isValidWeatherSummary(summary) {
  return summary.toLowerCase().includes('temperature') &&
         summary.toLowerCase().includes('humidity');
}

export async function getWeatherAnalysis(city) {
  const weather = await getWeatherInfo(city);
  let attempts = 0;
  let summary = '';
  let confidence = 'low';

  while (attempts < 2) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a weather analyst. Provide a summary that includes temperature, humidity, and outdoor advice.'
        },
        {
          role: 'user',
          content: `City: ${city}\nWeather data: ${JSON.stringify(weather)}`
        }
      ]
    });

    summary = completion.choices[0].message.content.trim();
    attempts++;

    if (isValidWeatherSummary(summary)) {
      confidence = 'high';
      break;
    }
  }

  return {
    summary,
    confidence,
    attempts,
    valid: confidence === 'high'
  };
}