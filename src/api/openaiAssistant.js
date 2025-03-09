// Use global config from server.js instead of importing from apiConfig
// const { openaiConfig } = require('../config/apiConfig');
const fetch = require('node-fetch');

// Helper function to handle API responses
const handleApiResponse = async (response, errorMessage) => {
  // Always log the status for debugging
  console.log(`OpenAI API response status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    // Try to get detailed error info
    try {
      const text = await response.text();
      let errorData;
      
      try {
        // Try to parse as JSON first
        errorData = JSON.parse(text);
      } catch (e) {
        // If not JSON, use text directly
        throw new Error(`${errorMessage}: ${text.substring(0, 100)}`);
      }
      
      throw new Error(`${errorMessage}: ${errorData.error?.message || errorData.message || response.statusText}`);
    } catch (e) {
      // If we couldn't get the response text
      throw new Error(`${errorMessage}: ${response.statusText || response.status}`);
    }
  }
  
  try {
    // Try to parse the response as JSON
    const text = await response.text();
    if (!text || !text.trim()) {
      throw new Error(`${errorMessage}: Empty response from API`);
    }
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${errorMessage}: Failed to parse response - ${e.message}`);
  }
};

// Create a new Thread - OpenAI Assistants API
const createThread = async () => {
  try {
    console.log('Creating new thread with API key:', global.openaiConfig?.apiKey ? 'Available' : 'Missing');
    
    if (!global.openaiConfig?.apiKey) {
      throw new Error('OpenAI API key is missing');
    }
    
    const response = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${global.openaiConfig.apiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    });

    const data = await handleApiResponse(response, 'Error creating thread');
    console.log('Thread created successfully:', data.id);
    return { threadId: data.id };
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
};

// Add a message to a thread
const addMessageToThread = async (threadId, content) => {
  try {
    console.log(`Adding message to thread ${threadId}`);
    
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${global.openaiConfig.apiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content,
      })
    });

    return await handleApiResponse(response, 'Error adding message to thread');
  } catch (error) {
    console.error('Error adding message to thread:', error);
    throw error;
  }
};

// Run the assistant on a thread
const runAssistant = async (threadId, assistantId) => {
  try {
    console.log(`Running assistant ${assistantId} on thread ${threadId}`);
    
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${global.openaiConfig.apiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });

    return await handleApiResponse(response, 'Error running assistant');
  } catch (error) {
    console.error('Error running assistant:', error);
    throw error;
  }
};

// Check the status of a run
const checkRunStatus = async (threadId, runId) => {
  try {
    console.log(`Checking run status for ${runId} on thread ${threadId}`);
    
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${global.openaiConfig.apiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    return await handleApiResponse(response, 'Error checking run status');
  } catch (error) {
    console.error('Error checking run status:', error);
    throw error;
  }
};

// Get messages from a thread
const getThreadMessages = async (threadId) => {
  try {
    console.log(`Getting messages from thread ${threadId}`);
    
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${global.openaiConfig.apiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    return await handleApiResponse(response, 'Error getting thread messages');
  } catch (error) {
    console.error('Error getting thread messages:', error);
    throw error;
  }
};

// Helper function to wait for run completion
const waitForRunCompletion = async (threadId, runId, maxAttempts = 10) => {
  let attempts = 0;
  let run;
  
  do {
    attempts++;
    
    // Wait for 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    run = await checkRunStatus(threadId, runId);
    console.log(`Run status check ${attempts}/${maxAttempts}: ${run.status}`);
    
    // If the run is completed, failed, or cancelled, stop waiting
    if (['completed', 'failed', 'cancelled'].includes(run.status)) {
      break;
    }
    
  } while (attempts < maxAttempts);
  
  return run;
};

// Get advice from the assistant
const getAssistantAdvice = async (threadId, assistantId, messageContent) => {
  try {
    console.log(`Getting advice from assistant ${assistantId} on thread ${threadId}`);
    
    // 1. Add the user's message to the thread
    await addMessageToThread(threadId, messageContent);
    
    // 2. Run the assistant on the thread
    const run = await runAssistant(threadId, assistantId);
    
    // 3. Wait for the run to complete
    const completedRun = await waitForRunCompletion(threadId, run.id);
    
    if (completedRun.status !== 'completed') {
      throw new Error(`Run failed with status: ${completedRun.status}`);
    }
    
    // 4. Get the latest messages from the thread
    const messages = await getThreadMessages(threadId);
    
    // Get the latest assistant message
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      throw new Error('No assistant messages found in the thread');
    }
    
    // Return the latest message
    const latestMessage = assistantMessages[0];
    const advice = latestMessage.content[0].text.value;
    
    console.log('Successfully retrieved advice from assistant');
    return { advice };
  } catch (error) {
    console.error('Error getting assistant advice:', error);
    throw error;
  }
};

module.exports = {
  createThread,
  getAssistantAdvice
}; 