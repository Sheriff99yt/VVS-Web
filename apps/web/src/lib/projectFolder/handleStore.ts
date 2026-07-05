const DB_NAME = 'vvs-project-handles';
const DB_VERSION = 1;
const STORE = 'handles';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

export function createFolderKey(): string {
  return `folder-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Stable key from folder display name — same folder reopens under one recent entry. */
export function folderKeyFromHandleName(name: string): string {
  let hash = 2166136261;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 48) || 'project';
  return `folder-${(hash >>> 0).toString(36)}-${safe}`;
}

export async function storeFolderHandle(
  key: string,
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(handle, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFolderHandle(key: string): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => resolve((request.result as FileSystemDirectoryHandle) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function removeFolderHandle(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
