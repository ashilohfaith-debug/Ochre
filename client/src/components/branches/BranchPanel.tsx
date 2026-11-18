import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, Plus, Edit2, Trash2, Check, X, AlertCircle, Lock } from 'lucide-react';
import { BranchRecord, fetchBranchesApi, createBranchApi, renameBranchApi, deleteBranchApi } from '../../services/api';

interface BranchPanelProps {
  projectId: string;
  activeBranch: string;
  onSwitchBranch: (branchName: string) => void;
}

export const BranchPanel: React.FC<BranchPanelProps> = ({ projectId, activeBranch, onSwitchBranch }) => {
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [createError, setCreateError] = useState('');

  // Rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchBranchesApi(projectId);
      setBranches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!newBranchName.trim()) return;
    try {
      const newBranch = await createBranchApi(projectId, newBranchName.trim());
      setBranches(prev => [...prev, newBranch]);
      setNewBranchName('');
      setIsCreating(false);
      // Auto-switch to new branch
      onSwitchBranch(newBranch.name);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create branch');
    }
  };

  const handleRename = async (branchId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      const updated = await renameBranchApi(branchId, editName.trim());
      setBranches(prev => prev.map(b => b.id === branchId ? updated : b));
      // Switch if renaming active
      if (branches.find(b => b.id === branchId)?.name === activeBranch) {
        onSwitchBranch(updated.name);
      }
      setEditingId(null);
    } catch (err: any) {
      alert(err.message);
      setEditingId(null);
    }
  };

  const handleDelete = async (branch: BranchRecord) => {
    if (branch.is_default) {
      alert('Cannot delete the default branch');
      return;
    }
    if (!confirm(`Delete branch "${branch.name}"?`)) return;
    try {
      await deleteBranchApi(branch.id);
      setBranches(prev => prev.filter(b => b.id !== branch.id));
      // If deleting active branch, switch to main
      if (branch.name === activeBranch) {
        const mainBranch = branches.find(b => b.is_default);
        if (mainBranch) onSwitchBranch(mainBranch.name);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="w-64 bg-matte-200 border-r border-matte-border flex flex-col h-full select-none">
      {/* Header */}
      <div className="px-3 py-2 border-b border-matte-border bg-matte-300/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-ochre" />
          <span className="text-xs font-semibold uppercase tracking-wider text-matte-muted">Branches</span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 text-matte-muted hover:text-white hover:bg-matte-hover rounded transition-colors"
          title="Create branch"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Create form */}
      {isCreating && (
        <div className="p-2 border-b border-matte-border bg-matte-100">
          <form onSubmit={handleCreate} className="space-y-2">
            <input
              type="text"
              autoFocus
              value={newBranchName}
              onChange={e => setNewBranchName(e.target.value)}
              placeholder="Branch name (e.g. feature-x)"
              className="w-full bg-matte-300 border border-matte-border rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-ochre"
            />
            {createError && <p className="text-[11px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{createError}</p>}
            <div className="flex gap-1">
              <button type="submit" className="flex-1 px-2 py-1 bg-ochre hover:bg-ochre-hover text-white text-xs font-bold rounded transition-colors">Create</button>
              <button type="button" onClick={() => { setIsCreating(false); setCreateError(''); }} className="px-2 py-1 bg-matte-300 hover:bg-matte-hover text-matte-muted hover:text-white text-xs rounded transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Branch list */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="p-4 text-center text-xs text-matte-muted">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-xs text-red-400 flex flex-col items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : branches.length === 0 ? (
          <div className="p-4 text-center text-xs text-matte-muted italic">No branches</div>
        ) : (
          branches.map(branch => {
            const isActive = branch.name === activeBranch;
            const isDefault = branch.is_default;
            const isEditing = editingId === branch.id;

            if (isEditing) {
              return (
                <form key={branch.id} onSubmit={e => handleRename(branch.id, e)} className="px-2 py-1 bg-matte-100 border-b border-matte-border flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 bg-matte-300 border border-matte-border rounded px-2 py-0.5 text-xs font-mono text-white focus:outline-none focus:border-ochre"
                  />
                  <button type="submit" className="p-1 text-green-400 hover:text-green-300"><Check className="w-3 h-3" /></button>
                  <button type="button" onClick={() => setEditingId(null)} className="p-1 text-matte-muted hover:text-white"><X className="w-3 h-3" /></button>
                </form>
              );
            }

            return (
              <div
                key={branch.id}
                onClick={() => onSwitchBranch(branch.name)}
                className={`px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer group ${
                  isActive
                    ? 'bg-matte-100 text-ochre border-l-2 border-ochre'
                    : 'text-matte-text hover:bg-matte-hover hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <GitBranch className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-mono truncate">{branch.name}</span>
                  {isDefault && <Lock className="w-3 h-3 text-matte-muted flex-shrink-0" />}
                </div>

                <div className="hidden group-hover:flex items-center gap-1">
                  {!isDefault && (
                    <>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEditingId(branch.id);
                          setEditName(branch.name);
                        }}
                        className="p-1 text-matte-muted hover:text-white transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(branch);
                        }}
                        className="p-1 text-matte-muted hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Current active branch indicator at bottom */}
      <div className="p-3 border-t border-matte-border bg-matte-300/30 text-[11px] text-matte-muted">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase">Active:</span>
          <span className="font-mono text-white">{activeBranch}</span>
        </div>
      </div>
    </div>
  );
};
