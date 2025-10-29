import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('todoly.db');

export type LocalTodo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  group_id: string;
  is_completed: number; // SQLite stores as 0 or 1
  created_at: string;
  updated_at: string;
  synced: number; // SQLite stores as 0 or 1
};

export type LocalGroup = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  synced: number; // SQLite stores as 0 or 1
};

export type QueueItem = {
  id: number;
  action: 'add' | 'update' | 'delete';
  todo_id: string;
  data: string;
  timestamp: string;
};

export type GroupQueueItem = {
  id: number;
  action: 'add' | 'delete';
  group_id: string;
  data: string;
  timestamp: string;
};

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      is_completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `);

  // Migration: Add group_id column if it doesn't exist
  try {
    db.execSync(`ALTER TABLE todos ADD COLUMN group_id TEXT;`);
    console.log('Added group_id column to todos table');
    
    // Set a placeholder group_id for existing todos
    db.execSync(`UPDATE todos SET group_id = 'temp_group_default' WHERE group_id IS NULL;`);
    console.log('Updated existing todos with default group_id');
  } catch (error: any) {
    // Column already exists or other error
    if (!error.message.includes('duplicate column name')) {
      console.log('group_id column already exists or migration not needed');
    }
  }

  db.execSync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      todo_id TEXT NOT NULL,
      data TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS group_sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      group_id TEXT NOT NULL,
      data TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS deleted_todos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      deleted_at TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS deleted_groups (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      deleted_at TEXT NOT NULL
    );
  `);
};

export const localDb = {
  getAllTodos: (userId: string): LocalTodo[] => {
    return db.getAllSync<LocalTodo>(
      'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  },

  getTodoById: (id: string): LocalTodo | null => {
    const result = db.getFirstSync<LocalTodo>('SELECT * FROM todos WHERE id = ?', [id]);
    return result || null;
  },

  insertTodo: (todo: Omit<LocalTodo, 'synced'>) => {
    db.runSync(
      `INSERT INTO todos (id, user_id, title, description, group_id, is_completed, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [todo.id, todo.user_id, todo.title, todo.description, todo.group_id || 'temp_group_default', todo.is_completed, todo.created_at, todo.updated_at]
    );
  },

  updateTodo: (id: string, updates: Partial<LocalTodo>) => {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'synced').map(k => `${k} = ?`).join(', ');
    const values = Object.keys(updates).filter(k => k !== 'id' && k !== 'synced').map(k => updates[k as keyof LocalTodo]);
    
    db.runSync(
      `UPDATE todos SET ${fields}, synced = 0, updated_at = ? WHERE id = ?`,
      [...values, new Date().toISOString(), id] as any[]
    );
  },

  deleteTodo: (id: string) => {
    db.runSync('DELETE FROM todos WHERE id = ?', [id]);
  },

  markAsSynced: (id: string) => {
    db.runSync('UPDATE todos SET synced = 1 WHERE id = ?', [id]);
  },

  addToQueue: (action: 'add' | 'update' | 'delete', todoId: string, data: any) => {
    db.runSync(
      'INSERT INTO sync_queue (action, todo_id, data, timestamp) VALUES (?, ?, ?, ?)',
      [action, todoId, JSON.stringify(data), new Date().toISOString()]
    );
  },

  getQueue: (): QueueItem[] => {
    return db.getAllSync<QueueItem>('SELECT * FROM sync_queue ORDER BY timestamp ASC');
  },

  removeFromQueue: (id: number) => {
    db.runSync('DELETE FROM sync_queue WHERE id = ?', [id]);
  },

  removeFromQueueByTodoId: (todoId: string) => {
    db.runSync('DELETE FROM sync_queue WHERE todo_id = ?', [todoId]);
  },

  updateQueueTodoId: (oldId: string, newId: string) => {
    db.runSync('UPDATE sync_queue SET todo_id = ? WHERE todo_id = ?', [newId, oldId]);
  },

  clearQueue: () => {
    db.runSync('DELETE FROM sync_queue');
  },

  markAsDeleted: (id: string, userId: string) => {
    db.runSync(
      'INSERT OR REPLACE INTO deleted_todos (id, user_id, deleted_at) VALUES (?, ?, ?)',
      [id, userId, new Date().toISOString()]
    );
  },

  isDeleted: (id: string): boolean => {
    const result = db.getFirstSync<{ id: string }>('SELECT id FROM deleted_todos WHERE id = ?', [id]);
    return result !== null;
  },

  clearOldDeletedTodos: (daysOld: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    db.runSync('DELETE FROM deleted_todos WHERE deleted_at < ?', [cutoffDate.toISOString()]);
  },

  updateTodosGroupId: (oldGroupId: string, newGroupId: string) => {
    db.runSync('UPDATE todos SET group_id = ? WHERE group_id = ?', [newGroupId, oldGroupId]);
  },

  updateTodoQueueGroupId: (oldGroupId: string, newGroupId: string) => {
    const queue = db.getAllSync<QueueItem>('SELECT * FROM sync_queue');
    queue.forEach((item) => {
      try {
        const data = JSON.parse(item.data);
        if (data.group_id === oldGroupId) {
          data.group_id = newGroupId;
          db.runSync('UPDATE sync_queue SET data = ? WHERE id = ?', [JSON.stringify(data), item.id]);
        }
      } catch (error) {
        console.error('Failed to update queue item group_id:', error);
      }
    });
  },

  // Group operations
  getAllGroups: (userId: string): LocalGroup[] => {
    return db.getAllSync<LocalGroup>(
      'SELECT * FROM groups WHERE user_id = ? ORDER BY name ASC',
      [userId]
    );
  },

  getGroupById: (id: string): LocalGroup | null => {
    const result = db.getFirstSync<LocalGroup>('SELECT * FROM groups WHERE id = ?', [id]);
    return result || null;
  },

  insertGroup: (group: Omit<LocalGroup, 'synced'>) => {
    db.runSync(
      `INSERT INTO groups (id, user_id, name, created_at, synced)
       VALUES (?, ?, ?, ?, 0)`,
      [group.id, group.user_id, group.name, group.created_at]
    );
  },

  deleteGroup: (id: string) => {
    db.runSync('DELETE FROM groups WHERE id = ?', [id]);
  },

  markGroupAsSynced: (id: string) => {
    db.runSync('UPDATE groups SET synced = 1 WHERE id = ?', [id]);
  },

  addGroupToQueue: (action: 'add' | 'delete', groupId: string, data: any) => {
    db.runSync(
      'INSERT INTO group_sync_queue (action, group_id, data, timestamp) VALUES (?, ?, ?, ?)',
      [action, groupId, JSON.stringify(data), new Date().toISOString()]
    );
  },

  getGroupQueue: (): GroupQueueItem[] => {
    return db.getAllSync<GroupQueueItem>('SELECT * FROM group_sync_queue ORDER BY timestamp ASC');
  },

  removeFromGroupQueue: (id: number) => {
    db.runSync('DELETE FROM group_sync_queue WHERE id = ?', [id]);
  },

  removeFromGroupQueueByGroupId: (groupId: string) => {
    db.runSync('DELETE FROM group_sync_queue WHERE group_id = ?', [groupId]);
  },

  updateGroupQueueId: (oldId: string, newId: string) => {
    db.runSync('UPDATE group_sync_queue SET group_id = ? WHERE group_id = ?', [newId, oldId]);
  },

  clearGroupQueue: () => {
    db.runSync('DELETE FROM group_sync_queue');
  },

  markGroupAsDeleted: (id: string, userId: string) => {
    db.runSync(
      'INSERT OR REPLACE INTO deleted_groups (id, user_id, deleted_at) VALUES (?, ?, ?)',
      [id, userId, new Date().toISOString()]
    );
  },

  isGroupDeleted: (id: string): boolean => {
    const result = db.getFirstSync<{ id: string }>('SELECT id FROM deleted_groups WHERE id = ?', [id]);
    return result !== null;
  },

  clearOldDeletedGroups: (daysOld: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    db.runSync('DELETE FROM deleted_groups WHERE deleted_at < ?', [cutoffDate.toISOString()]);
  },
};

export default db;

