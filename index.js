import express from 'express';
import dotenv from 'dotenv';
import { getActivityRecommendation, ActivityError } from './agents/activityAgent.js';
import { createSharedMemory } from './memory.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  // Log error details
  console.error('API Error:', {
    name: err.name,
    message: err.message,
    code: err.code,
    details: err.details,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle specific error types
  if (err.name === 'ActivityError' || err.name === 'WeatherError') {
    return res.status(400).json({
      error: err.message,
      code: err.code,
      details: err.details
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Handle all other errors
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Input validation and request logging middleware
const logAndValidateRecommendationRequest = (req, res, next) => {
  const { city, preferences } = req.body;
  
  console.log('Incoming request for /recommend', { city, preferences });

  if (!city) {
    return res.status(400).json({
      error: 'City is required',
      code: 'MISSING_CITY'
    });
  }

  if (preferences && typeof preferences !== 'object') {
    return res.status(400).json({
      error: 'Preferences must be an object',
      code: 'INVALID_PREFERENCES'
    });
  }

  next();
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Recommendation endpoint
app.post('/recommend', 
  logAndValidateRecommendationRequest,
  asyncHandler(async (req, res) => {
    const { city, preferences } = req.body;
    const memory = createSharedMemory();

    console.log(`AgentCall -> Name: Activity Agent, Goal: Get activity recommendation, Tool: N/A`);
    const result = await getActivityRecommendation(city, preferences || {}, memory);
    
    // Log successful recommendation
    console.log('✨ Successfully generated recommendation:', { city, preferences });

    res.json({ 
      recommendation: result, 
      memory,
      timestamp: new Date().toISOString()
    });
  })
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Start server with error handling
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server Error:', {
    name: error.name,
    message: error.message,
    code: error.code
  });
  process.exit(1);
});
