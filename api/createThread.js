// Serverless function for creating a thread
const dotenv = require('dotenv');
const { createThread } = require('../src/api/openaiAssistant');

// Load environment variables
dotenv.config();

// Configure OpenAI if not already done
if (!global.openaiConfig) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    console.error('CRITICAL ERROR: OpenAI API key is missing in environment variables');
  } else {
    console.log('OpenAI API key is available in serverless function');
  }
  
  global.openaiConfig = {
    apiKey: OPENAI_API_KEY,
    modelName: 'gpt-4-turbo-preview',
  };
  console.log('Initialized OpenAI config in serverless function');
}

// Set a timeout promise
const timeoutPromise = (ms) => new Promise((_, reject) => {
  setTimeout(() => reject(new Error(`Operation timed out after ${ms/1000} seconds`)), ms);
});

// Main handler with timeout
module.exports = async (req, res) => {
  // Create a timestamp for tracking request timing
  const startTime = Date.now();
  console.log(`[${startTime}] Create thread request received in serverless function`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log(`[${Date.now() - startTime}ms] Processing create thread request`);
    
    // Check for API key
    if (!global.openaiConfig?.apiKey) {
      console.error(`[${Date.now() - startTime}ms] OpenAI API key is missing`);
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }
    
    console.log(`[${Date.now() - startTime}ms] Starting createThread with valid API key`);
    
    // Use Promise.race to implement timeout
    const MAX_DURATION = 50000; // 50 seconds (just under Vercel's 60s limit)
    
    try {
      // Create thread with timeout
      const result = await Promise.race([
        createThread(),
        timeoutPromise(MAX_DURATION)
      ]);
      
      console.log(`[${Date.now() - startTime}ms] Thread created successfully:`, result);
      return res.status(200).json(result);
    } catch (timeoutError) {
      if (timeoutError.message.includes('timed out')) {
        console.error(`[${Date.now() - startTime}ms] Request timed out: ${timeoutError.message}`);
        return res.status(504).json({
          error: 'Request timed out',
          message: 'The OpenAI API took too long to respond. Please try again.'
        });
      }
      throw timeoutError;
    }
  } catch (error) {
    console.error(`[${Date.now() - startTime}ms] Error in serverless createThread:`, error.message, error.stack);
    return res.status(500).json({ 
      error: 'Failed to create thread',
      message: error.message || 'Unknown error',
      time: `${Date.now() - startTime}ms`
    });
  }
}; 