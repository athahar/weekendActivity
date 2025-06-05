// agents/weatherAgent.js
import { getWeatherSummary } from '../utils/getWeatherInfo.js';
import { getTimeOfDay } from '../utils/timeUtil.js';


export const WeatherAgent = {
  name: 'WeatherAgent',
  goal: "Analyze current weather conditions for user's location.",
  tools: ['getWeatherSummary', 'getTimeOfDay'],
  async run(city, memory) {
    console.log(`\n🔄 ${this.name} starting execution`);
    console.log(`📥 Input: city=${city}`);

    console.log(`\n📞 ${this.name} calling getWeatherSummary`);
    const weather = await getWeatherSummary(city);
    console.log(`✅ getWeatherSummary completed`);

    console.log(`\n📞 ${this.name} calling getTimeOfDay`);
    const time = getTimeOfDay();
    console.log(`✅ getTimeOfDay completed`);

    memory.weather = weather;
    memory.time = time;

    memory.log.push({
      agent: 'WeatherAgent',
      tool: 'getWeatherSummary',
      input: city,
      output: weather
    });

    memory.log.push({
      agent: 'WeatherAgent',
      tool: 'getTimeOfDay',
      input: null,
      output: time
    });

    console.log(`\n✅ ${this.name} completed execution`);
  }
};
