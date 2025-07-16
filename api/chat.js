const axios = require('axios');

// Simple rate limiting
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};

let requestCounts = new Map();
let lastCleanup = Date.now();

// Rate limiting check
const checkRateLimit = (ip) => {
  const now = Date.now();
  
  // Cleanup old entries every hour
  if (now - lastCleanup > 3600000) {
    requestCounts.clear();
    lastCleanup = now;
  }

  const userRequests = requestCounts.get(ip) || { count: 0, resetTime: now + rateLimit.windowMs };
  
  if (now > userRequests.resetTime) {
    userRequests.count = 0;
    userRequests.resetTime = now + rateLimit.windowMs;
  }

  if (userRequests.count >= rateLimit.max) {
    return false;
  }

  userRequests.count++;
  requestCounts.set(ip, userRequests);
  return true;
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://xxristoskk.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check rate limit
    if (!checkRateLimit(req.headers['x-forwarded-for'] || req.socket.remoteAddress)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { messages, temperature = 0.7, max_tokens = 2000 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Invalid request format',
        details: 'Messages must be provided as an array'
      });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'API key not configured'
      });
    }

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages,
        temperature: Math.min(Math.max(temperature, 0), 1), // Ensure temperature is between 0 and 1
        max_tokens: Math.min(max_tokens, 4000) // Cap max_tokens at 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      res.status(error.response.status).json({
        error: 'API Error',
        details: error.response.data?.error || 'Error from DeepSeek API',
        status: error.response.status
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(504).json({
        error: 'Gateway Timeout',
        details: 'No response received from DeepSeek API'
      });
    } else {
      // Something happened in setting up the request
      res.status(500).json({
        error: 'Internal Server Error',
        details: error.message
      });
    }
  }
}; 