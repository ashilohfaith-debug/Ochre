import { useCollaborationContext } from '../providers/CollaborationProvider';

export function useCollaboration() {
  return useCollaborationContext();
}
