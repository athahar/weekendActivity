import fetch from 'node-fetch';
import openai from './openaiClient.js';
import dotenv from 'dotenv';
dotenv.config();

export class WeatherError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = 'WeatherError';
    this.code = code;
    this.details = details;
  }
}

export async function getWeatherSummary(city) {
  console.log(`\n🔄 getWeatherSummary starting execution`);
  console.log(`📥 Input: city=${city}`);

  if (!city) {
    throw new WeatherError('City parameter is required', 'INVALID_INPUT');
  }

  const apiKey = process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    throw new WeatherError('OpenWeatherMap API key is not configured', 'CONFIG_ERROR');
  }

  try {
    const parts = city.split(',').map(part => part.trim());
    let formattedCity = '';

    if (parts.length === 1) {
      formattedCity = parts[0];
    } else if (parts.length === 2) {
      formattedCity = parts[1].length === 2
        ? `${parts[0]},${parts[1]},US`
        : city;
    } else if (parts.length >= 3) {
      formattedCity = `${parts[0]},${parts[1]},${parts[2]}`;
    } else {
      formattedCity = city;
    }

    console.log(`\n🌐 Calling OpenWeather API for: ${formattedCity}`);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(formattedCity)}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(`✅ OpenWeather API response received`);

    if (!res.ok) {
      throw new WeatherError(
        data.message || 'Failed to fetch weather data',
        data.cod || res.status,
        { city, response: data }
      );
    }

    const summaryRaw = `It is currently ${data.main.temp}°C with ${data.weather[0].description}. Humidity is ${data.main.humidity}% and wind speed is ${data.wind.speed} m/s.`;
    console.log(`\n📝 Raw weather summary: ${summaryRaw}`);

    const prompt = `
You're a helpful assistant advising a family on outdoor plans. Summarize this weather in 2–3 sentences, highlighting whether it's a good time for outdoor activities:

"${summaryRaw}"
`;

    console.log(`\n🤖 Calling OpenAI for weather summary`);
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6
    });
    console.log(`✅ OpenAI response received`);

    const result = {
      summary: aiResponse.choices?.[0]?.message?.content?.trim() || summaryRaw,
      raw: data
    };

    console.log(`\n✅ getWeatherSummary completed execution`);
    return result;
  } catch (error) {
    if (error instanceof WeatherError) throw error;

    throw new WeatherError(
      'Unexpected error fetching weather data',
      'FETCH_ERROR',
      { city, originalError: error.message }
    );
  }
}
