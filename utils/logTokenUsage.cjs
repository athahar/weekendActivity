// utils/logTokenUsage.cjs
const fs = require('fs');

function logTokenUsage(agent, usage, context = {}) {
  if (!usage || !usage.total_tokens) return;

  const entry = {
    timestamp: new Date().toISOString(),
    agent,
    ...context,
    usage,
  };

  const filePath = './logs/token-usage.log';
  fs.mkdirSync('./logs', { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(entry) + '\n');
}

module.exports = { logTokenUsage };
