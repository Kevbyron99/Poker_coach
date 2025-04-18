const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables - prioritize environment variables over .env files
dotenv.config();

// Make sure we have the OpenAI API key
let OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Check if API key exists
if (!OPENAI_API_KEY) {
  console.error('OPENAI API KEY IS MISSING! Please check your .env file or environment variables');
  // We'll continue but log a clear warning
}

// Create global config for API handlers
global.openaiConfig = {
  apiKey: OPENAI_API_KEY,
  modelName: 'gpt-4-turbo-preview',
};

// Log API initialization
console.log('Initializing API with OpenAI config:', {
  apiKeyAvailable: !!OPENAI_API_KEY,
  model: global.openaiConfig.modelName
});

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Import API routes
const { setupApiRoutes } = require('./src/api/apiHandler');

// Setup API routes
setupApiRoutes(app);

// Error handling middleware 
app.use((err, req, res, next) => {
  console.error('Server error:', err.message, err.stack);
  
  // Ensure we always respond with proper JSON
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Ensure this path is correct for Vercel
  const buildPath = path.join(__dirname, 'build');
  console.log('Serving static files from:', buildPath);
  
  app.use(express.static(buildPath));
  
  app.get('*', (req, res) => {
    if (req.url.startsWith('/api')) {
      // Don't try to serve API routes as static files
      res.status(404).json({ error: 'API route not found' });
    } else {
      res.sendFile(path.join(buildPath, 'index.html'));
    }
  });
}

// API endpoint for poker advice (legacy - can be removed later)
app.post('/api/getPokerAdvice', async (req, res) => {
  try {
    // Forward to the new assistant endpoint
    const { threadId, assistantId } = req.body;
    const message = JSON.stringify(req.body);
    
    // Import the function directly
    const { getAssistantAdvice } = require('./src/api/openaiAssistant');
    
    // Use the OpenAI assistant if threadId is available
    if (threadId && assistantId) {
      const result = await getAssistantAdvice(threadId, assistantId, message);
      return res.json({ advice: result.advice });
    }
    
    // Fallback to generic advice
    return res.json({ 
      advice: "Consider the pot odds and your hand strength when making decisions."
    });
  } catch (error) {
    console.error('API Error - Legacy Advice:', error);
    return res.status(500).json({ 
      error: 'Failed to get advice',
      advice: "Consider the pot odds and your hand strength when making decisions."
    });
  }
});

// For Vercel serverless functions, don't start a server but export the app
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode (serverless)');
  module.exports = app;
} else {
  // Start the server for local development
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`OpenAI API key loaded: ${OPENAI_API_KEY ? 'YES' : 'NO'}`);
  });
} 