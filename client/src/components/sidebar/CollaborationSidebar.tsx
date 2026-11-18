import React from 'react';
import { Users, Circle, Key, Copy, Check } from 'lucide-react';
import { useCollaboration } from '../../hooks/useCollaboration';

export const CollaborationSidebar: React.FC = () => {
  const { collaborators, currentUser, roomName, isConnected } = useCollaboration();
  const [copied, setCopied] = React.useState(false);

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-64 bg-matte-200 border-l border-matte-border flex flex-col h-full select-none">
      {/* Header */}
      <div className="h-9 px-3 border-b border-matte-border flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-matte-muted">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-ochre" />
          <span>Collaboration</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 bg-ochre/20 text-ochre rounded font-mono font-bold">
          YJS CRDT
        </span>
      </div>

      {/* Room Information */}
      <div className="p-3 border-b border-matte-border bg-matte-300/40">
        <div className="text-[11px] font-semibold text-matte-muted uppercase mb-1">Active Room</div>
        <div className="flex items-center justify-between bg-matte-100 p-2 rounded border border-matte-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <Key className="w-3.5 h-3.5 text-ochre flex-shrink-0" />
            <span className="text-xs font-mono text-white truncate">{roomName}</span>
          </div>
          <button
            onClick={handleCopyRoom}
            className="text-matte-muted hover:text-white transition-colors p-1"
            title="Copy room name"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Online Developers Section */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-matte-muted border-b border-matte-border/50 flex items-center justify-between">
          <span>Online Developers ({collaborators.length})</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>

        <div className="p-2 space-y-1">
          {collaborators.map((c) => {
            const isSelf = c.name === currentUser.name;
            return (
              <div
                key={c.clientId}
                className="p-2 rounded bg-matte-100/60 border border-matte-border flex items-center justify-between transition-colors hover:border-matte-muted"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="relative">
                    <Circle className="w-2.5 h-2.5 text-green-500 fill-green-500" />
                  </div>

                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20"
                    style={{ backgroundColor: c.color }}
                  />

                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-medium text-white truncate flex items-center gap-1">
                      {c.name}
                      {isSelf && <span className="text-[10px] text-matte-muted font-normal">(You)</span>}
                    </span>
                    {c.cursor && (
                      <span className="text-[10px] font-mono text-matte-muted">
                        Ln {c.cursor.line}, Col {c.cursor.column}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: c.color }}
                  title={`${c.name}'s cursor color`}
                />
              </div>
            );
          })}

          {collaborators.length === 0 && (
            <div className="p-4 text-center text-xs text-matte-muted italic">
              Connecting to workspace...
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-matte-border text-[11px] text-matte-muted bg-matte-300/30">
        <div className="flex justify-between items-center mb-1">
          <span>Engine:</span>
          <span className="font-mono text-white">Yjs + y-monaco</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Status:</span>
          <span className={isConnected ? 'text-green-400 font-semibold' : 'text-yellow-400'}>
            {isConnected ? '🟢 Synchronized' : '🟡 Connecting'}
          </span>
        </div>
      </div>
    </aside>
  );
};
