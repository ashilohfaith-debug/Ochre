import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import * as Y from 'yjs';
import * as fs from 'fs';
import * as path from 'path';

// y-websocket utility import
// @ts-ignore
import { setupWSConnection } from 'y-websocket/bin/utils';

// ─── Persistence Layer ────────────────────────────────────────────────────────
// Persist Yjs document snapshots to disk so projects survive server restarts.
// Each room gets its own .bin file under the persistence directory.

const PERSISTENCE_DIR = process.env.YJS_PERSISTENCE_DIR
  || path.join(__dirname, '..', '..', '..', 'ochre_docs');

function ensurePersistenceDir() {
  if (!fs.existsSync(PERSISTENCE_DIR)) {
    fs.mkdirSync(PERSISTENCE_DIR, { recursive: true });
  }
}

function docFilePath(roomName: string): string {
  // Sanitize room name to safe filename
  const safe = roomName.replace(/[^a-zA-Z0-9_\-]/g, '_');
  return path.join(PERSISTENCE_DIR, `${safe}.bin`);
}

/** Load a previously saved Yjs document state into a new Y.Doc */
function loadDoc(roomName: string): Y.Doc {
  const ydoc = new Y.Doc();
  const filePath = docFilePath(roomName);
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath);
      Y.applyUpdate(ydoc, data);
    } catch (err) {
      console.warn(`⚠️  Could not load persisted doc for room "${roomName}":`, err);
    }
  }
  return ydoc;
}

/** Save the current Yjs document state to disk */
function saveDoc(roomName: string, ydoc: Y.Doc) {
  try {
    ensurePersistenceDir();
    const update = Y.encodeStateAsUpdate(ydoc);
    fs.writeFileSync(docFilePath(roomName), update);
  } catch (err) {
    console.warn(`⚠️  Could not save doc for room "${roomName}":`, err);
  }
}

// ─── In-Memory Doc Registry ───────────────────────────────────────────────────
// Track live Y.Docs so we can save on change and share across connections.
interface DocEntry {
  doc: Y.Doc;
  connections: number;
  saveTimer: ReturnType<typeof setTimeout> | null;
}

const docRegistry = new Map<string, DocEntry>();

// Debounced save — only write to disk after 2s of inactivity per room
function scheduleSave(roomName: string, entry: DocEntry) {
  if (entry.saveTimer) clearTimeout(entry.saveTimer);
  entry.saveTimer = setTimeout(() => {
    saveDoc(roomName, entry.doc);
    entry.saveTimer = null;
  }, 2000);
}

function getOrCreateDoc(roomName: string): DocEntry {
  let entry = docRegistry.get(roomName);
  if (!entry) {
    const doc = loadDoc(roomName);
    entry = { doc, connections: 0, saveTimer: null };

    // Watch for any change and schedule a save
    doc.on('update', () => {
      scheduleSave(roomName, entry!);
    });

    docRegistry.set(roomName, entry);
  }
  return entry;
}

function releaseDoc(roomName: string) {
  const entry = docRegistry.get(roomName);
  if (!entry) return;
  entry.connections--;
  if (entry.connections <= 0) {
    // Save immediately before removing from registry
    if (entry.saveTimer) clearTimeout(entry.saveTimer);
    saveDoc(roomName, entry.doc);
    // Keep the entry cached for 60s in case someone reconnects quickly
    // then clean up to free memory
    setTimeout(() => {
      const current = docRegistry.get(roomName);
      if (current && current.connections <= 0) {
        current.doc.destroy();
        docRegistry.delete(roomName);
      }
    }, 60_000);
  }
}

// ─── WebSocket Setup ──────────────────────────────────────────────────────────

// Max connections per room to prevent memory abuse
const MAX_CONNECTIONS_PER_ROOM = parseInt(process.env.MAX_ROOM_CONNECTIONS || '50', 10);
// Total max concurrent WebSocket connections
const MAX_TOTAL_CONNECTIONS = parseInt(process.env.MAX_TOTAL_CONNECTIONS || '500', 10);
let totalConnections = 0;

export function setupYjsWebSocket(wss: WebSocketServer) {
  ensurePersistenceDir();

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // Enforce total connection limit
    if (totalConnections >= MAX_TOTAL_CONNECTIONS) {
      ws.close(1013, 'Server at capacity');
      return;
    }

    // Extract room name from URL
    const url = req.url || '/';
    const roomName = url.startsWith('/ws/')
      ? url.replace('/ws/', '').split('?')[0]
      : url.split('?')[0].replace(/^\//, '') || 'ochre-main-room';

    // Enforce per-room connection limit
    const entry = getOrCreateDoc(roomName);
    if (entry.connections >= MAX_CONNECTIONS_PER_ROOM) {
      ws.close(1013, 'Room at capacity');
      releaseDoc(roomName);
      return;
    }

    entry.connections++;
    totalConnections++;

    console.log(
      `🔌 WS connected — room: "${roomName}" | room conns: ${entry.connections} | total: ${totalConnections}`
    );

    // Enable per-message compression to reduce bandwidth per client
    // (y-websocket handles binary framing natively)
    setupWSConnection(ws, req, {
      docName: roomName,
      gc: true,
      // Use our pre-loaded doc so persisted state is immediately available
      doc: entry.doc
    });

    ws.on('close', () => {
      totalConnections = Math.max(0, totalConnections - 1);
      releaseDoc(roomName);
      console.log(
        `🔌 WS closed — room: "${roomName}" | total remaining: ${totalConnections}`
      );
    });

    ws.on('error', (err) => {
      console.warn(`WS error in room "${roomName}":`, err.message);
    });
  });

  console.log(
    `🚀 Yjs WebSocket CRDT Server initialized (max ${MAX_TOTAL_CONNECTIONS} total / ${MAX_CONNECTIONS_PER_ROOM} per room). Persistence: ${PERSISTENCE_DIR}`
  );
}

// ─── Graceful shutdown: flush all docs ───────────────────────────────────────
function flushAllDocs() {
  docRegistry.forEach((entry, roomName) => {
    if (entry.saveTimer) clearTimeout(entry.saveTimer);
    saveDoc(roomName, entry.doc);
  });
}

process.on('SIGTERM', flushAllDocs);
process.on('SIGINT', flushAllDocs);
