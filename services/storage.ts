
import { Story, VectorData } from '../types';

const DB_NAME = 'AetheriaDB';
const DB_VERSION = 1;
const STORE_STORIES = 'stories';
const STORE_VECTORS = 'vectors';

// Helper to open DB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_STORIES)) {
        db.createObjectStore(STORE_STORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_VECTORS)) {
        db.createObjectStore(STORE_VECTORS, { keyPath: 'id' });
      }
    };
  });
};

export const storageService = {
  async saveStory(story: Story): Promise<void> {
    const dbLocal = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = dbLocal.transaction(STORE_STORIES, 'readwrite');
      const store = tx.objectStore(STORE_STORIES);
      
      if (!story.id) {
          console.error("Attempted to save story without ID:", story);
          reject(new Error("Story missing ID"));
          return;
      }

      try {
          const request = store.put(story);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
      } catch (e) {
          console.error("Sync error saving story:", e);
          reject(e);
      }
    });
  },

  async getStory(id: string): Promise<Story | undefined> {
    const dbLocal = await openDB();
    return new Promise((resolve, reject) => {
      const tx = dbLocal.transaction(STORE_STORIES, 'readonly');
      const store = tx.objectStore(STORE_STORIES);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllStories(): Promise<Story[]> {
    const dbLocal = await openDB();
    const localStories = await new Promise<Story[]>((resolve, reject) => {
      const tx = dbLocal.transaction(STORE_STORIES, 'readonly');
      const store = tx.objectStore(STORE_STORIES);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return localStories;
  },

  async deleteStory(id: string): Promise<void> {
    const dbLocal = await openDB();
    await new Promise<void>((resolve, reject) => {
        const tx = dbLocal.transaction(STORE_STORIES, 'readwrite');
        const store = tx.objectStore(STORE_STORIES);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  },

  // Vector Operations
  async saveVectors(vectors: VectorData[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_VECTORS, 'readwrite');
      const store = tx.objectStore(STORE_VECTORS);
      let completed = 0;
      
      if (vectors.length === 0) {
        resolve();
        return;
      }

      vectors.forEach(v => {
        try {
            if (!v.id) {
                console.warn("Skipping vector without ID:", v);
                completed++;
                if (completed === vectors.length) resolve();
                return;
            }
            const req = store.put(v);
            req.onsuccess = () => {
              completed++;
              if (completed === vectors.length) resolve();
            };
            req.onerror = () => {
                console.error("Vector save error (async):", req.error);
                completed++;
                if (completed === vectors.length) resolve();
            };
        } catch (e) {
            console.error("Vector save error (sync):", e);
            completed++;
            if (completed === vectors.length) resolve();
        }
      });
    });
  },

  async getAllVectors(): Promise<VectorData[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_VECTORS, 'readonly');
      const store = tx.objectStore(STORE_VECTORS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
};
