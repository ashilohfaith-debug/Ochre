import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo
} from 'react';
import * as Y from 'yjs';
import { useCollaborationContext } from './CollaborationProvider';

export interface CollabNotification {
  id: string;
  timestamp: number;
  userName: string;
  filePath: string;
  lineNumber: number;
  previousContent: string;
  updatedContent: string;
}

interface NotificationContextType {
  /** Notifications enabled toggle */
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  /** Current visible popup notification */
  activeNotification: CollabNotification | null;
  /** Dismiss the popup without saving */
  ignore: () => void;
  /** Dismiss popup and save to the saved list */
  keepAside: () => void;
  /** Saved aside notifications */
  savedNotifications: CollabNotification[];
  /** Remove a saved notification */
  removeSaved: (id: string) => void;
  /** Clear all saved */
  clearSaved: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  enabled: true,
  setEnabled: () => {},
  activeNotification: null,
  ignore: () => {},
  keepAside: () => {},
  savedNotifications: [],
  removeSaved: () => {},
  clearSaved: () => {}
});

// How long (ms) to wait after a change before possibly showing a notification
// (debounce so rapid typing doesn't spam popups)
const DEBOUNCE_MS = 800;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { doc, provider, files, currentUser } = useCollaborationContext();

  const [enabled, setEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('ochre_notifications_enabled');
    return stored === null ? true : stored === 'true';
  });

  const [activeNotification, setActiveNotification] = useState<CollabNotification | null>(null);
  const [savedNotifications, setSavedNotifications] = useState<CollabNotification[]>([]);
  const [queue, setQueue] = useState<CollabNotification[]>([]);

  // Persist enabled preference
  useEffect(() => {
    localStorage.setItem('ochre_notifications_enabled', String(enabled));
  }, [enabled]);

  // Drain queue into activeNotification one at a time
  useEffect(() => {
    if (!enabled) return;
    if (activeNotification) return;
    if (queue.length === 0) return;

    const [next, ...rest] = queue;
    setActiveNotification(next);
    setQueue(rest);
  }, [enabled, activeNotification, queue]);

  const ignore = useCallback(() => {
    setActiveNotification(null);
  }, []);

  const keepAside = useCallback(() => {
    if (activeNotification) {
      setSavedNotifications(prev => [activeNotification, ...prev]);
    }
    setActiveNotification(null);
  }, [activeNotification]);

  const removeSaved = useCallback((id: string) => {
    setSavedNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearSaved = useCallback(() => {
    setSavedNotifications([]);
  }, []);

  // Track observers
  const observersRef = useRef<Map<string, () => void>>(new Map());
  const prevContentsRef = useRef<Map<string, string>>(new Map());
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const enqueue = useCallback((n: CollabNotification) => {
    setQueue(prev => [...prev, n]);
  }, []);

  const observeFile = useCallback((filePath: string, yText: Y.Text) => {
    if (observersRef.current.has(filePath)) return;

    const handler = (_event: Y.YTextEvent, txn: Y.Transaction) => {
      if (!provider?.awareness) return;

      // Only notify about changes from OTHER users (not self)
      const origin = txn.origin;
      const selfClientId = provider.awareness.clientID;

      // If origin is our own clientId or null (local change), skip notification
      if (origin === selfClientId || origin === null || origin === undefined) {
        // Still update the snapshot
        prevContentsRef.current.set(filePath, yText.toString());
        return;
      }

      // Debounce per file to avoid notification spam on rapid edits
      const existingTimer = debounceTimers.current.get(filePath);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(() => {
        const currentContent = yText.toString();
        const prevContent = prevContentsRef.current.get(filePath) ?? '';

        if (currentContent === prevContent) return;

        // Determine username from awareness
        let userName = 'Collaborator';
        const states = provider.awareness.getStates();
        states.forEach((state, clientId) => {
          if (clientId === origin && state.user?.name) {
            userName = state.user.name;
          }
        });

        // Find changed line
        const prevLines = prevContent.split('\n');
        const currLines = currentContent.split('\n');
        let changedLine = 1;
        const maxLen = Math.max(prevLines.length, currLines.length);
        for (let i = 0; i < maxLen; i++) {
          if (prevLines[i] !== currLines[i]) {
            changedLine = i + 1;
            break;
          }
        }

        enqueue({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
          userName,
          filePath,
          lineNumber: changedLine,
          previousContent: prevLines[changedLine - 1] ?? '',
          updatedContent: currLines[changedLine - 1] ?? ''
        });

        prevContentsRef.current.set(filePath, currentContent);
      }, DEBOUNCE_MS);

      debounceTimers.current.set(filePath, timer);
    };

    yText.observe(handler);
    prevContentsRef.current.set(filePath, yText.toString());

    observersRef.current.set(filePath, () => yText.unobserve(handler));
  }, [provider, enqueue]);

  // Attach observers when files or doc changes
  useEffect(() => {
    if (!doc || !files.length) return;

    files.forEach(({ path: filePath }) => {
      const yText = doc.getText(`file:${filePath}`);
      observeFile(filePath, yText);
    });

    return () => {
      debounceTimers.current.forEach(t => clearTimeout(t));
      debounceTimers.current.clear();
      observersRef.current.forEach(unobserve => unobserve());
      observersRef.current.clear();
    };
  }, [doc, files, observeFile]);

  const value = useMemo(() => ({
    enabled,
    setEnabled,
    activeNotification,
    ignore,
    keepAside,
    savedNotifications,
    removeSaved,
    clearSaved
  }), [enabled, activeNotification, ignore, keepAside, savedNotifications, removeSaved, clearSaved]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
