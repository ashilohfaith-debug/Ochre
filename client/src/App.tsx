import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { CollaborationProvider, useCollaborationContext } from './providers/CollaborationProvider';
import { NotificationProvider } from './providers/NotificationProvider';
import { BackupProvider } from './providers/BackupProvider';
import { AuthModal } from './components/auth/AuthModal';
import { Dashboard } from './components/dashboard/Dashboard';

import { ActivityBar } from './components/activitybar/ActivityBar';
import { FileExplorer } from './components/explorer/FileExplorer';
import { TopBar } from './components/topbar/TopBar';
import { CollaborationSidebar } from './components/sidebar/CollaborationSidebar';
import { StatusBar } from './components/statusbar/StatusBar';
import { PresenceToast } from './components/presence/PresenceToast';
import { MonacoEditorContainer } from './editor/MonacoEditor';
import { OutputPanel } from './components/runner/OutputPanel';
import { CollabNotificationPopup } from './components/notifications/CollabNotificationPopup';
import { NotificationsPanel } from './components/notifications/NotificationsPanel';
import { BackupPanel } from './components/backup/BackupPanel';
import { BranchPanel } from './components/branches/BranchPanel';
import { WorkspaceSearch } from './components/search/WorkspaceSearch';
import { runCode, ExecutionResult } from './services/runner';

import { ActiveTab } from './types';
import { getLanguageFromFilename } from './utils/language';
import { Sparkles, Settings } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  join_code: string;
  created_at: string;
}

// The active room is composed of projectId + branch so each branch is isolated
function buildRoomName(projectId: string, branch: string): string {
  return `project-${projectId}-branch-${branch}`;
}

function WorkspaceInner({
  project,
  activeBranch,
  onBackToDashboard,
  onSwitchBranch
}: {
  project: Project;
  activeBranch: string;
  onBackToDashboard: () => void;
  onSwitchBranch: (branch: string) => void;
}) {
  const { doc, files, createFile } = useCollaborationContext();
  const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');
  const [activeFile, setActiveFile] = useState<string | undefined>(undefined);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [revealLine, setRevealLine] = useState<number | undefined>(undefined);

  // Code execution
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Sync open files: pick first file when no file open yet
  useEffect(() => {
    if (files.length > 0 && !activeFile) {
      const first = files[0].path;
      setActiveFile(first);
      if (!openFiles.includes(first)) {
        setOpenFiles([first]);
      }
    }
    // When branch switches, close files that no longer exist
    setOpenFiles(prev => prev.filter(f => files.some(ff => ff.path === f)));
  }, [files]);

  const handleSelectFile = useCallback((filePath: string, line?: number) => {
    setActiveFile(filePath);
    if (!openFiles.includes(filePath)) {
      setOpenFiles(prev => [...prev, filePath]);
    }
    if (line !== undefined) {
      // Small timeout lets the editor mount the new file before scrolling
      setTimeout(() => setRevealLine(line), 80);
    }
  }, [openFiles]);

  const handleCloseFile = useCallback((filePath: string) => {
    const nextOpen = openFiles.filter(f => f !== filePath);
    setOpenFiles(nextOpen);
    if (activeFile === filePath) {
      setActiveFile(nextOpen.length > 0 ? nextOpen[nextOpen.length - 1] : undefined);
    }
  }, [activeFile, openFiles]);

  // Reset reveal after navigation so it doesn't fire again on the same line
  useEffect(() => {
    if (revealLine !== undefined) {
      const t = setTimeout(() => setRevealLine(undefined), 500);
      return () => clearTimeout(t);
    }
  }, [revealLine]);

  const handleRunCode = useCallback(async () => {
    if (!activeFile || !doc) return;
    try {
      setIsRunning(true);
      const code = doc.getText(`file:${activeFile}`).toString();
      const res = await runCode(code, activeFile);
      setExecutionResult(res);
    } catch (err: any) {
      setExecutionResult({
        mode: 'console',
        logs: [{ type: 'error', text: `Execution failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() }],
        durationMs: 0
      });
    } finally {
      setIsRunning(false);
    }
  }, [activeFile, doc]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRunCode]);

  const activeLanguage = activeFile ? getLanguageFromFilename(activeFile) : 'plaintext';

  return (
    <div className="flex flex-col h-screen w-screen bg-matte-300 overflow-hidden font-sans">
      <TopBar
        projectName={project.name}
        joinCode={project.join_code}
        activeBranch={activeBranch}
        activeFile={activeFile}
        openFiles={openFiles}
        onSelectFile={handleSelectFile}
        onCloseFile={handleCloseFile}
        onBackToDashboard={onBackToDashboard}
        onRunCode={handleRunCode}
        isRunning={isRunning}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <ActivityBar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Sidebar content */}
        {activeTab === 'explorer' && (
          <FileExplorer
            activeFile={activeFile || ''}
            onSelectFile={handleSelectFile}
            onDeleteActiveFile={handleCloseFile}
          />
        )}

        {activeTab === 'search' && (
          <WorkspaceSearch onOpenFile={handleSelectFile} />
        )}

        {activeTab === 'source-control' && (
          <BranchPanel
            projectId={project.id}
            activeBranch={activeBranch}
            onSwitchBranch={onSwitchBranch}
          />
        )}

        {activeTab === 'ai' && (
          <div className="w-60 bg-matte-200 border-r border-matte-border p-3 text-xs select-none">
            <div className="font-semibold uppercase tracking-wider text-matte-muted mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-ochre" />
              <span>AI Assistant</span>
            </div>
            <div className="p-3 bg-matte-100/50 rounded border border-matte-border text-matte-muted italic text-[11px]">
              AI integration coming in Milestone 2.
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="w-60 bg-matte-200 border-r border-matte-border p-3 text-xs select-none">
            <div className="font-semibold uppercase tracking-wider text-matte-muted mb-3 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-ochre" />
              <span>Preferences</span>
            </div>
            <div className="p-2 bg-matte-100 rounded border border-matte-border text-white">
              Theme: <span className="text-ochre font-medium">Dark Matte (#C7722D)</span>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="w-72 border-r border-matte-border flex-shrink-0 h-full overflow-hidden">
            <NotificationsPanel />
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="w-80 border-r border-matte-border flex-shrink-0 h-full overflow-hidden">
            <BackupPanel />
          </div>
        )}

        {/* Main editor column */}
        <main className="flex-1 h-full flex flex-col relative overflow-hidden bg-matte-200">
          <div className="flex-1 relative overflow-hidden">
            <MonacoEditorContainer
              filePath={activeFile}
              language={activeLanguage}
              onCursorChange={setCursorPos}
              onCreateFileClick={() => createFile('main.py')}
              revealLine={revealLine}
            />
          </div>
          <OutputPanel
            result={executionResult}
            onClose={() => setExecutionResult(null)}
            onClear={() => setExecutionResult(null)}
            onReRun={handleRunCode}
          />
        </main>

        <CollaborationSidebar />
        <PresenceToast />
        <CollabNotificationPopup />
      </div>

      <StatusBar cursorPos={cursorPos} language={activeLanguage} />
    </div>
  );
}

// IDEWorkspace wraps WorkspaceInner inside a CollaborationProvider whose room
// changes whenever the active branch changes — giving full CRDT isolation per branch.
export function IDEWorkspace({ project, onBackToDashboard }: { project: Project; onBackToDashboard: () => void }) {
  const [activeBranch, setActiveBranch] = useState('main');
  const roomName = buildRoomName(project.id, activeBranch);

  return (
    <CollaborationProvider activeRoom={roomName}>
      <NotificationProvider>
        <BackupProvider>
          <WorkspaceInner
            project={project}
            activeBranch={activeBranch}
            onBackToDashboard={onBackToDashboard}
            onSwitchBranch={setActiveBranch}
          />
        </BackupProvider>
      </NotificationProvider>
    </CollaborationProvider>
  );
}

function MainAppContent() {
  const { isAuthenticated, isVerifying } = useAuth();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // While verifying the stored token, show a neutral loading state to avoid
  // flashing the auth modal before the verification resolves.
  if (isVerifying) {
    return (
      <div className="fixed inset-0 bg-matte-300 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-matte-muted text-xs">
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none" className="animate-pulse">
            <rect width="100" height="100" rx="20" fill="#141414"/>
            <path d="M30 25 L50 50 L30 75 M55 75 L75 75" stroke="#C7722D" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Restoring session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <AuthModal />;
  if (!currentProject) return <Dashboard onOpenProject={p => setCurrentProject(p)} />;

  return (
    <IDEWorkspace
      project={currentProject}
      onBackToDashboard={() => setCurrentProject(null)}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
