const DB_NAME = 'RoundupCalcDB';
const DB_VERSION = 1;
const STORE_NAME = 'form_inputs';

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('[IndexedDB] Error loading database:', event);
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
        console.log(`[IndexedDB] Object store '${STORE_NAME}' created successfully.`);
      }
    };
  });
}

/**
 * Saves a key-value pair in IndexedDB.
 */
export async function saveInputItem(key: string, value: any): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error(`[IndexedDB] Failed to save key "${key}":`, event);
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.warn(`[IndexedDB] Cannot save ${key} due to IndexedDB error:`, error);
  }
}

/**
 * Retrieves a value associated with a key from IndexedDB.
 */
export async function getInputItem<T = any>(key: string): Promise<T | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result || null);
      };

      request.onerror = (event) => {
        console.error(`[IndexedDB] Failed to read key "${key}":`, event);
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.warn(`[IndexedDB] Cannot read ${key} due to IndexedDB error:`, error);
    return null;
  }
}

/**
 * Clears all cached form inputs.
 */
export async function clearAllInputs(): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[IndexedDB] All persisted inputs cleared.');
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.warn('[IndexedDB] Cannot clear store due to IndexedDB error:', error);
  }
}
