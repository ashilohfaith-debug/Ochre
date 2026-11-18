import React, { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Collaborator } from '../types';
import { useAuth } from './AuthProvider';
import { getLanguageFromFilename } from '../utils/language';

export interface ProjectFile {
  path: string;
  language: string;
}

interface CollaborationContextType {
  doc: Y.Doc | null;
  provider: WebsocketProvider | null;
  collaborators: Collaborator[];
  currentUser: { name: string; color: string };
  isConnected: boolean;
  roomName: string;
  files: ProjectFile[];
  createFile: (path: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  presenceEvents: { id: string; message: string; type: 'join' | 'leave'; timestamp: number }[];
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

export const CollaborationProvider: React.FC<{
  children: React.ReactNode;
  activeRoom?: string;
}> = ({ children, activeRoom = 'ochre-main-room' }) => {
  const { user } = useAuth();

  // Stable string references — prevents reconnect loops when parent re-renders
  const userName = user?.username || 'Anonymous';
  const userColor = user?.color || '#3b82f6';

  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [presenceEvents, setPresenceEvents] = useState<
    { id: string; message: string; type: 'join' | 'leave'; timestamp: number }[]
  >([]);

  // Store latest user info in a ref so we can update awareness without reconnecting
  const userInfoRef = useRef({ name: userName, color: userColor });
  userInfoRef.current = { name: userName, color: userColor };

  // currentUser object — stable reference for consumers
  const currentUser = useMemo(() => ({ name: userName, color: userColor }), [userName, userColor]);

  // ─── Establish Yjs connection (only when activeRoom changes) ─────────────────
  useEffect(() => {
    const ydoc = new Y.Doc();
    setDoc(ydoc);

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.port === '5173'
      ? 'localhost:5000'
      : window.location.host || 'localhost:5000';
    const wsUrl = `${wsProtocol}//${host}`;

    console.log(`🔌 Connecting to room: "${activeRoom}"`);

    const wsProvider = new WebsocketProvider(wsUrl, activeRoom, ydoc, {
      connect: true,
      // Attempt reconnect automatically with back-off
      WebSocketPolyfill: undefined
    });

    setProvider(wsProvider);

    // Connection status
    const onStatus = (event: { status: string }) => {
      setIsConnected(event.status === 'connected');
    };
    wsProvider.on('status', onStatus);

    // Set initial awareness state
    const awareness = wsProvider.awareness;
    awareness.setLocalStateField('user', {
      name: userInfoRef.current.name,
      color: userInfoRef.current.color
    });

    let prevClients = new Set<number>();

    const updateCollaborators = () => {
      const states = awareness.getStates();
      const list: Collaborator[] = [];
      const currentClients = new Set<number>();

      states.forEach((state, clientId) => {
        currentClients.add(clientId);
        if (state.user) {
          list.push({
            clientId,
            name: state.user.name || 'Anonymous',
            color: state.user.color || '#3b82f6',
            status: 'online',
            cursor: state.cursor
          });
        }
      });

      // Detect joins
      currentClients.forEach(id => {
        if (!prevClients.has(id)) {
          const s = states.get(id);
          if (s?.user?.name && id !== awareness.clientID) {
            setPresenceEvents(prev => [
              ...prev,
              { id: `${id}-${Date.now()}`, message: `${s.user.name} joined`, type: 'join', timestamp: Date.now() }
            ]);
          }
        }
      });

      // Detect leaves
      prevClients.forEach(id => {
        if (!currentClients.has(id)) {
          setPresenceEvents(prev => [
            ...prev,
            { id: `${id}-${Date.now()}`, message: 'Collaborator disconnected', type: 'leave', timestamp: Date.now() }
          ]);
        }
      });

      prevClients = currentClients;
      setCollaborators(list);
    };

    awareness.on('change', updateCollaborators);
    updateCollaborators();

    // Observe shared files map
    const filesMap = ydoc.getMap<string>('project_files');
    const updateFilesList = () => {
      const fileList: ProjectFile[] = [];
      filesMap.forEach((lang, p) => fileList.push({ path: p, language: lang }));
      fileList.sort((a, b) => a.path.localeCompare(b.path));
      setFiles(fileList);
    };
    filesMap.observe(updateFilesList);
    updateFilesList();

    return () => {
      filesMap.unobserve(updateFilesList);
      awareness.off('change', updateCollaborators);
      wsProvider.off('status', onStatus);
      wsProvider.destroy();
      ydoc.destroy();
      setDoc(null);
      setProvider(null);
      setIsConnected(false);
      setFiles([]);
      setCollaborators([]);
    };
  }, [activeRoom]); // ← Only reconnect when room actually changes, not on every user update

  // ─── Keep awareness in sync with user changes (no reconnect needed) ──────────
  useEffect(() => {
    if (provider?.awareness) {
      provider.awareness.setLocalStateField('user', {
        name: userName,
        color: userColor
      });
    }
  }, [userName, userColor, provider]);

  // ─── File Operations ──────────────────────────────────────────────────────────

  const createFile = useCallback((filePath: string) => {
    if (!doc) return;
    const clean = filePath.trim();
    if (!clean) return;

    const filesMap = doc.getMap<string>('project_files');
    if (filesMap.has(clean)) return; // Guard against duplicate creation

    const language = getLanguageFromFilename(clean);
    filesMap.set(clean, language);

    // Seed an empty Y.Text for the file if it doesn't already exist
    const yText = doc.getText(`file:${clean}`);
    if (yText.length === 0) {
      yText.insert(0, '');
    }
  }, [doc]);

  const deleteFile = useCallback((filePath: string) => {
    if (!doc) return;
    const filesMap = doc.getMap<string>('project_files');
    filesMap.delete(filePath);
    // Note: we intentionally leave the Y.Text alive so undo still works,
    // it will be GC'd by Yjs when the room is idle
  }, [doc]);

  const renameFile = useCallback((oldPath: string, newPath: string) => {
    if (!doc) return;
    const cleanNew = newPath.trim();
    if (!cleanNew || cleanNew === oldPath) return;

    const filesMap = doc.getMap<string>('project_files');
    if (!filesMap.has(oldPath)) return;

    const oldText = doc.getText(`file:${oldPath}`);
    const content = oldText.toString();

    const newLang = getLanguageFromFilename(cleanNew);
    const newText = doc.getText(`file:${cleanNew}`);
    if (newText.length > 0) newText.delete(0, newText.length);
    newText.insert(0, content);

    filesMap.delete(oldPath);
    filesMap.set(cleanNew, newLang);
  }, [doc]);

  const value = useMemo(() => ({
    doc,
    provider,
    collaborators,
    currentUser,
    isConnected,
    roomName: activeRoom,
    files,
    createFile,
    deleteFile,
    renameFile,
    presenceEvents
  }), [doc, provider, collaborators, currentUser, isConnected, activeRoom, files, createFile, deleteFile, renameFile, presenceEvents]);

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaborationContext = () => {
  const ctx = useContext(CollaborationContext);
  if (!ctx) throw new Error('useCollaborationContext must be used within CollaborationProvider');
  return ctx;
};
