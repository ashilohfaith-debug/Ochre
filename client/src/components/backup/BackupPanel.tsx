import React, { useState, useMemo } from 'react';
import { DatabaseBackup, Trash2, ChevronDown, ChevronRight, FileCode, Clock, User, Diff, RotateCcw, AlertTriangle } from 'lucide-react';
import { useBackup, BackupEntry } from '../../providers/BackupProvider';

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function changeTypeBadge(type: BackupEntry['changeType']): React.ReactElement {
  const styles: Record<BackupEntry['changeType'], string> = {
    insert: 'bg-green-500/20 text-green-400 border-green-500/30',
    delete: 'bg-red-500/20 text-red-400 border-red-500/30',
    replace: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wide ${styles[type]}`}>
      {type}
    </span>
  );
}

interface EntryRowProps {
  entry: BackupEntry;
  onRestore: (entry: BackupEntry) => void;
}

const EntryRow: React.FC<EntryRowProps> = ({ entry, onRestore }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileName = entry.filePath.split('/').pop() ?? entry.filePath;

  return (
    <div className="border border-matte-border rounded overflow-hidden mb-1">
      {/* Header row */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center gap-2 px-2.5 py-2 bg-matte-100/60 hover:bg-matte-hover text-left transition-colors"
      >
        <span className="text-matte-muted flex-shrink-0">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </span>

        {/* Time */}
        <span className="flex items-center gap-1 text-[10px] font-mono text-matte-muted flex-shrink-0 w-20">
          <Clock className="w-3 h-3 text-ochre" />
          {formatTime(entry.timestamp)}
        </span>

        {/* User */}
        <span className="flex items-center gap-1 text-[10px] text-white flex-shrink-0 max-w-[80px] truncate">
          <User className="w-3 h-3 text-ochre flex-shrink-0" />
          {entry.userName}
        </span>

        {/* File + line */}
        <span className="flex items-center gap-1 text-[10px] font-mono text-matte-muted truncate flex-1 min-w-0">
          <FileCode className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{fileName}</span>
          <span className="text-ochre flex-shrink-0">:{entry.lineNumber}</span>
        </span>

        {/* Change type badge */}
        <span className="flex-shrink-0">{changeTypeBadge(entry.changeType)}</span>
      </button>

      {/* Expanded diff view */}
      {expanded && (
        <div className="bg-matte-400 px-3 py-2 space-y-1.5 border-t border-matte-border">
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-red-400 font-semibold w-12 flex-shrink-0 font-mono mt-0.5">Before</span>
            <pre className="text-[11px] font-mono text-red-300 bg-red-500/10 border border-red-500/20 rounded px-2 py-1 flex-1 whitespace-pre-wrap break-all">
              {entry.previousContent || '(empty)'}
            </pre>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-green-400 font-semibold w-12 flex-shrink-0 font-mono mt-0.5">After</span>
            <pre className="text-[11px] font-mono text-green-300 bg-green-500/10 border border-green-500/20 rounded px-2 py-1 flex-1 whitespace-pre-wrap break-all">
              {entry.updatedContent || '(empty)'}
            </pre>
          </div>

          {/* Restore action */}
          {!confirming ? (
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-ochre/15 hover:bg-ochre/25 border border-ochre/40 text-ochre text-[11px] font-semibold rounded transition-colors"
                title="Restore file to this exact state"
              >
                <RotateCcw className="w-3 h-3" />
                Restore to this point
              </button>
            </div>
          ) : (
            <div className="pt-1 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] text-yellow-400 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                This will overwrite the current content of <span className="font-mono">{fileName}</span>. All collaborators will see the change instantly.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { onRestore(entry); setConfirming(false); setExpanded(false); }}
                  className="flex-1 py-1 bg-ochre hover:bg-ochre-hover text-white text-[11px] font-bold rounded transition-colors"
                >
                  Confirm Restore
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-1 bg-matte-300 hover:bg-matte-hover text-matte-muted hover:text-white text-[11px] rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const BackupPanel: React.FC = () => {
  const { entries, clearHistory, restoreToEntry } = useBackup();
  const [filterFile, setFilterFile] = useState('');
  const [filterUser, setFilterUser] = useState('');

  // Unique file paths for filter
  const filePaths = useMemo(() => {
    const paths = new Set(entries.map(e => e.filePath));
    return Array.from(paths);
  }, [entries]);

  // Unique users for filter
  const users = useMemo(() => {
    const names = new Set(entries.map(e => e.userName));
    return Array.from(names);
  }, [entries]);

  const filtered = useMemo(() => {
    return entries
      .filter(e => !filterFile || e.filePath === filterFile)
      .filter(e => !filterUser || e.userName === filterUser)
      .slice()
      .reverse(); // newest first
  }, [entries, filterFile, filterUser]);

  return (
    <div className="flex flex-col h-full bg-matte-200 select-none">
      {/* Header */}
      <div className="px-3 py-2 border-b border-matte-border bg-matte-300/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DatabaseBackup className="w-4 h-4 text-ochre" />
          <span className="text-xs font-semibold uppercase tracking-wider text-matte-muted">Backup</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-ochre/20 text-ochre rounded font-mono font-bold">
            {entries.length} changes
          </span>
        </div>
        <button
          onClick={clearHistory}
          title="Clear history"
          className="p-1 text-matte-muted hover:text-red-400 hover:bg-matte-hover rounded transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filters */}
      <div className="px-3 py-2 border-b border-matte-border flex gap-2 flex-wrap bg-matte-300/20">
        <select
          value={filterFile}
          onChange={e => setFilterFile(e.target.value)}
          className="flex-1 min-w-0 bg-matte-100 border border-matte-border rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-ochre"
        >
          <option value="">All files</option>
          {filePaths.map(fp => (
            <option key={fp} value={fp}>{fp.split('/').pop()}</option>
          ))}
        </select>
        <select
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
          className="flex-1 min-w-0 bg-matte-100 border border-matte-border rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-ochre"
        >
          <option value="">All users</option>
          {users.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <DatabaseBackup className="w-8 h-8 text-matte-muted/40 mb-2" />
            <p className="text-xs text-matte-muted">No changes recorded yet.</p>
            <p className="text-[11px] text-matte-muted/60 mt-1">
              Every edit made by any collaborator will appear here.
            </p>
          </div>
        ) : (
          filtered.map(entry => (
            <EntryRow key={entry.id} entry={entry} onRestore={restoreToEntry} />
          ))
        )}
      </div>

      {/* Footer summary */}
      {filtered.length > 0 && (
        <div className="px-3 py-1.5 border-t border-matte-border bg-matte-300/30 text-[10px] text-matte-muted flex justify-between">
          <span>Showing {filtered.length} of {entries.length} changes</span>
          <span className="flex items-center gap-1">
            <Diff className="w-3 h-3 text-ochre" />
            Click any row to expand diff
          </span>
        </div>
      )}
    </div>
  );
};
