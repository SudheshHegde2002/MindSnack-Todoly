import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { groupService } from '../services/groupService';
import { LocalGroup } from '../services/database';
import { offlineUserService } from '../services/offlineUserService';

export function useGroups() {
  const { user } = useUser();
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from Clerk or local storage (offline-first)
  useEffect(() => {
    const getUserId = async () => {
      if (user?.id) {
        // Online: Use Clerk's user ID and store it locally
        setUserId(user.id);
        await offlineUserService.storeUserId(user.id);
      } else {
        // Offline: Use locally stored user ID
        const storedUserId = await offlineUserService.getStoredUserId();
        if (storedUserId) {
          setUserId(storedUserId);
          console.log('📱 Using offline user ID for groups:', storedUserId);
        }
      }
    };

    getUserId();
  }, [user?.id]);

  const loadGroups = useCallback(() => {
    if (!userId) return;
    const localGroups = groupService.getGroups(userId);
    setGroups(localGroups);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Ensure default groups exist
    groupService.ensureDefaultGroups(userId).then(() => {
      loadGroups();
      groupService.fetchFromSupabase(userId).then(() => {
        loadGroups();
      });
    });

    const interval = setInterval(() => {
      loadGroups();
    }, 2000);

    return () => clearInterval(interval);
  }, [userId, loadGroups]);

  const addGroup = useCallback(
    async (name: string) => {
      if (!userId) return;
      await groupService.addGroup(userId, name);
      loadGroups();
    },
    [userId, loadGroups]
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

