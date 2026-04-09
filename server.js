import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { Ollama } from 'ollama';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const ollama = new Ollama({ host: 'http://localhost:11434' });

let connectedClients = new Set();

wss.on('connection', (ws) => {
  console.log('Client connected');
  connectedClients.add(ws);
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'chat':
          const chatResponse = await ollama.chat({
            model: data.model,
            messages: data.messages,
            stream: true
          });
          
          for await (const part of chatResponse) {
            ws.send(JSON.stringify({
              type: 'chunk',
              content: part.message.content
            }));
          }
          
          ws.send(JSON.stringify({ type: 'done' }));
          break;
          
        case 'generate':
          const genResponse = await ollama.generate({
            model: data.model,
            prompt: data.prompt,
            stream: true
          });
          
          for await (const part of genResponse) {
            ws.send(JSON.stringify({
              type: 'chunk',
              content: part.response
            }));
          }
          
          ws.send(JSON.stringify({ type: 'done' }));
          break;
          
        case 'list-models':
          const models = await ollama.listModels();
          ws.send(JSON.stringify({
            type: 'models',
            models: models.models || []
          }));
          break;
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log('Client disconnected');
  });
});

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', clients: connectedClients.size });
});

app.get('/api/models', async (req, res) => {
  try {
    const models = await ollama.listModels();
    res.json(models.models || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { model, messages, stream } = req.body;
    
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const chatStream = await ollama.chat({
        model,
        messages,
        stream: true
      });
      
      for await (const part of chatStream) {
        res.write(`data: ${JSON.stringify({ content: part.message.content })}\n\n`);
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const result = await ollama.chat({ model, messages });
      res.json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`AI Debate Room server running on port ${PORT}`);
});
