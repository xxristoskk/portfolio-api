const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || 'https://yourusername.github.io',
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// DeepSeek chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal server error'
    });
  }
});

// Export for Vercel
module.exports = app; 