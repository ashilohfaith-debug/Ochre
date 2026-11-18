import React from 'react';
import { Bell, BellOff, Trash2, X, FileCode, User, Clock, ArrowRight } from 'lucide-react';
import { useNotifications, CollabNotification } from '../../providers/NotificationProvider';

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface SavedCardProps {
  notification: CollabNotification;
  onRemove: () => void;
}

const SavedCard: React.FC<SavedCardProps> = ({ notification, onRemove }) => {
  const fileName = notification.filePath.split('/').pop() ?? notification.filePath;
  const hasDiff = notification.previousContent !== notification.updatedContent;

  return (
    <div className="border border-matte-border rounded-lg overflow-hidden mb-2">
      {/* Card header */}
      <div className="flex items-center justify-between px-2.5 py-2 bg-matte-100/60">
        <div className="flex items-center gap-2 text-[11px] overflow-hidden">
          <User className="w-3 h-3 text-ochre flex-shrink-0" />
          <span className="text-white font-semibold truncate">{notification.userName}</span>
          <FileCode className="w-3 h-3 text-matte-muted flex-shrink-0" />
          <span className="font-mono text-matte-muted truncate">{fileName}</span>
          <span className="text-ochre font-mono flex-shrink-0">:{notification.lineNumber}</span>
        </div>
        <button
          onClick={onRemove}
          className="p-0.5 text-matte-muted hover:text-red-400 rounded transition-colors flex-shrink-0 ml-1"
          title="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Diff */}
      {hasDiff && (
        <div className="px-2.5 py-2 bg-matte-400 space-y-1">
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-red-400 font-mono mt-0.5 w-8 flex-shrink-0">was</span>
            <pre className="text-[10px] font-mono text-red-300 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5 flex-1 whitespace-pre-wrap break-all">
              {notification.previousContent || '(empty)'}
            </pre>
          </div>
          <ArrowRight className="w-3 h-3 text-matte-muted ml-10" />
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-green-400 font-mono mt-0.5 w-8 flex-shrink-0">now</span>
            <pre className="text-[10px] font-mono text-green-300 bg-green-500/10 border border-green-500/20 rounded px-1.5 py-0.5 flex-1 whitespace-pre-wrap break-all">
              {notification.updatedContent || '(empty)'}
            </pre>
          </div>
        </div>
      )}

      {/* Timestamp footer */}
      <div className="px-2.5 py-1 bg-matte-300/30 border-t border-matte-border flex items-center gap-1 text-[10px] text-matte-muted">
        <Clock className="w-3 h-3" />
        <span>{formatTime(notification.timestamp)}</span>
      </div>
    </div>
  );
};

export const NotificationsPanel: React.FC = () => {
  const { enabled, setEnabled, savedNotifications, removeSaved, clearSaved } = useNotifications();

  return (
    <div className="flex flex-col h-full bg-matte-200 select-none">
      {/* Header */}
      <div className="px-3 py-2 border-b border-matte-border bg-matte-300/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-ochre" />
            <span className="text-xs font-semibold uppercase tracking-wider text-matte-muted">Notifications</span>
            {savedNotifications.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-ochre/20 text-ochre rounded font-mono font-bold">
                {savedNotifications.length}
              </span>
            )}
          </div>
          {savedNotifications.length > 0 && (
            <button
              onClick={clearSaved}
              className="p-1 text-matte-muted hover:text-red-400 hover:bg-matte-hover rounded transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Enable / Disable toggle */}
        <button
          onClick={() => setEnabled(!enabled)}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded border text-[11px] font-semibold transition-colors ${
            enabled
              ? 'bg-ochre/15 border-ochre/30 text-ochre hover:bg-ochre/20'
              : 'bg-matte-100 border-matte-border text-matte-muted hover:border-matte-text'
          }`}
        >
          <span className="flex items-center gap-1.5">
            {enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            {enabled ? 'Notifications Enabled' : 'Notifications Disabled'}
          </span>
          <span className={`w-8 h-4 rounded-full transition-colors relative ${enabled ? 'bg-ochre' : 'bg-matte-border'}`}>
            <span
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </span>
        </button>
      </div>

      {/* Saved notifications list */}
      <div className="flex-1 overflow-y-auto p-2">
        {savedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Bell className="w-8 h-8 text-matte-muted/40 mb-2" />
            <p className="text-xs text-matte-muted">No saved notifications.</p>
            <p className="text-[11px] text-matte-muted/60 mt-1">
              Use "Keep Aside" on a popup to save it here.
            </p>
          </div>
        ) : (
          savedNotifications.map(n => (
            <SavedCard
              key={n.id}
              notification={n}
              onRemove={() => removeSaved(n.id)}
            />
          ))
        )}
      </div>

      {!enabled && (
        <div className="px-3 py-2 border-t border-matte-border bg-yellow-500/5 text-[11px] text-yellow-400/80 text-center">
          Popups disabled. Collaboration still active.
        </div>
      )}
    </div>
  );
};
