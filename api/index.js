const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Rate limiting configuration
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};

let requestCounts = new Map();
let lastCleanup = Date.now();

// Simple rate limiting middleware
const rateLimiter = (req, res, next) => {
  const now = Date.now();
  const ip = req.ip;
  
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
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  userRequests.count++;
  requestCounts.set(ip, userRequests);
  next();
};

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || 'https://xxristoskk.github.io',
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(rateLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// DeepSeek chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
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
    
    // Handle different types of errors
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
});

// Export for Vercel
module.exports = app; 