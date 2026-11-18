import React, { useEffect, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useCollaboration } from '../hooks/useCollaboration';
import { bindMonacoToYjs } from './yjsBinding';
import { MonacoBinding } from 'y-monaco';
import { Code2, Plus } from 'lucide-react';

interface MonacoEditorProps {
  filePath?: string;
  language?: string;
  onCursorChange?: (position: { line: number; column: number }) => void;
  onCreateFileClick?: () => void;
  /** When set, the editor will immediately scroll/reveal that line */
  revealLine?: number;
}

export const MonacoEditorContainer: React.FC<MonacoEditorProps> = ({
  filePath,
  language = 'typescript',
  onCursorChange,
  onCreateFileClick,
  revealLine
}) => {
  const { doc, provider } = useCollaboration();
  const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  // Configure Monaco TypeScript & TSX compiler options globally
  const handleBeforeMount = (monacoInstance: typeof monaco) => {
    const tsDefaults = monacoInstance.languages.typescript.typescriptDefaults;
    tsDefaults.setCompilerOptions({
      target: monacoInstance.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monacoInstance.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      jsx: monacoInstance.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      jsxFactory: 'React.createElement',
      allowJs: true,
      typeCheck: true
    });

    tsDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });
  };

  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    setEditorInstance(editor);

    // Custom Ochre Dark Matte Theme
    monacoInstance.editor.defineTheme('ochre-dark-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', background: '141414', foreground: 'cccccc' },
        { token: 'comment', foreground: '666666', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C7722D', fontStyle: 'bold' },
        { token: 'string', foreground: 'a5d6a7' },
        { token: 'number', foreground: 'ffb74d' },
        { token: 'type', foreground: '4fc3f7' },
        { token: 'function', foreground: '818cf8' },
        { token: 'variable', foreground: 'e2e8f0' }
      ],
      colors: {
        'editor.background': '#141414',
        'editor.foreground': '#cccccc',
        'editorCursor.foreground': '#C7722D',
        'editor.lineHighlightBackground': '#1a1a1a',
        'editorLineNumber.foreground': '#444444',
        'editorLineNumber.activeForeground': '#C7722D',
        'editor.selectionBackground': '#C7722D33',
        'editor.inactiveSelectionBackground': '#C7722D20',
        'editorWidget.background': '#181818',
        'editorWidget.border': '#2a2a2a'
      }
    });

    monacoInstance.editor.setTheme('ochre-dark-theme');

    // Track cursor position locally & update awareness
    editor.onDidChangeCursorPosition((e) => {
      const position = {
        line: e.position.lineNumber,
        column: e.position.column
      };

      if (onCursorChange) {
        onCursorChange(position);
      }

      if (provider?.awareness) {
        provider.awareness.setLocalStateField('cursor', position);
      }
    });
  };

  // Re-bind Yjs CRDT whenever active filePath, doc, provider, or editorInstance changes
  useEffect(() => {
    if (!filePath || !editorInstance || !doc || !provider) return;

    // Clean up previous binding
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const yTextKey = `file:${filePath}`;
    console.log(`⚡ Binding Monaco to Yjs CRDT text: "${yTextKey}"`);

    const binding = bindMonacoToYjs(editorInstance, doc, provider, yTextKey);
    bindingRef.current = binding;

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [filePath, doc, provider, editorInstance]);

  // Reveal a specific line when revealLine prop changes (from search results)
  useEffect(() => {
    if (!editorInstance || !revealLine) return;
    editorInstance.revealLineInCenter(revealLine);
    editorInstance.setPosition({ lineNumber: revealLine, column: 1 });
    editorInstance.focus();
  }, [revealLine, editorInstance]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      if (editorInstance) {
        editorInstance.layout();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [editorInstance]);

  // Empty workspace state when no file is selected
  if (!filePath) {
    return (
      <div className="w-full h-full bg-matte-200 flex flex-col items-center justify-center text-center p-6 select-none">
        <div className="w-16 h-16 rounded-2xl bg-matte-100 border border-matte-border flex items-center justify-center text-matte-muted mb-4 shadow-inner">
          <Code2 className="w-8 h-8 text-ochre" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">No file open</h3>
        <p className="text-xs text-matte-muted max-w-sm mb-5">
          Select a file from the Explorer sidebar or create your first file to start editing collaboratively in real time.
        </p>

        {onCreateFileClick && (
          <button
            onClick={onCreateFileClick}
            className="px-4 py-2 bg-ochre hover:bg-ochre-hover text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create New File</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-matte-200 overflow-hidden">
      <Editor
        height="100%"
        width="100%"
        path={filePath}
        defaultLanguage={language}
        language={language}
        beforeMount={handleBeforeMount}
        onMount={handleEditorMount}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: true, renderCharacters: false, maxColumn: 80 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          automaticLayout: true,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          padding: { top: 12, bottom: 12 },
          bracketPairColorization: { enabled: true }
        }}
      />
    </div>
  );
};
