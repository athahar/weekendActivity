export function createSharedMemory() {
    return {
      log: [],
      weather: {
        summary: null,
        confidence: null,
        valid: false,
        attempts: 0
      },
      time: null,
      events: {
        recommendation: null,
        confidence: null,
        valid: false,
        attempts: 0
      },
      preferences: null,
      finalRecommendation: {
        text: null,
        confidence: null,
        valid: false
      }
    };
  }
  