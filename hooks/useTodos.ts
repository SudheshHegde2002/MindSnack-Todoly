import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { todoService } from '../services/todoService';
import { groupService } from '../services/groupService';
import { LocalTodo, localDb } from '../services/database';

export function useTodos() {
  const { user } = useUser();
  const [todos, setTodos] = useState<LocalTodo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const loadTodos = useCallback(() => {
    if (!user?.id) return;
    const localTodos = todoService.getTodos(user.id);
    setTodos(localTodos);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    loadTodos();
    todoService.fetchFromSupabase(user.id).then(() => {
      loadTodos();
    });

    const interval = setInterval(() => {
      setIsOnline(todoService.getOnlineStatus());
      loadTodos();
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.id, loadTodos]);

  const addTodo = useCallback(
    async (title: string, description: string, groupId: string) => {
      if (!user?.id) return;
      
      // If group has a temp ID, get the group name and ensure it exists in Supabase first
      if (groupId.startsWith('temp_group_')) {
        const group = localDb.getGroupById(groupId);
        if (group) {
          console.log('Group has temp ID, ensuring it exists in Supabase first:', group.name);
          const syncedGroup = await groupService.ensureGroup(user.id, group.name);
          groupId = syncedGroup.id;
          console.log('Using synced group ID:', groupId);
        }
      }
      
      await todoService.addTodo(user.id, title, description || null, groupId);
      loadTodos();
    },
    [user?.id, loadTodos]
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

