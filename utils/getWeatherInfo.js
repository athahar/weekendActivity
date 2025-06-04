// utils/getWeatherInfo.js

import fetch from 'node-fetch';
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

export async function getWeatherInfo(city) {
  if (!city) {
    throw new WeatherError('City parameter is required', 'INVALID_INPUT');
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    throw new WeatherError('OpenWeatherMap API key is not configured', 'CONFIG_ERROR');
  }

  try {
    // Split the city string by comma and trim whitespace
    const parts = city.split(',').map(part => part.trim());
    let formattedCity = '';

    if (parts.length === 1) {
      // Assume city name only, let the API handle it or assume a default country if needed
      formattedCity = parts[0];
    } else if (parts.length === 2) {
      // Assume city, state or city, country. For US cities, it's likely city, state.
      // For simplicity, assume US if two parts are provided and the second part is 2 characters (state code)
      if (parts[1].length === 2) {
        formattedCity = `${parts[0]},${parts[1]},US`; // Format as city,state,country (US)
      } else {
        formattedCity = city; // Keep original if not a US city,state format
      }
    } else if (parts.length >= 3) {
      // Assume city, state, country or more. Use the first three parts.
      formattedCity = `${parts[0]},${parts[1]},${parts[2]}`;
    } else {
        formattedCity = city; // Fallback to original city if parsing fails
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(formattedCity)}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new WeatherError(
        data.message || 'Failed to fetch weather data',
        data.cod || res.status,
        { city, response: data }
      );
    }

    return {
      temperature: `${data.main.temp}°C`,
      description: data.weather[0].description,
      wind: `${data.wind.speed} m/s`,
      humidity: `${data.main.humidity}%`
    };
  } catch (error) {
    if (error instanceof WeatherError) {
      throw error;
    }
    throw new WeatherError(
      'Failed to fetch weather data',
      'FETCH_ERROR',
      { city, originalError: error.message }
    );
  }
}
