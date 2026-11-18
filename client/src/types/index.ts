export interface Collaborator {
  clientId: number;
  name: string;
  color: string;
  status: 'online' | 'idle' | 'offline';
  cursor?: {
    line: number;
    column: number;
  };
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  language: string;
  isFolder?: boolean;
  children?: FileItem[];
  content?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
}

export interface Room {
  id: string;
  projectId: string;
  roomCode: string;
}

export type ActiveTab = 'explorer' | 'search' | 'source-control' | 'ai' | 'settings' | 'notifications' | 'backup';
