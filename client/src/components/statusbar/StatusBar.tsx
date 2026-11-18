import React from 'react';
import { useCollaboration } from '../../hooks/useCollaboration';

interface StatusBarProps {
  cursorPos: { line: number; column: number };
  language: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ cursorPos, language }) => {
  const { isConnected, collaborators } = useCollaboration();

  return (
    <footer className="h-6 bg-matte-300 border-t border-matte-border flex items-center justify-between px-3 text-[11px] text-matte-muted select-none z-20 font-mono">
      {/* Left side items */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="text-white font-medium">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <span>{collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''} online</span>
      </div>

      {/* Right side items */}
      <div className="flex items-center gap-4">
        <button className="hover:text-white transition-colors">
          Ln {cursorPos.line}, Col {cursorPos.column}
        </button>
        <button className="hover:text-white transition-colors">Spaces: 2</button>
        <button className="hover:text-white transition-colors">UTF-8</button>
        <button className="hover:text-white transition-colors capitalize text-ochre font-semibold">
          {language || 'TypeScript'}
        </button>
      </div>
    </footer>
  );
};
