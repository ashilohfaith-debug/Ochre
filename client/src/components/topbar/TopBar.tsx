import React, { useState } from 'react';
import { FileCode, Users, Wifi, ArrowLeft, Copy, Check, KeyRound, X, Play, GitBranch } from 'lucide-react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { useAuth } from '../../providers/AuthProvider';
import { getFileColor } from '../../utils/language';

interface TopBarProps {
  projectName: string;
  joinCode?: string;
  activeBranch?: string;
  activeFile?: string;
  openFiles: string[];
  onSelectFile: (filePath: string) => void;
  onCloseFile: (filePath: string) => void;
  onBackToDashboard: () => void;
  onRunCode?: () => void;
  isRunning?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  joinCode,
  activeBranch,
  activeFile,
  openFiles,
  onSelectFile,
  onCloseFile,
  onBackToDashboard,
  onRunCode,
  isRunning
}) => {
  const { isConnected, collaborators } = useCollaboration();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (joinCode) {
      navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="h-10 bg-matte-300 border-b border-matte-border flex items-center justify-between px-3 select-none z-10">
      {/* Left: Back to Dashboard & Project Title & Run Button & Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1 px-2 py-1 bg-matte-200 hover:bg-matte-hover border border-matte-border text-matte-muted hover:text-white rounded text-xs transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2 pr-3 border-r border-matte-border font-semibold text-xs text-white">
          <span className="w-2.5 h-2.5 rounded-full bg-ochre" />
          <span>{projectName}</span>
        </div>

        {/* Active branch pill */}
        {activeBranch && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-matte-200 border border-matte-border rounded text-xs font-mono text-matte-muted">
            <GitBranch className="w-3 h-3 text-ochre" />
            <span className="text-white">{activeBranch}</span>
          </div>
        )}

        {/* 6-Digit Join Code pill */}
        {joinCode && (
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-matte-200 hover:bg-matte-hover border border-matte-border rounded text-xs font-mono text-ochre transition-colors"
            title="Click to copy 6-digit project join code"
          >
            <KeyRound className="w-3 h-3 text-matte-muted" />
            <span className="font-bold tracking-wide">{joinCode}</span>
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-matte-muted" />}
          </button>
        )}

        {/* ▶️ RUN CODE BUTTON */}
        {onRunCode && activeFile && (
          <button
            onClick={onRunCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            title="Run active file (Ctrl+Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        )}

        {/* File Tabs */}
        <div className="flex items-center gap-1">
          {openFiles.map(filePath => {
            const fileName = filePath.split('/').pop() || filePath;
            const isActive = activeFile === filePath;
            const colorClass = getFileColor(filePath);

            return (
              <div
                key={filePath}
                onClick={() => onSelectFile(filePath)}
                className={`h-8 px-3 flex items-center gap-2 text-xs border-r border-matte-border transition-colors font-mono cursor-pointer group ${
                  isActive 
                    ? 'bg-matte-200 text-ochre border-t-2 border-t-ochre font-medium' 
                    : 'bg-matte-300 text-matte-muted hover:bg-matte-hover hover:text-matte-text'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 ${colorClass}`} />
                <span>{fileName}</span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseFile(filePath);
                  }}
                  className="p-0.5 rounded text-matte-muted hover:text-white hover:bg-matte-hover transition-colors opacity-70 group-hover:opacity-100"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: User Profile & Connection Status */}
      <div className="flex items-center gap-3">
        {/* Connection status indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-matte-200 rounded border border-matte-border text-[11px]">
          <Wifi className={`w-3 h-3 ${isConnected ? 'text-green-500' : 'text-red-500 animate-pulse'}`} />
          <span className="text-matte-muted">{isConnected ? 'Live CRDT' : 'Connecting...'}</span>
        </div>

        {/* Active Collaborators count */}
        <div className="flex items-center gap-1.5 text-xs text-matte-muted bg-matte-200 px-2 py-1 rounded border border-matte-border">
          <Users className="w-3.5 h-3.5 text-ochre" />
          <span>{collaborators.length} Online</span>
        </div>

        {/* Current Authenticated User Badge */}
        {user && (
          <div className="flex items-center gap-1.5 text-xs bg-matte-200 px-2 py-1 rounded border border-matte-border">
            <span 
              className="w-2.5 h-2.5 rounded-full inline-block border border-white/20" 
              style={{ backgroundColor: user.color }} 
            />
            <span className="font-semibold text-white">{user.username}</span>
          </div>
        )}
      </div>
    </header>
  );
};
