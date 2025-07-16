# Portfolio API - DeepSeek Chat Backend

This is a Node.js backend service designed to handle DeepSeek API calls for a chat interface. It's built to be deployed on Vercel and accessed from a GitHub Pages frontend.

## Features

- Secure API key handling
- CORS protection
- Rate limiting
- Error handling
- Health check endpoint
- DeepSeek chat completion endpoint

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```
   DEEPSEEK_API_KEY=your_api_key_here
   ALLOWED_ORIGIN=https://yourusername.github.io
   ```
4. Replace `yourusername.github.io` in the `.env` file with your actual GitHub Pages domain

## Local Development

Run the development server:
```bash
npm run dev
```

## Deployment to Vercel

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel deploy
   ```

4. Add your environment variables in the Vercel dashboard:
   - Go to your project settings
   - Add DEEPSEEK_API_KEY and ALLOWED_ORIGIN
   - Redeploy if necessary

## API Endpoints

### Health Check
- GET `/api/health`
- Returns status OK if service is running

### Chat Completion
- POST `/api/chat`
- Request body:
  ```json
  {
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }
  ```
- Headers:
  - Content-Type: application/json

## Frontend Integration

In your GitHub Pages frontend, make API calls to your Vercel deployment URL:

```javascript
const response = await fetch('https://your-vercel-url/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello!' }
    ]
  })
});
```

## Security

- API key is securely stored in environment variables
- CORS is configured to only allow requests from your GitHub Pages domain
- Request validation is implemented
- Error handling prevents sensitive information leakage

## License

MIT 