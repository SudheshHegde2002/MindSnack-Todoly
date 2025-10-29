import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { groupService } from '../services/groupService';
import { LocalGroup } from '../services/database';

export function useGroups() {
  const { user } = useUser();
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadGroups = useCallback(() => {
    if (!user?.id) return;
    const localGroups = groupService.getGroups(user.id);
    setGroups(localGroups);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Ensure default groups exist
    groupService.ensureDefaultGroups(user.id).then(() => {
      loadGroups();
      groupService.fetchFromSupabase(user.id).then(() => {
        loadGroups();
      });
    });

    const interval = setInterval(() => {
      loadGroups();
    }, 2000);

    return () => clearInterval(interval);
  }, [user?.id, loadGroups]);

  const addGroup = useCallback(
    async (name: string) => {
      if (!user?.id) return;
      await groupService.addGroup(user.id, name);
      loadGroups();
    },
    [user?.id, loadGroups]
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      await groupService.deleteGroup(id);
      loadGroups();
    },
    [loadGroups]
  );

  const renameGroup = useCallback(
    async (id: string, newName: string) => {
      await groupService.renameGroup(id, newName);
      loadGroups();
    },
    [loadGroups]
  );

  return {
    groups,
    isLoading,
    addGroup,
    deleteGroup,
    renameGroup,
  };
}

