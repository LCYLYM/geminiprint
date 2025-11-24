
const DB_NAME = 'MorisotDB';
const DB_VERSION = 1;
const STORE_CANVASES = 'canvases';
const STORE_META = 'meta';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_CANVASES)) {
        db.createObjectStore(STORE_CANVASES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };
  });
};

export const saveCanvasToDB = async (data: any) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_CANVASES, 'readwrite');
    const store = tx.objectStore(STORE_CANVASES);
    const req = store.put(data);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const loadCanvasFromDB = async (id: string) => {
  const db = await initDB();
  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction(STORE_CANVASES, 'readonly');
    const store = tx.objectStore(STORE_CANVASES);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const saveMetaToDB = async (key: string, value: any) => {
   const db = await initDB();
   return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readwrite');
    const store = tx.objectStore(STORE_META);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
   });
}

export const loadMetaFromDB = async (key: string) => {
   const db = await initDB();
   return new Promise<any>((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readonly');
    const store = tx.objectStore(STORE_META);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
   });
}
