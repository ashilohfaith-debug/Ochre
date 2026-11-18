import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, FileCode, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useCollaborationContext } from '../../providers/CollaborationProvider';
import { getFileColor } from '../../utils/language';

interface SearchMatch {
  filePath: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

interface GroupedMatches {
  filePath: string;
  matches: SearchMatch[];
}

interface WorkspaceSearchProps {
  onOpenFile: (filePath: string, line?: number) => void;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const WorkspaceSearch: React.FC<WorkspaceSearchProps> = ({ onOpenFile }) => {
  const { doc, files } = useCollaborationContext();
  const [query, setQuery] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [results, setResults] = useState<GroupedMatches[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback((q: string) => {
    if (!q.trim() || !doc) {
      setResults([]);
      setTotalMatches(0);
      return;
    }

    setSearching(true);

    try {
      // Build regex from query
      let pattern: RegExp;
      if (useRegex) {
        pattern = new RegExp(q, caseSensitive ? 'g' : 'gi');
      } else {
        pattern = new RegExp(escapeRegex(q), caseSensitive ? 'g' : 'gi');
      }

      const grouped: GroupedMatches[] = [];
      let count = 0;

      for (const file of files) {
        const yText = doc.getText(`file:${file.path}`);
        const content = yText.toString();
        if (!content) continue;

        const lines = content.split('\n');
        const fileMatches: SearchMatch[] = [];

        lines.forEach((line, idx) => {
          // Reset lastIndex for global regex each line
          pattern.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = pattern.exec(line)) !== null) {
            fileMatches.push({
              filePath: file.path,
              lineNumber: idx + 1,
              lineContent: line,
              matchStart: match.index,
              matchEnd: match.index + match[0].length
            });
            // Prevent infinite loop on zero-length matches
            if (match[0].length === 0) pattern.lastIndex++;
            count++;
            // Cap results per file to avoid freezing UI
            if (fileMatches.length >= 200) break;
          }
          if (fileMatches.length >= 200) return;
        });

        if (fileMatches.length > 0) {
          grouped.push({ filePath: file.path, matches: fileMatches });
        }
      }

      setResults(grouped);
      setTotalMatches(count);
    } catch {
      // Invalid regex — don't crash
      setResults([]);
      setTotalMatches(0);
    }

    setSearching(false);
  }, [doc, files, useRegex, caseSensitive]);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  const toggleCollapse = (filePath: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      return next;
    });
  };

  // Highlight matching portion of a line
  const renderHighlighted = (match: SearchMatch) => {
    const { lineContent, matchStart, matchEnd } = match;
    // Trim long lines
    const MAX = 100;
    const startPad = Math.max(0, matchStart - 20);
    const display = startPad > 0
      ? '…' + lineContent.slice(startPad, startPad + MAX)
      : lineContent.slice(0, MAX);
    const adjStart = Math.max(0, matchStart - startPad - (startPad > 0 ? 1 : 0));
    const adjEnd = Math.min(display.length, matchEnd - startPad - (startPad > 0 ? 1 : 0));

    return (
      <span className="font-mono text-[11px]">
        <span className="text-matte-text">{display.slice(0, adjStart)}</span>
        <span className="bg-ochre/40 text-white font-semibold">{display.slice(adjStart, adjEnd)}</span>
        <span className="text-matte-text">{display.slice(adjEnd)}</span>
      </span>
    );
  };

  return (
    <div className="w-64 bg-matte-200 border-r border-matte-border flex flex-col h-full select-none">
      {/* Header */}
      <div className="px-3 py-2 border-b border-matte-border bg-matte-300/40">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-3.5 h-3.5 text-ochre" />
          <span className="text-xs font-semibold uppercase tracking-wider text-matte-muted">Search</span>
          {totalMatches > 0 && (
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-ochre/20 text-ochre rounded font-mono">
              {totalMatches} match{totalMatches !== 1 ? 'es' : ''}
            </span>
          )}
        </div>

        {/* Search input */}
        <div className="relative mb-2">
          <Search className="w-3 h-3 text-matte-muted absolute left-2 top-2" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search workspace..."
            className="w-full bg-matte-100 border border-matte-border rounded pl-6 pr-7 py-1.5 text-xs text-white placeholder-matte-muted focus:outline-none focus:border-ochre"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-2 text-matte-muted hover:text-white">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Options */}
        <div className="flex items-center gap-3 text-[11px]">
          <label className="flex items-center gap-1 cursor-pointer text-matte-muted hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={e => setCaseSensitive(e.target.checked)}
              className="w-3 h-3 accent-ochre"
            />
            Aa
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-matte-muted hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={useRegex}
              onChange={e => setUseRegex(e.target.checked)}
              className="w-3 h-3 accent-ochre"
            />
            .*
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto text-xs">
        {searching && (
          <div className="p-4 text-center text-matte-muted text-[11px]">Searching...</div>
        )}

        {!searching && query && results.length === 0 && (
          <div className="p-4 text-center text-matte-muted text-[11px] italic">
            No results for "{query}"
          </div>
        )}

        {!searching && !query && (
          <div className="p-4 text-center text-matte-muted text-[11px] italic">
            Type to search all files in the workspace.
          </div>
        )}

        {results.map(group => {
          const isCollapsed = collapsed.has(group.filePath);
          const fileName = group.filePath.split('/').pop() ?? group.filePath;
          const colorClass = getFileColor(group.filePath);

          return (
            <div key={group.filePath} className="border-b border-matte-border/40">
              {/* File header */}
              <button
                onClick={() => toggleCollapse(group.filePath)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-matte-300/30 hover:bg-matte-hover transition-colors text-left"
              >
                {isCollapsed
                  ? <ChevronRight className="w-3 h-3 text-matte-muted flex-shrink-0" />
                  : <ChevronDown className="w-3 h-3 text-matte-muted flex-shrink-0" />
                }
                <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${colorClass}`} />
                <span className="font-mono text-white truncate flex-1">{fileName}</span>
                <span className="text-[10px] text-matte-muted flex-shrink-0">{group.matches.length}</span>
              </button>

              {/* Match list */}
              {!isCollapsed && (
                <div>
                  {group.matches.map((match, i) => (
                    <button
                      key={i}
                      onClick={() => onOpenFile(match.filePath, match.lineNumber)}
                      className="w-full flex items-start gap-2 px-4 py-1.5 hover:bg-matte-hover transition-colors text-left"
                    >
                      <span className="text-[10px] text-ochre font-mono flex-shrink-0 mt-0.5 w-8 text-right">
                        {match.lineNumber}
                      </span>
                      <div className="flex-1 overflow-hidden truncate">
                        {renderHighlighted(match)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
