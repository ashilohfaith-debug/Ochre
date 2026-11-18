import React, { useState } from 'react';
import { FileCode, Plus, Trash2, Edit2, Check, X, FilePlus } from 'lucide-react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { getFileColor } from '../../utils/language';

interface FileExplorerProps {
  activeFile: string;
  onSelectFile: (filePath: string) => void;
  onDeleteActiveFile?: (filePath: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  activeFile,
  onSelectFile,
  onDeleteActiveFile
}) => {
  const { files, createFile, deleteFile, renameFile } = useCollaboration();

  // Create file input state
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Editing file name state
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    createFile(newFileName.trim());
    onSelectFile(newFileName.trim());
    setNewFileName('');
    setIsCreating(false);
  };

  const handleRenameSubmit = (oldPath: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editingName.trim() || editingName.trim() === oldPath) {
      setEditingPath(null);
      return;
    }

    renameFile(oldPath, editingName.trim());
    if (activeFile === oldPath) {
      onSelectFile(editingName.trim());
    }
    setEditingPath(null);
  };

  const handleDelete = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFile(path);
    if (onDeleteActiveFile && activeFile === path) {
      onDeleteActiveFile(path);
    }
  };

  return (
    <div className="w-60 bg-matte-200 border-r border-matte-border flex flex-col h-full select-none">
      {/* Section Header */}
      <div className="h-9 px-3 border-b border-matte-border flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-matte-muted">
        <span>Files ({files.length})</span>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-matte-hover hover:text-white text-matte-muted rounded transition-colors"
          title="Create New File"
        >
          <Plus className="w-4 h-4 text-ochre" />
        </button>
      </div>

      {/* Inline Create File Form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-matte-border bg-matte-100 flex items-center gap-1">
          <input
            type="text"
            autoFocus
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="filename (e.g. main.py)"
            className="flex-1 bg-matte-300 border border-matte-border rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-ochre"
          />
          <button type="submit" className="p-1 text-green-400 hover:text-green-300">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setIsCreating(false)} className="p-1 text-matte-muted hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <div className="p-4 text-center text-xs text-matte-muted italic space-y-2">
            <FilePlus className="w-6 h-6 mx-auto text-matte-muted/60" />
            <p>No files in workspace.</p>
            <button
              onClick={() => setIsCreating(true)}
              className="text-ochre hover:underline font-semibold"
            >
              + Create first file
            </button>
          </div>
        ) : (
          files.map((file) => {
            const isActive = activeFile === file.path;
            const isEditing = editingPath === file.path;
            const colorClass = getFileColor(file.path);

            if (isEditing) {
              return (
                <form
                  key={file.path}
                  onSubmit={(e) => handleRenameSubmit(file.path, e)}
                  className="px-2 py-1 flex items-center gap-1 bg-matte-100 border-y border-matte-border"
                >
                  <input
                    type="text"
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 bg-matte-300 border border-matte-border rounded px-2 py-0.5 text-xs font-mono text-white focus:outline-none focus:border-ochre"
                  />
                  <button type="submit" className="p-1 text-green-400 hover:text-green-300">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setEditingPath(null)} className="p-1 text-matte-muted hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              );
            }

            return (
              <div
                key={file.path}
                onClick={() => onSelectFile(file.path)}
                className={`w-full h-7 px-3 flex items-center justify-between text-xs transition-colors cursor-pointer group font-mono ${
                  isActive
                    ? 'bg-matte-100 text-ochre border-l-2 border-ochre'
                    : 'text-matte-text hover:bg-matte-hover hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileCode className={`w-4 h-4 ${colorClass}`} />
                  <span className="truncate">{file.path}</span>
                </div>

                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPath(file.path);
                      setEditingName(file.path);
                    }}
                    className="p-1 text-matte-muted hover:text-white transition-colors"
                    title="Rename file"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(file.path, e)}
                    className="p-1 text-matte-muted hover:text-red-400 transition-colors"
                    title="Delete file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
