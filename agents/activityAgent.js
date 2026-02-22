import { WeatherAgent } from './weatherAgent.js';
import { EventAgent } from './eventAgent.js';

export const ActivityAgent = {
  name: 'ActivityAgent',
  goal: 'Recommend activities based on weather, time, and user preferences.',
  tools: ['WeatherAgent', 'EventAgent'],

  async run(city, preferences, memory, options = {}) {
    const { kidsAges = [], radiusMiles = 25, targetDate = '' } = options;

    console.log(`\n🔄 ${this.name} starting execution`);
    console.log(`📥 Input: city=${city}, preferences=${JSON.stringify(preferences)}, kidsAges=${JSON.stringify(kidsAges)}, radius=${radiusMiles}mi, date=${targetDate || 'any'}`);

    memory.log.push({
      agent: this.name,
      goal: this.goal,
      status: 'started',
      input: { city, preferences, kidsAges, radiusMiles, targetDate }
    });

    // Step 1: Get weather
    console.log(`\n📞 ${this.name} calling WeatherAgent`);
    await WeatherAgent.run(city, memory);
    console.log(`✅ WeatherAgent completed`);

    // Step 2: Get events (with all filters)
    console.log(`\n📞 ${this.name} calling EventAgent`);
    await EventAgent.run(city, preferences, memory, { kidsAges, radiusMiles, targetDate });
    console.log(`✅ EventAgent completed`);

    // Step 3: Compose final recommendation
    const time = memory.time || 'daytime';
    const weather = memory.weather || { summary: 'N/A' };
    const events = memory.events || [];

    const selectedPrefs = Object.entries(preferences)
      .filter(([_, checked]) => checked)
      .map(([key]) => labelForPreference(key))
      .join(', ') || 'none';

    const recommendation = `
🌤️ **Weather Summary**: ${weather.summary}

🕒 **Time of Day**: ${time}

🎯 **Recommended Activities**:
${Array.isArray(events) && events.length ? events.map(e => `- ${e.name} (${e.date}, ${e.time})`).join('\n') : 'No matching events found.'}

🧠 (Based on your preferences: ${selectedPrefs})
    `.trim();

    memory.recommendation = recommendation;

    memory.log.push({
      agent: this.name,
      tool: 'composeRecommendation',
      input: { weather, time, preferences },
      output: recommendation
    });

    console.log(`\n✅ ${this.name} completed execution`);
    return recommendation;
  }
};

function labelForPreference(key) {
  const map = {
    music: 'Live Music',
    outdoors: 'Outdoor Activities',
    kids: 'Family & Kids',
    food: 'Food & Drink',
    wellness: 'Health & Wellness',
    markets: 'Local Markets'
  };
  return map[key] || key;
}
