import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('todoly.db');

export type LocalTodo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: number; // SQLite stores as 0 or 1
  created_at: string;
  updated_at: string;
  synced: number; // SQLite stores as 0 or 1
};

export type QueueItem = {
  id: number;
  action: 'add' | 'update' | 'delete';
  todo_id: string;
  data: string;
  timestamp: string;
};

export const initDatabase = () => {
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
    CREATE TABLE IF NOT EXISTS deleted_todos (
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
      `INSERT INTO todos (id, user_id, title, description, is_completed, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [todo.id, todo.user_id, todo.title, todo.description, todo.is_completed, todo.created_at, todo.updated_at]
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
};

export default db;

