// agents/eventAgent.js
import { getEventRecommendations } from '../utils/getEventInfo.js';

export const EventAgent = {
  name: 'EventAgent',
  goal: 'Provide relevant, age-appropriate events based on location, preferences, and kids\' ages.',
  tools: ['getEventRecommendations'],
  async run(city, preferences, memory, kidsAges = []) {
    const events = await getEventRecommendations(city, preferences, kidsAges);
    memory.events = events;
    memory.log.push({
      agent: 'EventAgent',
      tool: 'getEventRecommendations',
      input: { city, preferences, kidsAges },
      output: events
    });
  }
};