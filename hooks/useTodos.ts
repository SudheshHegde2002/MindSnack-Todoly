import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { todoService } from '../services/todoService';
import { LocalTodo } from '../services/database';

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
    async (title: string, description: string) => {
      if (!user?.id) return;
      await todoService.addTodo(user.id, title, description || null);
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

  return {
    todos,
    isLoading,
    isOnline,
    addTodo,
    toggleComplete,
    deleteTodo,
  };
}

