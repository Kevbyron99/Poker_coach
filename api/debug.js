// A simple debug endpoint to verify API routes are working
module.exports = (req, res) => {
  // Return information about the request
  res.status(200).json({
    message: 'API route is working!',
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY
    },
    timestamp: new Date().toISOString()
  });
}; 