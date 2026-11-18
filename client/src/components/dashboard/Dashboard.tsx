import React, { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { fetchProjectsApi, createProjectApi, joinProjectApi, ProjectRecord } from '../../services/api';
import { 
  FolderPlus, 
  KeyRound, 
  LogOut, 
  Code2, 
  Copy, 
  Check, 
  Calendar, 
  ArrowRight, 
  Plus, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

type Project = ProjectRecord;

interface DashboardProps {
  onOpenProject: (project: Project) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenProject }) => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Join Project states
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Copy status per project code
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchProjectsApi();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Fetch every time the authenticated user changes (covers login, refresh, and
  // re-login as a different account).
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user?.id]); // depend on user.id so switching accounts also re-fetches

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setCreateLoading(true);
      const newProj = await createProjectApi(newProjectName.trim(), newProjectDesc.trim());
      setProjects(prev => [newProj, ...prev]);
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      onOpenProject(newProj);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    if (!joinCodeInput.trim()) return;

    try {
      setJoinLoading(true);
      const res = await joinProjectApi(joinCodeInput.trim());
      setProjects(prev => {
        if (prev.some(p => p.id === res.project.id)) return prev;
        return [res.project, ...prev];
      });
      setJoinCodeInput('');
      onOpenProject(res.project);
    } catch (err: any) {
      setJoinError(err.message || 'Invalid project code');
    } finally {
      setJoinLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen w-screen bg-matte-300 text-matte-text flex flex-col font-sans select-none overflow-y-auto">
      {/* Top Header */}
      <header className="h-14 bg-matte-200 border-b border-matte-border flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-matte-100 border border-matte-border flex items-center justify-center text-ochre">
            <Code2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-white text-base tracking-wide">Ochre Workspace</span>
        </div>

        {/* User Profile & Sign Out */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-matte-100 px-3 py-1.5 rounded-lg border border-matte-border">
              <span 
                className="w-3 h-3 rounded-full border border-white/20" 
                style={{ backgroundColor: user.color }} 
              />
              <span className="text-xs font-semibold text-white">{user.username}</span>
              <span className="text-[10px] text-matte-muted">({user.email})</span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-matte-100 hover:bg-red-500/20 hover:text-red-400 border border-matte-border text-matte-muted rounded-lg text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Welcome Banner & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-matte-200 p-6 rounded-xl border border-matte-border shadow-lg">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>Developer Dashboard</span>
              <Sparkles className="w-5 h-5 text-ochre" />
            </h2>
            <p className="text-xs text-matte-muted mt-1">Manage your collaborative coding projects or join teammates with a 6-digit code.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadProjects}
              disabled={loading}
              className="px-3 py-2 bg-matte-100 hover:bg-matte-hover border border-matte-border text-matte-muted hover:text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
              title="Reload projects from server"
            >
              {loading ? 'Loading...' : '↻ Refresh'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-ochre hover:bg-ochre-hover text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>
        </div>

        {/* Join Project Bar */}
        <div className="bg-matte-200 p-4 rounded-xl border border-matte-border shadow-md">
          <form onSubmit={handleJoinProject} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white whitespace-nowrap">
              <KeyRound className="w-4 h-4 text-ochre" />
              <span>Join Project via Code:</span>
            </div>

            <input
              type="text"
              maxLength={6}
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              placeholder="Enter 6-digit code (e.g. 482731)"
              className="flex-1 w-full bg-matte-100 border border-matte-border rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-matte-muted focus:outline-none focus:border-ochre uppercase tracking-widest"
            />

            <button
              type="submit"
              disabled={joinLoading || !joinCodeInput.trim()}
              className="w-full sm:w-auto px-4 py-2 bg-matte-100 hover:bg-matte-hover border border-matte-border text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>{joinLoading ? 'Joining...' : 'Join Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-ochre" />
            </button>
          </form>

          {joinError && (
            <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{joinError}</span>
            </div>
          )}
        </div>

        {/* Projects Grid Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider text-xs">
              Your Projects ({projects.length})
            </h3>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={loadProjects} className="ml-auto text-red-400 hover:text-red-200 underline">
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-xs text-matte-muted italic">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-matte-200/50 border border-dashed border-matte-border p-12 rounded-xl text-center space-y-3">
              <FolderPlus className="w-10 h-10 text-matte-muted mx-auto" />
              <h4 className="text-sm font-semibold text-white">No projects found</h4>
              <p className="text-xs text-matte-muted max-w-sm mx-auto">Create a new project or enter a 6-digit join code to start collaborating with your team.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-ochre hover:bg-ochre-hover text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Project</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-matte-200 border border-matte-border hover:border-ochre/50 rounded-xl p-5 flex flex-col justify-between transition-all shadow-md hover:shadow-xl group"
                >
                  <div>
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-base font-bold text-white group-hover:text-ochre transition-colors truncate">
                        {proj.name}
                      </h4>
                      <span className="text-[10px] text-matte-muted flex items-center gap-1 font-mono flex-shrink-0">
                        <Calendar className="w-3 h-3" />
                        {new Date(proj.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-matte-muted line-clamp-2 mb-4">
                      {proj.description || 'Collaborative TypeScript workspace'}
                    </p>
                  </div>

                  {/* Card Bottom: 6-Digit Join Code & Open Button */}
                  <div className="pt-4 border-t border-matte-border/50 flex flex-col gap-3">
                    <div className="flex items-center justify-between bg-matte-100 p-2 rounded-lg border border-matte-border">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[11px] font-semibold text-matte-muted">Project Code:</span>
                        <span className="font-mono font-bold text-ochre text-sm tracking-wider">{proj.join_code}</span>
                      </div>

                      <button
                        onClick={() => copyCode(proj.join_code)}
                        className="text-matte-muted hover:text-white transition-colors p-1"
                        title="Copy 6-digit project code"
                      >
                        {copiedCode === proj.join_code ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => onOpenProject(proj)}
                      className="w-full py-2 bg-ochre/20 hover:bg-ochre border border-ochre/40 hover:border-ochre text-ochre hover:text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-matte-400/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-matte-200 border border-matte-border rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Create New Project</h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-matte-muted mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Ochre Workspace"
                  className="w-full bg-matte-100 border border-matte-border rounded-lg px-3 py-2 text-xs text-white placeholder-matte-muted focus:outline-none focus:border-ochre"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-matte-muted mb-1">Description (Optional)</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Brief description of the project..."
                  rows={3}
                  className="w-full bg-matte-100 border border-matte-border rounded-lg px-3 py-2 text-xs text-white placeholder-matte-muted focus:outline-none focus:border-ochre resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-matte-100 hover:bg-matte-hover text-matte-text text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createLoading || !newProjectName.trim()}
                  className="px-4 py-2 bg-ochre hover:bg-ochre-hover text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create & Open'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
