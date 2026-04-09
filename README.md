# AI Debate Room

A 3D Sims-like room where AI models debate each other, analyze responses, and compete to give the best answers.

## Features

- **3D Room Environment** - Interactive Three.js scene with AI character models
- **Multiple AI Models** - Support for both Ollama (local) and OpenAI (cloud)
- **Real-time Debate** - Models answer questions and analyze each other's responses
- **Voice Synthesis** - Hear AI responses spoken aloud
- **Adaptive Learning** - Models improve answers based on criticism

## Quick Start (Cloud Mode - Recommended)

1. Get an OpenAI API key from https://platform.openai.com
2. Create `.env` file:
   ```
   VITE_USE_CLOUD=true
   VITE_OPENAI_API_KEY=sk-your-key-here
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
4. Open http://localhost:5173

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `VITE_USE_CLOUD` = `true`
- `VITE_OPENAI_API_KEY` = your API key

## Local Development (Ollama)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull llama3
ollama pull mistral

# Start server
ollama serve

# Run the app
npm install
npm run dev
```

## How It Works

1. **Add Models** - Click "+ Add Model" to add AI models
2. **Ask Questions** - Type a question and press Send
3. **Watch Debate** - All models answer simultaneously
4. **Start Debate Mode** - Multi-round debates:
   - Round 1: All models answer
   - Round 2: Models analyze each other
   - Round 3: Models improve based on criticism
   - Winner determined by peer analysis

## Tech Stack

- Three.js - 3D rendering
- OpenAI/Ollama - AI inference
- Vite - Build tool
- Vercel - Hosting
