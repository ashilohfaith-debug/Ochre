import React from 'react';
import { Bell, X, Bookmark, User, FileCode, ArrowRight } from 'lucide-react';
import { useNotifications } from '../../providers/NotificationProvider';

export const CollabNotificationPopup: React.FC = () => {
  const { activeNotification, ignore, keepAside, enabled } = useNotifications();

  if (!enabled || !activeNotification) return null;

  const fileName = activeNotification.filePath.split('/').pop() ?? activeNotification.filePath;
  const hasDiff = activeNotification.previousContent !== activeNotification.updatedContent;

  return (
    <div
      className="absolute bottom-10 right-72 z-50 w-72 bg-matte-100 border border-matte-border rounded-lg shadow-2xl overflow-hidden"
      style={{ animation: 'slideInRight 0.2s ease-out' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-matte-300/60 border-b border-matte-border">
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-ochre" />
          <span className="text-xs font-semibold text-white">Collaboration Change</span>
        </div>
        <button
          onClick={ignore}
          className="p-0.5 text-matte-muted hover:text-white hover:bg-matte-hover rounded transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 space-y-2">
        {/* Who + where */}
        <div className="flex items-center gap-2 text-[11px]">
          <User className="w-3 h-3 text-ochre flex-shrink-0" />
          <span className="text-white font-semibold">{activeNotification.userName}</span>
          <span className="text-matte-muted">changed</span>
          <FileCode className="w-3 h-3 text-ochre flex-shrink-0" />
          <span className="font-mono text-white truncate">{fileName}</span>
          <span className="text-ochre font-mono flex-shrink-0">:{activeNotification.lineNumber}</span>
        </div>

        {/* Diff */}
        {hasDiff && (
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-red-400 font-mono mt-0.5 w-8 flex-shrink-0">was</span>
              <pre className="text-[10px] font-mono text-red-300 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5 flex-1 whitespace-pre-wrap break-all line-clamp-2">
                {activeNotification.previousContent || '(empty)'}
              </pre>
            </div>
            <div className="flex items-center gap-1 pl-10">
              <ArrowRight className="w-3 h-3 text-matte-muted" />
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-green-400 font-mono mt-0.5 w-8 flex-shrink-0">now</span>
              <pre className="text-[10px] font-mono text-green-300 bg-green-500/10 border border-green-500/20 rounded px-1.5 py-0.5 flex-1 whitespace-pre-wrap break-all line-clamp-2">
                {activeNotification.updatedContent || '(empty)'}
              </pre>
            </div>
          </div>
        )}

        {!hasDiff && (
          <p className="text-[11px] text-matte-muted italic">Line {activeNotification.lineNumber} was modified.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex border-t border-matte-border">
        <button
          onClick={ignore}
          className="flex-1 py-2 text-[11px] font-semibold text-matte-muted hover:text-white hover:bg-matte-hover transition-colors border-r border-matte-border"
        >
          IGNORE
        </button>
        <button
          onClick={keepAside}
          className="flex-1 py-2 text-[11px] font-semibold text-ochre hover:text-ochre-light hover:bg-ochre/10 transition-colors flex items-center justify-center gap-1"
        >
          <Bookmark className="w-3 h-3" />
          KEEP ASIDE
        </button>
      </div>
    </div>
  );
};
