import React from 'react';
import { Files, Search, GitBranch, Sparkles, Settings, Bell, DatabaseBackup } from 'lucide-react';
import { ActiveTab } from '../../types';
import { useNotifications } from '../../providers/NotificationProvider';

interface ActivityBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({ activeTab, setActiveTab }) => {
  const { savedNotifications } = useNotifications();

  const topNavItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'explorer', label: 'Explorer (Ctrl+Shift+E)', icon: Files },
    { id: 'search', label: 'Search (Ctrl+Shift+F)', icon: Search },
    { id: 'source-control', label: 'Source Control (Ctrl+Shift+G)', icon: GitBranch },
    { id: 'ai', label: 'AI Assistant (Placeholder)', icon: Sparkles },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'backup', label: 'Backup — Change History', icon: DatabaseBackup },
  ];

  return (
    <aside className="w-12 bg-matte-300 border-r border-matte-border flex flex-col items-center justify-between py-3 z-20 select-none">
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Ochre Logo */}
        <div className="w-8 h-8 rounded bg-matte-200 border border-matte-border flex items-center justify-center mb-2 text-ochre font-bold shadow-sm">
          <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="20" fill="#141414"/>
            <path d="M30 25 L50 50 L30 75 M55 75 L75 75" stroke="#C7722D" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Navigation Items */}
        {topNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isBell = item.id === 'notifications';
          const badgeCount = isBell ? savedNotifications.length : 0;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`relative w-10 h-10 flex items-center justify-center rounded transition-colors ${
                isActive
                  ? 'text-ochre bg-matte-100'
                  : 'text-matte-muted hover:text-matte-text hover:bg-matte-hover'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-ochre rounded-r" />
              )}
              <Icon className="w-5 h-5" />
              {/* Badge for saved notifications count */}
              {badgeCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-ochre text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Settings at bottom */}
      <button
        onClick={() => setActiveTab('settings')}
        title="Settings"
        className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
          activeTab === 'settings'
            ? 'text-ochre bg-matte-100'
            : 'text-matte-muted hover:text-matte-text hover:bg-matte-hover'
        }`}
      >
        <Settings className="w-5 h-5" />
      </button>
    </aside>
  );
};
