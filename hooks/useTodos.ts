import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { todoService } from '../services/todoService';
import { groupService } from '../services/groupService';
import { LocalTodo, localDb } from '../services/database';
import { offlineUserService } from '../services/offlineUserService';

export function useTodos() {
  const { user } = useUser();
  const [todos, setTodos] = useState<LocalTodo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from Clerk or local storage (offline-first)
  useEffect(() => {
    const getUserIdAndEmail = async () => {
      if (user?.id) {
        setUserId(user.id);
        await offlineUserService.storeUserId(user.id);
        const primaryEmail = user?.primaryEmailAddress?.emailAddress;
        if (primaryEmail) {
          await offlineUserService.storeEmail(primaryEmail);
        }
      } else {
        const storedUserId = await offlineUserService.getStoredUserId();
        if (storedUserId) {
          setUserId(storedUserId);
          console.log(' Using offline user ID:', storedUserId);
        }
      }
    };
    getUserIdAndEmail();
  }, [user?.id]);

  const loadTodos = useCallback(() => {
    if (!userId) return;
    const localTodos = todoService.getTodos(userId);
    setTodos(localTodos);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    loadTodos();
    todoService.fetchFromSupabase(userId).then(() => {
      loadTodos();
    });

    const interval = setInterval(() => {
      setIsOnline(todoService.getOnlineStatus());
      loadTodos();
    }, 1000);

    return () => clearInterval(interval);
  }, [userId, loadTodos]);

  const addTodo = useCallback(
    async (title: string, description: string, groupId: string) => {
      if (!userId) return;
      
      // If group has a temp ID, get the group name and ensure it exists in Supabase first
      if (groupId.startsWith('temp_group_')) {
        const group = localDb.getGroupById(groupId);
        if (group) {
          console.log('Group has temp ID, ensuring it exists in Supabase first:', group.name);
          const syncedGroup = await groupService.ensureGroup(userId, group.name);
          groupId = syncedGroup.id;
          console.log('Using synced group ID:', groupId);
        }
      }
      
      await todoService.addTodo(userId, title, description || null, groupId);
      loadTodos();
    },
    [userId, loadTodos]
  );

  const toggleComplete = useCallback(
    async (id: string) => {
      await todoService.toggleComplete(id);
      loadTodos();
    },
    [loadTodos]
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      await todoService.deleteTodo(id);
      loadTodos();
    },
    [loadTodos]
  );

  const deleteTodos = useCallback(
    async (ids: string[]) => {
      await Promise.all(ids.map(id => todoService.deleteTodo(id)));
      loadTodos();
    },
    [loadTodos]
  );

  return {
    todos,
    isLoading,
    isOnline,
    addTodo,
    toggleComplete,
    deleteTodo,
    deleteTodos,
  };
}

