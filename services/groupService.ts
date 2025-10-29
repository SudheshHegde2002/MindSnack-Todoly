import NetInfo from '@react-native-community/netinfo';
import { supabase, Group } from './supabase';
import { localDb, LocalGroup } from './database';

class GroupService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private onGroupsSyncedCallback?: () => void;

  constructor() {
    this.initNetworkListener();
  }

  // Allow todo service to register for notifications when groups are synced
  onGroupsSynced(callback: () => void) {
    this.onGroupsSyncedCallback = callback;
  }

  private initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        console.log('Internet restored, syncing groups...');
        this.syncWithSupabase();
      }
    });
  }

  async addGroup(userId: string, name: string): Promise<LocalGroup> {
    const now = new Date().toISOString();

    if (this.isOnline) {
      try {
        console.log('Attempting to insert group into Supabase:', { user_id: userId, name });

        const { data, error } = await supabase.from('groups').insert({
          user_id: userId,
          name: name,
        }).select();

        if (error) {
          console.error('Supabase group insert error:', JSON.stringify(error, null, 2));
          throw error;
        }

        if (data && data[0]) {
          console.log('Supabase group insert success:', data);
          const supabaseId = data[0].id;

          const group: Omit<LocalGroup, 'synced'> = {
            id: supabaseId,
            user_id: userId,
            name: name,
            created_at: data[0].created_at,
          };

          localDb.insertGroup(group);
          localDb.markGroupAsSynced(supabaseId);

          return { ...group, synced: 1 };
        }
      } catch (error) {
        console.error('Failed to create group:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot create groups while offline');
    }

    throw new Error('Failed to create group');
  }

  async deleteGroup(id: string): Promise<void> {
    const group = localDb.getGroupById(id);
    if (!group) return;

    const userId = group.user_id;

    // Check if this is a temp ID (never synced to Supabase)
    const isTempId = id.startsWith('temp_group_');

    localDb.deleteGroup(id);
    localDb.markGroupAsDeleted(id, userId);

    if (isTempId) {
      // If it's a temp ID, just remove any pending add operations from queue
      localDb.removeFromGroupQueueByGroupId(id);
      console.log('Deleted group with temp ID, removed from queue:', id);
      return;
    }

    if (this.isOnline) {
      try {
        const { error } = await supabase.from('groups').delete().eq('id', id);

        if (error) {
          console.error('Failed to delete group from Supabase:', error);
          localDb.addGroupToQueue('delete', id, group);
        } else {
          console.log('Successfully deleted group from Supabase:', id);
        }
      } catch (error) {
        console.error('Failed to sync group delete:', error);
        localDb.addGroupToQueue('delete', id, group);
      }
    } else {
      localDb.addGroupToQueue('delete', id, group);
    }
  }

  getGroups(userId: string): LocalGroup[] {
    return localDb.getAllGroups(userId);
  }

  async fetchFromSupabase(userId: string): Promise<void> {
    if (!this.isOnline) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        data.forEach((group: Group) => {
          // Skip if this group was deleted locally
          if (localDb.isGroupDeleted(group.id)) {
            console.log('Skipping deleted group from Supabase:', group.id);
            return;
          }

          const existing = localDb.getGroupById(group.id);

          if (!existing) {
            localDb.insertGroup({
              id: group.id,
              user_id: group.user_id,
              name: group.name,
              created_at: group.created_at,
            });
            localDb.markGroupAsSynced(group.id);
          }
        });
      }

      // Clean up old deleted groups (older than 30 days)
      localDb.clearOldDeletedGroups(30);
    } catch (error) {
      console.error('Failed to fetch groups from Supabase:', error);
    }
  }

  async syncWithSupabase(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      // Clean up orphaned temp ID operations (deletes for groups that were never added)
      let queue = localDb.getGroupQueue();
      const tempIdDeletes = queue.filter(
        item => item.action === 'delete' && item.group_id.startsWith('temp_group_')
      );

      for (const item of tempIdDeletes) {
        console.log(`Cleaning up orphaned delete operation for temp group ID:`, item.group_id);
        localDb.removeFromGroupQueue(item.id);
      }

      // Process in two passes to handle temp ID -> real ID transitions
      // Pass 1: Process all 'add' operations first
      queue = localDb.getGroupQueue();
      const addItems = queue.filter(item => item.action === 'add');

      for (const item of addItems) {
        try {
          const data = JSON.parse(item.data);

          const { data: insertData, error: addError } = await supabase.from('groups').insert({
            user_id: data.user_id,
            name: data.name,
          }).select();

          if (addError) {
            console.error('Queue sync group add error:', addError);
            continue; // Skip this item but continue with others
          }

          if (insertData && insertData[0]) {
            const supabaseId = insertData[0].id;
            const oldTempId = item.group_id;

            // Update local database with Supabase ID
            localDb.deleteGroup(oldTempId);
            localDb.insertGroup({
              id: supabaseId,
              user_id: data.user_id,
              name: data.name,
              created_at: insertData[0].created_at,
            });
            localDb.markGroupAsSynced(supabaseId);

            // Update any other queued operations for this group to use the new ID
            localDb.updateGroupQueueId(oldTempId, supabaseId);
            console.log('Synced group add and updated queue items from temp ID to Supabase ID:', oldTempId, '->', supabaseId);

            // IMPORTANT: Update todos and todo queue items that reference this group
            this.updateTodosGroupId(oldTempId, supabaseId);

            // Remove from queue only after successful sync
            localDb.removeFromGroupQueue(item.id);
          }
        } catch (error) {
          console.error(`Failed to sync group add item ${item.id}:`, error);
        }
      }

      // Pass 2: Process all 'delete' operations (now with real IDs)
      queue = localDb.getGroupQueue(); // Refresh queue to get updated IDs
      const deleteItems = queue.filter(item => item.action === 'delete');

      for (const item of deleteItems) {
        try {
          // Skip if still has temp ID (add operation must have failed)
          if (item.group_id.startsWith('temp_group_')) {
            console.log('Skipping delete for temp group ID (add operation not completed):', item.group_id);
            continue;
          }

          const { error: deleteError } = await supabase.from('groups').delete().eq('id', item.group_id);

          if (!deleteError) {
            console.log('Successfully synced group delete for:', item.group_id);
            localDb.removeFromGroupQueue(item.id);
          } else {
            console.error('Queue sync group delete error:', deleteError);
          }
        } catch (error) {
          console.error(`Failed to sync group queue item ${item.id}:`, error);
        }
      }

      console.log('Group sync completed successfully');
      
      // Notify todo service that groups have been synced
      if (this.onGroupsSyncedCallback) {
        console.log('Notifying todo service to sync after group sync');
        this.onGroupsSyncedCallback();
      }
    } catch (error) {
      console.error('Group sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Get or create a group by name
  async ensureGroup(userId: string, name: string): Promise<LocalGroup> {
    // Check local database first
    const localGroups = this.getGroups(userId);
    const existing = localGroups.find(g => g.name === name);
    
    // If exists locally and has a REAL ID (not temp), return it
    if (existing && !existing.id.startsWith('temp_group_')) {
      console.log('Group exists locally with real ID:', existing.id);
      return existing;
    }

    // If has temp ID or doesn't exist locally, check/create in Supabase
    if (this.isOnline) {
      try {
        // First check if it exists in Supabase
        const { data: existingData, error: selectError } = await supabase
          .from('groups')
          .select('*')
          .eq('user_id', userId)
          .eq('name', name)
          .maybeSingle();

        if (existingData && !selectError) {
          console.log('Group exists in Supabase, syncing to local:', existingData.id);
          
          // Delete temp group if exists
          if (existing) {
            localDb.deleteGroup(existing.id);
          }
          
          // Add real group
          const group: Omit<LocalGroup, 'synced'> = {
            id: existingData.id,
            user_id: existingData.user_id,
            name: existingData.name,
            created_at: existingData.created_at,
          };
          localDb.insertGroup(group);
          localDb.markGroupAsSynced(existingData.id);
          
          // Update todos that referenced the temp group
          if (existing) {
            localDb.updateTodosGroupId(existing.id, existingData.id);
          }
          
          return { ...group, synced: 1 };
        }
      } catch (error) {
        console.log('Group not found in Supabase, will create:', name);
      }
    }

    // Group doesn't exist in Supabase, create it
    console.log('Creating new group in Supabase:', name);
    const newGroup = await this.addGroup(userId, name);
    
    // Delete temp group if exists
    if (existing) {
      localDb.deleteGroup(existing.id);
      // Update todos that referenced the temp group
      localDb.updateTodosGroupId(existing.id, newGroup.id);
    }
    
    return newGroup;
  }

  // Utility method to ensure default groups exist
  async ensureDefaultGroups(userId: string): Promise<void> {
    const defaultGroups = ['Personal', 'Work'];

    for (const groupName of defaultGroups) {
      try {
        await this.ensureGroup(userId, groupName);
      } catch (error) {
        console.error(`Failed to ensure group ${groupName}:`, error);
      }
    }
  }

  // Helper method to update todos when group gets a real ID
  private updateTodosGroupId(oldGroupId: string, newGroupId: string): void {
    try {
      // Update todos table
      localDb.updateTodosGroupId(oldGroupId, newGroupId);
      
      // Update todo queue items
      localDb.updateTodoQueueGroupId(oldGroupId, newGroupId);
      
      console.log('Updated todos and todo queue with new group ID:', oldGroupId, '->', newGroupId);
    } catch (error) {
      console.error('Failed to update todos group_id:', error);
    }
  }
}

export const groupService = new GroupService();

