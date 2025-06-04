//agents/activityAgent.js

import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();
import { getWeatherAnalysis } from './weatherAgent.js';
import { getEventRecommendations } from './eventAgent.js';
import { isDaytime } from '../utils/timeUtil.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class ActivityError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = 'ActivityError';
    this.code = code;
    this.details = details;
  }
}

export async function getActivityRecommendation(city, preferences, memory) {
  if (!city) {
    throw new ActivityError('City is required', 'MISSING_CITY');
  }

  try {
    memory.preferences = preferences;

    // Call weather agent with validation + retries
    console.log(`AgentCall -> Name: Weather Analysis Agent, Goal: Get weather information, Tool: getWeatherAnalysis`);
    let weatherOutput;
    try {
      weatherOutput = await getWeatherAnalysis(city);
      memory.weather = weatherOutput;
      memory.log.push({ tool: 'getWeatherAnalysis', output: weatherOutput });
      console.log('Weather analysis completed with confidence:', weatherOutput.confidence);
    } catch (error) {
      throw new ActivityError(
        `Weather analysis failed after retries.`,
        'WEATHER_AGENT_FAILURE',
        { city, originalError: error }
      );
    }

    // Time check
    console.log('Checking current time.');
    const time = isDaytime();
    memory.time = time ? 'daytime' : 'nighttime';
    memory.log.push({ tool: 'checkTime', output: memory.time });
    console.log('Time check completed:', memory.time);

    // Event suggestions
    console.log(`AgentCall -> Name: Event Recommendations Agent, Goal: Get event recommendations, Tool: getEventRecommendations`);
    let eventOutput;
    try {
      eventOutput = await getEventRecommendations(city, preferences);
      memory.events = eventOutput;
      memory.log.push({ tool: 'getEventRecommendations', output: eventOutput });
      console.log('Event recommendations completed with confidence:', eventOutput.confidence);
    } catch (error) {
      throw new ActivityError(
        `Event agent failed.`,
        'EVENT_AGENT_FAILURE',
        { city, originalError: error }
      );
    }

    // Final recommendation
    console.log('Generating final recommendation using LLM.');
    try {
      const messages = [
        {
          role: 'system',
          content:
            'You are a helpful, friendly activity planner. Use weather summary, time of day, and event suggestions to recommend one great activity.'
        },
        {
          role: 'user',
          content: `
City: ${city}
Time: ${memory.time}
Weather Summary: ${weatherOutput.summary}
Event Suggestions: ${eventOutput.recommendation}
Preferences: ${JSON.stringify(preferences)}

What activity should I do right now?
          `.trim()
        }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages
      });

      const finalRecommendation = completion.choices[0].message.content.trim();
      memory.finalRecommendation = {
        text: finalRecommendation,
        confidence: 'high',
        valid: true
      };
      console.log('Final recommendation generated successfully.');

      return finalRecommendation;
    } catch (error) {
      throw new ActivityError(
        'Failed to generate activity recommendation',
        'AI_ERROR',
        { originalError: error }
      );
    }
  } catch (error) {
    if (error instanceof ActivityError) throw error;

    throw new ActivityError(
      error.message || 'Unhandled failure in activity recommendation',
      'ACTIVITY_ERROR',
      { city, originalError: error }
    );
  }
}