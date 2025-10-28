import NetInfo from '@react-native-community/netinfo';
import { supabase, Todo } from './supabase';
import { localDb, LocalTodo } from './database';

class TodoService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        console.log('Internet restored, syncing...');
        this.syncWithSupabase();
      }
    });
  }

  async addTodo(userId: string, title: string, description: string | null): Promise<LocalTodo> {
    const now = new Date().toISOString();
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const todo: Omit<LocalTodo, 'synced'> = {
      id,
      user_id: userId,
      title,
      description,
      is_completed: 0,
      created_at: now,
      updated_at: now,
    };

    localDb.insertTodo(todo);

    if (this.isOnline) {
      try {
        const { error } = await supabase.from('TodoTable').insert({
          id: todo.id,
          user_id: todo.user_id,
          title: todo.title,
          description: todo.description,
          is_completed: false,
          created_at: todo.created_at,
        });

        if (!error) {
          localDb.markAsSynced(id);
        } else {
          localDb.addToQueue('add', id, todo);
        }
      } catch (error) {
        console.error('Failed to sync add:', error);
        localDb.addToQueue('add', id, todo);
      }
    } else {
      localDb.addToQueue('add', id, todo);
    }

    return { ...todo, synced: 0 };
  }

  async toggleComplete(id: string): Promise<void> {
    const todo = localDb.getTodoById(id);
    if (!todo) return;

    const newCompleted = todo.is_completed === 1 ? 0 : 1;
    localDb.updateTodo(id, { is_completed: newCompleted });

    if (this.isOnline) {
      try {
        const { error } = await supabase
          .from('TodoTable')
          .update({ is_completed: newCompleted === 1 })
          .eq('id', id);

        if (!error) {
          localDb.markAsSynced(id);
        } else {
          localDb.addToQueue('update', id, { is_completed: newCompleted });
        }
      } catch (error) {
        console.error('Failed to sync toggle:', error);
        localDb.addToQueue('update', id, { is_completed: newCompleted });
      }
    } else {
      localDb.addToQueue('update', id, { is_completed: newCompleted });
    }
  }

  async deleteTodo(id: string): Promise<void> {
    const todo = localDb.getTodoById(id);
    if (!todo) return;

    localDb.deleteTodo(id);

    if (this.isOnline) {
      try {
        const { error } = await supabase.from('TodoTable').delete().eq('id', id);

        if (error) {
          localDb.addToQueue('delete', id, todo);
        }
      } catch (error) {
        console.error('Failed to sync delete:', error);
        localDb.addToQueue('delete', id, todo);
      }
    } else {
      localDb.addToQueue('delete', id, todo);
    }
  }

  getTodos(userId: string): LocalTodo[] {
    return localDb.getAllTodos(userId);
  }

  async fetchFromSupabase(userId: string): Promise<void> {
    if (!this.isOnline) return;

    try {
      const { data, error } = await supabase
        .from('TodoTable')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        data.forEach((todo: Todo) => {
          const existing = localDb.getTodoById(todo.id);
          
          if (!existing) {
            localDb.insertTodo({
              id: todo.id,
              user_id: todo.user_id,
              title: todo.title,
              description: todo.description,
              is_completed: todo.is_completed ? 1 : 0,
              created_at: todo.created_at,
              updated_at: todo.updated_at || todo.created_at,
            });
            localDb.markAsSynced(todo.id);
          } else {
            const localUpdated = new Date(existing.updated_at).getTime();
            const remoteUpdated = new Date(todo.updated_at || todo.created_at).getTime();

            if (remoteUpdated > localUpdated && existing.synced === 1) {
              localDb.updateTodo(todo.id, {
                title: todo.title,
                description: todo.description,
                is_completed: todo.is_completed ? 1 : 0,
                updated_at: todo.updated_at || todo.created_at,
              });
              localDb.markAsSynced(todo.id);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch from Supabase:', error);
    }
  }

  async syncWithSupabase(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      const queue = localDb.getQueue();

      for (const item of queue) {
        try {
          const data = JSON.parse(item.data);

          switch (item.action) {
            case 'add':
              await supabase.from('TodoTable').insert({
                id: data.id,
                user_id: data.user_id,
                title: data.title,
                description: data.description,
                is_completed: data.is_completed === 1,
                created_at: data.created_at,
              });
              localDb.markAsSynced(data.id);
              break;

            case 'update':
              await supabase
                .from('TodoTable')
                .update({
                  is_completed: data.is_completed === 1,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', item.todo_id);
              localDb.markAsSynced(item.todo_id);
              break;

            case 'delete':
              await supabase.from('TodoTable').delete().eq('id', item.todo_id);
              break;
          }

          localDb.removeFromQueue(item.id);
        } catch (error) {
          console.error(`Failed to sync queue item ${item.id}:`, error);
        }
      }

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const todoService = new TodoService();

