/**
 * API Configuration for Poker Assistant
 * 
 * SECURITY WARNING:
 * -----------------
 * 1. NEVER commit this file with real API keys to version control
 * 2. For production, API keys should be stored on a secure backend server
 * 3. This implementation is for demonstration purposes only
 * 
 * RECOMMENDATION:
 * In a real application, you should:
 * - Create a .env file that is in .gitignore to store keys
 * - Set up a proper backend server to handle API requests
 * - Never expose API keys in client-side code
 */

// For demonstration purposes only, this would typically be loaded from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Configuration for OpenAI API
const openaiConfig = {
  apiKey: OPENAI_API_KEY,
  modelName: 'gpt-4-turbo-preview',
  maxTokens: 500,
};

module.exports = { openaiConfig }; 