// agents/eventAgent.js
import { getEventRecommendations } from '../utils/getEventInfo.js';

export const EventAgent = {
  name: 'EventAgent',
  goal: 'Provide relevant, age-appropriate events based on location, preferences, distance, and date.',
  tools: ['getEventRecommendations'],
  async run(city, preferences, memory, options = {}) {
    const { kidsAges = [], radiusMiles = 25, targetDate = '' } = options;
    const events = await getEventRecommendations(city, preferences, { kidsAges, radiusMiles, targetDate });
    memory.events = events;
    memory.log.push({
      agent: 'EventAgent',
      tool: 'getEventRecommendations',
      input: { city, preferences, kidsAges, radiusMiles, targetDate },
      output: events
    });
  }
};
