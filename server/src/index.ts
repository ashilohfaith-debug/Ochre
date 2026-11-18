import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';

import apiRouter from './routes/api';
import executeRouter from './routes/execute';
import { initDatabase } from './database/db';
import { setupYjsWebSocket } from './websocket/yjsServer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & performance middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Limit JSON body size for execute endpoint separately (code can be large)
app.use('/api/execute', express.json({ limit: '512kb' }));

// API Routes
app.use('/api', apiRouter);
app.use('/api/execute', executeRouter);

// Serve static frontend files from client/dist
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath, {
  maxAge: '1h',
  etag: true,
  lastModified: true
}));

// Fallback to index.html for single-page app routing
app.get('*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send("Frontend assets not built yet. Run 'npm run build' in /client first.");
    }
  });
});

const server = http.createServer(app);

// WebSocket Server — enable per-message deflate compression to reduce bandwidth
const wss = new WebSocketServer({
  server,
  perMessageDeflate: {
    zlibDeflateOptions: { level: 6 },
    zlibInflateOptions: { chunkSize: 16 * 1024 },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    threshold: 512 // only compress messages > 512 bytes
  }
});

setupYjsWebSocket(wss);

// Start server
async function bootstrap() {
  await initDatabase();

  server.listen(PORT, () => {
    console.log(`
════════════════════════════════════════════════════════════════
  🚀 Ochre Full-Stack Collaborative IDE
  - Open in browser:  http://localhost:${PORT}
  - REST API:         http://localhost:${PORT}/api/health
  - WebSocket CRDT:   ws://localhost:${PORT}/
════════════════════════════════════════════════════════════════
    `);
  });
}

bootstrap().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
