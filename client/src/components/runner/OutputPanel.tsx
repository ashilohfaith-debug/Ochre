import React, { useState } from 'react';
import { Terminal, Globe, Trash2, X, Play, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ExecutionResult } from '../../services/runner';

interface OutputPanelProps {
  result: ExecutionResult | null;
  onClose: () => void;
  onClear: () => void;
  onReRun?: () => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  result,
  onClose,
  onClear,
  onReRun
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'preview'>(
    result?.mode === 'preview' ? 'preview' : 'console'
  );

  if (!result) return null;

  return (
    <div className="h-64 bg-matte-300 border-t-2 border-ochre flex flex-col z-30 select-none shadow-2xl">
      {/* Header Bar */}
      <div className="h-9 px-4 bg-matte-200 border-b border-matte-border flex items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('console')}
            className={`h-9 px-3 flex items-center gap-1.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'console'
                ? 'border-ochre text-ochre bg-matte-100'
                : 'border-transparent text-matte-muted hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Console Output</span>
            {result.logs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-matte-300 rounded-full font-mono text-white">
                {result.logs.length}
              </span>
            )}
          </button>

          {result.htmlContent && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`h-9 px-3 flex items-center gap-1.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'preview'
                  ? 'border-ochre text-ochre bg-matte-100'
                  : 'border-transparent text-matte-muted hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Live Web Preview</span>
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-mono text-matte-muted pr-3 border-r border-matte-border">
            <Clock className="w-3 h-3 text-ochre" />
            <span>{result.durationMs}ms</span>
          </div>

          {onReRun && (
            <button
              onClick={onReRun}
              className="p-1 text-green-400 hover:text-green-300 hover:bg-matte-hover rounded transition-colors"
              title="Re-run code"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onClear}
            className="p-1 text-matte-muted hover:text-white hover:bg-matte-hover rounded transition-colors"
            title="Clear console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1 text-matte-muted hover:text-white hover:bg-matte-hover rounded transition-colors"
            title="Close output drawer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'console' ? (
          <div className="w-full h-full bg-matte-400 p-4 font-mono text-xs overflow-y-auto space-y-1.5">
            {result.logs.length === 0 ? (
              <div className="text-matte-muted italic text-center py-6">
                No output generated.
              </div>
            ) : (
              result.logs.map((log, index) => {
                let colorClass = 'text-matte-text';
                let icon = <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />;

                if (log.type === 'info') {
                  colorClass = 'text-blue-400';
                  icon = <Terminal className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
                } else if (log.type === 'warn') {
                  colorClass = 'text-yellow-400';
                  icon = <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />;
                } else if (log.type === 'error') {
                  colorClass = 'text-red-400 font-semibold';
                  icon = <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
                } else if (log.type === 'result') {
                  colorClass = 'text-ochre font-semibold';
                  icon = <CheckCircle2 className="w-3.5 h-3.5 text-ochre flex-shrink-0" />;
                }

                return (
                  <div key={index} className={`flex items-start gap-2 ${colorClass}`}>
                    <span className="text-[10px] text-matte-muted opacity-60 flex-shrink-0">{log.timestamp}</span>
                    {icon}
                    <pre className="whitespace-pre-wrap font-mono flex-1">{log.text}</pre>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-white">
            <iframe
              title="Live Web Preview"
              srcDoc={result.htmlContent}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
            />
          </div>
        )}
      </div>
    </div>
  );
};
