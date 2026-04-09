# Deployment to Vercel

## Option 1: Cloud AI (Recommended for Deployment)

1. Get an OpenAI API key from https://platform.openai.com
2. Create a `.env` file:
   ```
   VITE_USE_CLOUD=true
   VITE_OPENAI_API_KEY=your-api-key-here
   ```
3. Deploy to Vercel:
   ```bash
   npx vercel
   ```

## Option 2: Local Ollama (Free, Local)

1. Install and run Ollama locally
2. Pull models: `ollama pull llama3 mistral`
3. Run dev server: `npm run dev`
4. Access at `http://localhost:5173`

Note: Local Ollama only works when accessed from the same machine.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_USE_CLOUD` | Set to `true` for cloud AI | For deployment |
| `VITE_OPENAI_API_KEY` | Your OpenAI API key | For cloud mode |

## Deploy with Vercel CLI

```bash
npm install -g vercel
cd ai-debate-room
vercel
```

Or drag the `dist` folder to https://vercel.com/new
