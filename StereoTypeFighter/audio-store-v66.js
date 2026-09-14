const DB_NAME = 'stf-v66-audio-db';
const DB_VERSION = 1;
const ASSET_STORE = 'audioAssets';
const META_STORE = 'meta';
const CONFIG_KEY = 'audio-config';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(ASSET_STORE)) db.createObjectStore(ASSET_STORE, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(storeName, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    Promise.resolve(fn(store, tx)).then(resolve).catch(reject);
    tx.onerror = () => reject(tx.error);
  }).finally(() => db.close());
}

export async function saveAudioAsset(key, file) {
  const arrayBuffer = await file.arrayBuffer();
  return withStore(ASSET_STORE, 'readwrite', store => new Promise((resolve, reject) => {
    const req = store.put({ key, name: file.name, type: file.type || 'audio/mpeg', updatedAt: Date.now(), data: arrayBuffer });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  }));
}

export async function getAudioAsset(key) {
  return withStore(ASSET_STORE, 'readonly', store => new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  }));
}

export async function deleteAudioAsset(key) {
  return withStore(ASSET_STORE, 'readwrite', store => new Promise((resolve, reject) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  }));
}

export async function listAudioAssets() {
  return withStore(ASSET_STORE, 'readonly', store => new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  }));
}

export async function getAudioUrl(key) {
  const asset = await getAudioAsset(key);
  if (!asset) return null;
  return URL.createObjectURL(new Blob([asset.data], { type: asset.type || 'audio/mpeg' }));
}

export async function saveAudioConfig(config) {
  return withStore(META_STORE, 'readwrite', store => new Promise((resolve, reject) => {
    const req = store.put({ key: CONFIG_KEY, value: config, updatedAt: Date.now() });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  }));
}

export async function loadAudioConfig() {
  return withStore(META_STORE, 'readonly', store => new Promise((resolve, reject) => {
    const req = store.get(CONFIG_KEY);
    req.onsuccess = () => resolve(req.result?.value || null);
    req.onerror = () => reject(req.error);
  }));
}
