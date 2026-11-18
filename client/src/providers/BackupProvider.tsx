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

export interface BackupEntry {
  id: string;
  timestamp: number;
  userName: string;
  filePath: string;
  lineNumber: number;
  previousContent: string;
  updatedContent: string;
  changeType: 'insert' | 'delete' | 'replace';
  /** Full file content at the moment this entry was recorded */
  snapshot: string;
}

interface BackupContextType {
  entries: BackupEntry[];
  clearHistory: () => void;
  restoreToEntry: (entry: BackupEntry) => void;
}

const BackupContext = createContext<BackupContextType>({
  entries: [],
  clearHistory: () => {},
  restoreToEntry: () => {}
});

export const BackupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { doc, provider, files, currentUser } = useCollaborationContext();
  const [entries, setEntries] = useState<BackupEntry[]>([]);
  // Keep track of previous content per file to compute diffs
  const prevContentsRef = useRef<Map<string, string>>(new Map());
  // Keep callbacks to unobserve on cleanup
  const observersRef = useRef<Map<string, () => void>>(new Map());

  const addEntry = useCallback((entry: BackupEntry) => {
    setEntries(prev => [...prev, entry]);
  }, []);

  // Observe a single file's Y.Text
  const observeFile = useCallback((filePath: string, yText: Y.Text) => {
    if (observersRef.current.has(filePath)) return;

    const handler = (_event: Y.YTextEvent, txn: Y.Transaction) => {
      if (!doc) return;

      // Determine who made the change via awareness
      let userName = 'Unknown';
      if (provider?.awareness) {
        const origin = txn.origin;
        // If origin is the local client, use currentUser
        if (origin === null || origin === undefined || origin === provider.awareness.clientID) {
          userName = currentUser.name;
        } else {
          // Try to find the user from awareness states
          const states = provider.awareness.getStates();
          states.forEach((state, clientId) => {
            if (clientId === origin && state.user?.name) {
              userName = state.user.name;
            }
          });
          // If still unknown but from another client, label it
          if (userName === 'Unknown') {
            userName = 'Collaborator';
          }
        }
      }

      const currentContent = yText.toString();
      const prevContent = prevContentsRef.current.get(filePath) ?? '';

      if (currentContent === prevContent) return;

      // Split into lines to detect which line changed
      const prevLines = prevContent.split('\n');
      const currLines = currentContent.split('\n');

      // Find first differing line
      let changedLine = 1;
      const maxLen = Math.max(prevLines.length, currLines.length);
      for (let i = 0; i < maxLen; i++) {
        if (prevLines[i] !== currLines[i]) {
          changedLine = i + 1;
          break;
        }
      }

      const prevLineContent = prevLines[changedLine - 1] ?? '';
      const currLineContent = currLines[changedLine - 1] ?? '';

      let changeType: BackupEntry['changeType'] = 'replace';
      if (prevContent.length < currentContent.length && prevLineContent === '') {
        changeType = 'insert';
      } else if (prevContent.length > currentContent.length && currLineContent === '') {
        changeType = 'delete';
      } else if (prevContent.length < currentContent.length) {
        changeType = 'insert';
      } else if (prevContent.length > currentContent.length) {
        changeType = 'delete';
      }

      addEntry({
        id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        userName,
        filePath,
        lineNumber: changedLine,
        previousContent: prevLineContent,
        updatedContent: currLineContent,
        changeType,
        snapshot: currentContent
      });

      prevContentsRef.current.set(filePath, currentContent);
    };

    yText.observe(handler);

    // Seed initial content snapshot
    prevContentsRef.current.set(filePath, yText.toString());

    observersRef.current.set(filePath, () => {
      yText.unobserve(handler);
    });
  }, [doc, provider, currentUser, addEntry]);

  // When the file list changes, attach observers to new files
  useEffect(() => {
    if (!doc || !files.length) return;

    files.forEach(({ path: filePath }) => {
      const yText = doc.getText(`file:${filePath}`);
      observeFile(filePath, yText);
    });

    // Cleanup removed files
    return () => {
      observersRef.current.forEach((unobserve) => unobserve());
      observersRef.current.clear();
    };
  }, [doc, files, observeFile]);

  const clearHistory = useCallback(() => {
    setEntries([]);
  }, []);

  // Restore the given file to the exact state captured in entry.snapshot.
  // Writes directly into the Yjs Y.Text so all collaborators see the restore instantly.
  const restoreToEntry = useCallback((entry: BackupEntry) => {
    if (!doc) return;
    const yText = doc.getText(`file:${entry.filePath}`);
    const current = yText.toString();
    if (current === entry.snapshot) return; // already at that state, nothing to do
    // Replace the entire file content atomically inside a single Yjs transaction
    doc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, entry.snapshot);
    });
  }, [doc]);

  const value = useMemo(() => ({ entries, clearHistory, restoreToEntry }), [entries, clearHistory, restoreToEntry]);

  return (
    <BackupContext.Provider value={value}>
      {children}
    </BackupContext.Provider>
  );
};

export const useBackup = () => useContext(BackupContext);
