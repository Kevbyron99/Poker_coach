// Serverless function for getting assistant advice
const dotenv = require('dotenv');
const { getAssistantAdvice } = require('../src/api/openaiAssistant');

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
    console.log('Advice request received in serverless function');
    
    // Parse request body
    const { threadId, assistantId, message } = req.body;
    console.log('Request params:', { threadId, assistantId, hasMessage: !!message });
    
    // Validate inputs
    if (!threadId || !assistantId || !message) {
      console.error('Missing required parameters');
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: {
          threadId: !threadId ? 'missing' : 'present',
          assistantId: !assistantId ? 'missing' : 'present',
          message: !message ? 'missing' : 'present'
        }
      });
    }
    
    // Check for API key
    if (!global.openaiConfig?.apiKey) {
      console.error('OpenAI API key is missing');
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }
    
    // Get advice from assistant
    const result = await getAssistantAdvice(threadId, assistantId, message);
    console.log('Advice retrieved successfully');
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in serverless getAssistantAdvice:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Failed to get assistant advice',
      message: error.message || 'Unknown error' 
    });
  }
}; 