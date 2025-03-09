// Serverless function for creating a thread
const dotenv = require('dotenv');
const { createThread } = require('../src/api/openaiAssistant');

// Load environment variables
dotenv.config();

// Configure OpenAI if not already done
if (!global.openaiConfig) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  global.openaiConfig = {
    apiKey: OPENAI_API_KEY,
    modelName: 'gpt-4-turbo-preview',
  };
  console.log('Initialized OpenAI config in serverless function');
}

module.exports = async (req, res) => {
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
    console.log('Create thread request received in serverless function');
    
    // Check for API key
    if (!global.openaiConfig?.apiKey) {
      console.error('OpenAI API key is missing');
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }
    
    // Create thread
    const result = await createThread();
    console.log('Thread created successfully:', result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in serverless createThread:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Failed to create thread',
      message: error.message || 'Unknown error' 
    });
  }
}; 