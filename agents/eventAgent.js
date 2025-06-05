// agents/eventAgent.js
import { getEventRecommendations } from '../utils/getEventInfo.js';

export const EventAgent = {
  name: 'EventAgent',
  goal: 'Provide relevant events based on location and preferences.',
  tools: ['getEventRecommendations'],
  async run(city, preferences, memory) {
    const events = await getEventRecommendations(city, preferences);
    memory.events = events;
    memory.log.push({
      agent: 'EventAgent',
      tool: 'getEventRecommendations',
      input: { city, preferences },
      output: events
    });
  }
};