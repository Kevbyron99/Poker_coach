const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables - prioritize environment variables over .env files
dotenv.config();

// Make sure we have the OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('OPENAI API KEY IS MISSING! Please check your environment variables');
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
const PORT = process.env.PORT || 3001;

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
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OpenAI API key loaded: ${OPENAI_API_KEY ? 'YES' : 'NO'}`);
}); 