import React, { useEffect, useState } from 'react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { UserCheck, UserX } from 'lucide-react';

export const PresenceToast: React.FC = () => {
  const { presenceEvents } = useCollaboration();
  const [activeToast, setActiveToast] = useState<{ id: string; message: string; type: 'join' | 'leave' } | null>(null);

  useEffect(() => {
    if (presenceEvents.length > 0) {
      const latest = presenceEvents[presenceEvents.length - 1];
      setActiveToast(latest);

      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [presenceEvents]);

  if (!activeToast) return null;

  return (
    <div className="absolute bottom-9 left-14 z-50 flex items-center gap-2 bg-matte-100 border border-matte-border text-white px-3 py-2 rounded-lg shadow-xl text-xs animate-bounce">
      {activeToast.type === 'join' ? (
        <UserCheck className="w-4 h-4 text-green-400" />
      ) : (
        <UserX className="w-4 h-4 text-red-400" />
      )}
      <span className="font-medium">{activeToast.message}</span>
    </div>
  );
};
