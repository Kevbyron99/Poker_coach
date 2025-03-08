const { createThread, getAssistantAdvice } = require('./openaiAssistant');

// Create a thread endpoint
const handleCreateThread = async (req, res) => {
  try {
    console.log('API Handler: Create Thread request received');
    
    if (!global.openaiConfig?.apiKey) {
      console.error('API ERROR: OpenAI API key is missing');
      return res.status(500).json({ 
        error: 'OpenAI API key is missing', 
        message: 'Please check your .env.development.local file'
      });
    }
    
    const result = await createThread();
    return res.json({ threadId: result.threadId });
  } catch (error) {
    console.error('API Error - Create Thread:', error);
    return res.status(500).json({ 
      error: 'Failed to create thread',
      message: error.message
    });
  }
};

// Get advice from assistant endpoint
const handleGetAssistantAdvice = async (req, res) => {
  try {
    console.log('API Handler: Get Assistant Advice request received');
    const { threadId, assistantId, message } = req.body;
    
    if (!threadId || !assistantId || !message) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    if (!global.openaiConfig?.apiKey) {
      console.error('API ERROR: OpenAI API key is missing');
      return res.status(500).json({ 
        error: 'OpenAI API key is missing', 
        message: 'Please check your .env.development.local file'
      });
    }
    
    const result = await getAssistantAdvice(threadId, assistantId, message);
    return res.json({ advice: result.advice });
  } catch (error) {
    console.error('API Error - Get Assistant Advice:', error);
    return res.status(500).json({ 
      error: 'Failed to get advice from assistant',
      message: error.message
    });
  }
};

// Setup the API routes
const setupApiRoutes = (app) => {
  console.log('Setting up API routes for OpenAI Assistant');
  app.post('/api/openai/createThread', handleCreateThread);
  app.post('/api/openai/getAssistantAdvice', handleGetAssistantAdvice);
};

module.exports = {
  handleCreateThread,
  handleGetAssistantAdvice,
  setupApiRoutes
}; 