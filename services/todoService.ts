import NetInfo from '@react-native-community/netinfo';
import { supabase, Todo } from './supabase';
import { localDb, LocalTodo } from './database';

class TodoService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  constructor() {
    this.initNetworkListener();
  }

  setupGroupSyncListener() {
    // When groups are synced, sync todos too (in case they now have real group IDs)
    // This is called after both services are initialized to avoid circular dependency
    const { groupService } = require('./groupService');
    groupService.onGroupsSynced(() => {
      console.log('Group sync detected, triggering todo sync...');
      this.syncWithSupabase();
    });
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

  async addTodo(userId: string, title: string, description: string | null, groupId: string): Promise<LocalTodo> {
    const now = new Date().toISOString();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const todo: Omit<LocalTodo, 'synced'> = {
      id: tempId,
      user_id: userId,
      title,
      description,
      group_id: groupId,
      is_completed: 0,
      created_at: now,
      updated_at: now,
    };

    localDb.insertTodo(todo);
    console.log('Todo added to SQLite with temp ID:', todo);
    
    if (this.isOnline) {
      try {
        console.log('Attempting to insert into Supabase:', {
          user_id: todo.user_id,
          title: todo.title,
          description: todo.description,
          group_id: todo.group_id,
          is_completed: false,
        });

        const { data, error } = await supabase.from('TodoTable').insert({
          user_id: todo.user_id,
          title: todo.title,
          description: todo.description,
          group_id: parseInt(todo.group_id),
          is_completed: false,
        }).select();

        if (error) {
          console.error('Supabase insert error:', JSON.stringify(error, null, 2));
          localDb.addToQueue('add', tempId, todo);
        } else if (data && data[0]) {
          console.log('Supabase insert success:', data);
          const supabaseId = data[0].id;
          
          // Update local database with Supabase ID
          localDb.deleteTodo(tempId);
          localDb.insertTodo({
            ...todo,
            id: supabaseId,
            group_id: data[0].group_id,
            created_at: data[0].created_at,
            updated_at: data[0].updated_at || data[0].created_at,
          });
          localDb.markAsSynced(supabaseId);
          
          // Update any queued operations for this todo to use the new ID
          localDb.updateQueueTodoId(tempId, supabaseId);
          console.log('Updated queue items from temp ID to Supabase ID:', tempId, '->', supabaseId);
          
          return { ...todo, id: supabaseId, synced: 1 };
        }
      } catch (error) {
        console.error('Failed to sync add (catch):', error);
        localDb.addToQueue('add', tempId, todo);
      }
    } else {
      localDb.addToQueue('add', tempId, todo);
    }

    return { ...todo, synced: 0 };
  }

  async toggleComplete(id: string): Promise<void> {
    const todo = localDb.getTodoById(id);
    if (!todo) return;

    const newCompleted = todo.is_completed === 1 ? 0 : 1;
    localDb.updateTodo(id, { is_completed: newCompleted });
    console.log('Todo updated in SQLite:', { id, is_completed: newCompleted });
    
    // If it's a temp ID, just queue it for later sync
    if (id.startsWith('temp_')) {
      localDb.addToQueue('update', id, { is_completed: newCompleted });
      return;
    }

    if (this.isOnline) {
      try {
        const { error } = await supabase
          .from('TodoTable')
          .update({ is_completed: newCompleted === 1 })
          .eq('id', id);

        if (!error) {
          localDb.markAsSynced(id);
          console.log('Successfully synced toggle for:', id);
        } else {
          console.error('Failed to sync toggle:', error);
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

    const userId = todo.user_id;

    // Check if this is a temp ID (never synced to Supabase)
    const isTempId = id.startsWith('temp_');

    localDb.deleteTodo(id);
    localDb.markAsDeleted(id, userId);

    if (isTempId) {
      // If it's a temp ID, just remove any pending add operations from queue
      localDb.removeFromQueueByTodoId(id);
      console.log('Deleted todo with temp ID, removed from queue:', id);
      return;
    }

    if (this.isOnline) {
      try {
        const { error } = await supabase.from('TodoTable').delete().eq('id', id);

        if (error) {
          console.error('Failed to delete from Supabase:', error);
          localDb.addToQueue('delete', id, todo);
        } else {
          console.log('Successfully deleted from Supabase:', id);
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
          // Skip if this todo was deleted locally
          if (localDb.isDeleted(todo.id)) {
            console.log('Skipping deleted todo from Supabase:', todo.id);
            return;
          }

          const existing = localDb.getTodoById(todo.id);
          
          if (!existing) {
            localDb.insertTodo({
              id: todo.id,
              user_id: todo.user_id,
              title: todo.title,
              description: todo.description,
              group_id: todo.group_id,
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
                group_id: todo.group_id,
                is_completed: todo.is_completed ? 1 : 0,
                updated_at: todo.updated_at || todo.created_at,
              });
              localDb.markAsSynced(todo.id);
            }
          }
        });
      }
      
      // Clean up old deleted todos (older than 30 days)
      localDb.clearOldDeletedTodos(30);
    } catch (error) {
      console.error('Failed to fetch from Supabase:', error);
    }
  }

  async syncWithSupabase(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      // Clean up orphaned temp ID operations (updates/deletes for todos that were never added)
      let queue = localDb.getQueue();
      const tempIdUpdatesDeletes = queue.filter(
        item => (item.action === 'update' || item.action === 'delete') && item.todo_id.startsWith('temp_')
      );
      
      for (const item of tempIdUpdatesDeletes) {
        console.log(`Cleaning up orphaned ${item.action} operation for temp ID:`, item.todo_id);
        localDb.removeFromQueue(item.id);
      }
      
      // Process in two passes to handle temp ID -> real ID transitions
      // Pass 1: Process all 'add' operations first
      queue = localDb.getQueue();
      const addItems = queue.filter(item => item.action === 'add');
      
      for (const item of addItems) {
        try {
          const data = JSON.parse(item.data);
          
          const { data: insertData, error: addError } = await supabase.from('TodoTable').insert({
            user_id: data.user_id,
            title: data.title,
            description: data.description,
            group_id: parseInt(data.group_id),
            is_completed: data.is_completed === 1,
          }).select();
          
          if (addError) {
            console.error('Queue sync add error:', addError);
            continue; // Skip this item but continue with others
          }
          
          if (insertData && insertData[0]) {
            const supabaseId = insertData[0].id;
            const oldTempId = item.todo_id;
            
            // Update local database with Supabase ID
            localDb.deleteTodo(oldTempId);
            localDb.insertTodo({
              id: supabaseId,
              user_id: data.user_id,
              title: data.title,
              description: data.description,
              group_id: insertData[0].group_id,
              is_completed: data.is_completed,
              created_at: insertData[0].created_at,
              updated_at: insertData[0].updated_at || insertData[0].created_at,
            });
            localDb.markAsSynced(supabaseId);
            
            // Update any other queued operations for this todo to use the new ID
            localDb.updateQueueTodoId(oldTempId, supabaseId);
            console.log('Synced add and updated queue items from temp ID to Supabase ID:', oldTempId, '->', supabaseId);
            
            // Remove from queue only after successful sync
            localDb.removeFromQueue(item.id);
          }
        } catch (error) {
          console.error(`Failed to sync add item ${item.id}:`, error);
        }
      }

      // Pass 2: Process all 'update' and 'delete' operations (now with real IDs)
      queue = localDb.getQueue(); // Refresh queue to get updated IDs
      const otherItems = queue.filter(item => item.action !== 'add');
      
      for (const item of otherItems) {
        try {
          const data = JSON.parse(item.data);

          // Skip if still has temp ID (add operation must have failed)
          if (item.todo_id.startsWith('temp_')) {
            console.log(`Skipping ${item.action} for temp ID (add operation not completed):`, item.todo_id);
            continue;
          }

          switch (item.action) {
            case 'update':
              const { error: updateError } = await supabase
                .from('TodoTable')
                .update({
                  is_completed: data.is_completed === 1,
                })
                .eq('id', item.todo_id);
                
              if (!updateError) {
                localDb.markAsSynced(item.todo_id);
                console.log('Successfully synced update for:', item.todo_id);
                localDb.removeFromQueue(item.id);
              } else {
                console.error('Queue sync update error:', updateError);
              }
              break;

            case 'delete':
              // Skip if it's a temp ID (todo was never synced to Supabase)
              if (item.todo_id.startsWith('temp_')) {
                console.log('Removing delete queue item for temp ID (never synced):', item.todo_id);
                localDb.removeFromQueue(item.id);
                break;
              }
              
              const { error: deleteError } = await supabase.from('TodoTable').delete().eq('id', item.todo_id);
              
              if (!deleteError) {
                console.log('Successfully synced delete for:', item.todo_id);
                localDb.removeFromQueue(item.id);
              } else {
                console.error('Queue sync delete error:', deleteError);
              }
              break;
          }
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

  // Utility method to clean up orphaned queue items (for debugging/maintenance)
  cleanupOrphanedQueueItems(): void {
    const queue = localDb.getQueue();
    let cleanedCount = 0;

    queue.forEach(item => {
      // Remove updates/deletes for temp IDs that no longer exist in the database
      if ((item.action === 'update' || item.action === 'delete') && item.todo_id.startsWith('temp_')) {
        const todo = localDb.getTodoById(item.todo_id);
        if (!todo) {
          console.log(`Removing orphaned ${item.action} for non-existent temp ID:`, item.todo_id);
          localDb.removeFromQueue(item.id);
          cleanedCount++;
        }
      }
    });

    console.log(`Cleaned up ${cleanedCount} orphaned queue items`);
  }
}

export const todoService = new TodoService();

// Setup group sync listener after both services are created
todoService.setupGroupSyncListener();

