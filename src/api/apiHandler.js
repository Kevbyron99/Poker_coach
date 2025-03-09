const { createThread, getAssistantAdvice } = require('./openaiAssistant');

// Create a thread endpoint
const handleCreateThread = async (req, res) => {
  try {
    console.log('Create thread request received');
    
    // Check for API key
    if (!global.openaiConfig?.apiKey) {
      console.error('OpenAI API key is missing in environment - trying hardcoded key for local development');
      // For local development only
      if (process.env.NODE_ENV !== 'production') {
        global.openaiConfig = {
          ...global.openaiConfig,
          apiKey: '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'
        };
        console.log('Using hardcoded key for local development');
      } else {
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }
    }
    
    // Create thread
    const result = await createThread();
    console.log('Thread created successfully:', result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in handleCreateThread:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Failed to create thread',
      message: error.message || 'Unknown error' 
    });
  }
};

// Get advice from assistant endpoint
const handleGetAssistantAdvice = async (req, res) => {
  try {
    const { threadId, assistantId, message } = req.body;
    console.log('Advice request received:', { threadId, assistantId, hasMessage: !!message });
    
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
      console.error('OpenAI API key is missing in environment - trying hardcoded key for local development');
      // For local development only
      if (process.env.NODE_ENV !== 'production') {
        global.openaiConfig = {
          ...global.openaiConfig,
          apiKey: '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'
        };
        console.log('Using hardcoded key for local development');
      } else {
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }
    }
    
    // Get advice from assistant
    const result = await getAssistantAdvice(threadId, assistantId, message);
    console.log('Advice retrieved successfully');
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in handleGetAssistantAdvice:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Failed to get assistant advice',
      message: error.message || 'Unknown error' 
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