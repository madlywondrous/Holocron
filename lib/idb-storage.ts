import type { StateStorage } from 'zustand/middleware'

const DB_NAME = 'holocron-db'
const STORE_NAME = 'keyval'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB is not available on the server'))
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode)
      const store = transaction.objectStore(STORE_NAME)
      const request = callback(store)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  })
}

export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null
    try {
      const value = await runTransaction<string | null>('readonly', (store) => store.get(name))
      return value ?? null
    } catch (error) {
      console.warn(`[idbStorage] getItem failed for key "${name}":`, error)
      return null
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return
    try {
      await runTransaction('readwrite', (store) => store.put(value, name))
    } catch (error) {
      console.error(`[idbStorage] setItem failed for key "${name}":`, error)
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === 'undefined') return
    try {
      await runTransaction('readwrite', (store) => store.delete(name))
    } catch (error) {
      console.error(`[idbStorage] removeItem failed for key "${name}":`, error)
    }
  },
}
