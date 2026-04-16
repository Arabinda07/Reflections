/**
 * offlineStorage.ts
 * 
 * High-performance, low-dependency IndexedDB wrapper for offline first operations.
 * Manages local persistence for notes and a synchronization queue.
 */

const DB_NAME = 'reflections_offline_db';
const DB_VERSION = 1;
const STORES = {
  NOTES: 'notes',
  SYNC_QUEUE: 'sync_queue',
};

export interface SyncOperation {
  id?: number;
  action: 'create' | 'update' | 'delete';
  entityId: string;
  data: any;
  timestamp: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Notes store
        if (!db.objectStoreNames.contains(STORES.NOTES)) {
          const noteStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
          noteStore.createIndex('user_id', 'user_id', { unique: false });
          noteStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // --- Note Operations ---

  async saveNote(note: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.NOTES, 'readwrite');
      const store = tx.objectStore(STORES.NOTES);
      const request = store.put(note);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllNotes(userId: string): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.NOTES, 'readonly');
      const store = tx.objectStore(STORES.NOTES);
      const index = store.index('user_id');
      const request = index.getAll(IDBKeyRange.only(userId));

      request.onsuccess = () => {
        // Sort by updated_at descending locally
        const notes = request.result.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        resolve(notes);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getNoteById(id: string): Promise<any | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.NOTES, 'readonly');
      const store = tx.objectStore(STORES.NOTES);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteNote(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.NOTES, 'readwrite');
      const store = tx.objectStore(STORES.NOTES);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Sync Queue Operations ---

  async addToQueue(op: Omit<SyncOperation, 'id'>): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const request = store.add(op);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getQueuedOperations(): Promise<SyncOperation[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromQueue(id: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
