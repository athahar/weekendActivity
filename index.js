import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { ActivityAgent } from './agents/activityAgent.js';
import { createSharedMemory } from './memory.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/recommend', async (req, res) => {
  try {
    const { city, preferences = {} } = req.body;

    const memory = createSharedMemory();
    memory.city = city;
    memory.preferences = preferences;

    const result = await ActivityAgent.run(city, preferences, memory);

    res.json({
      recommendation: result,
      memory,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error in /recommend:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
