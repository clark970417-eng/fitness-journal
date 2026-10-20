(function createFitnessStore(global) {
  const DB_NAME = 'fitness-journal-v1';
  const DB_VERSION = 2;

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function open() {
    if (!global.indexedDB) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const request = global.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
        if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('history')) {
          const history = db.createObjectStore('history', { keyPath: 'id' });
          history.createIndex('date', 'date');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function run(storeName, mode, operation) {
    const db = await open();
    if (!db) return null;
    const transaction = db.transaction(storeName, mode);
    const result = await operation(transaction.objectStore(storeName));
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    db.close();
    return result;
  }

  const api = {
    loadState: () => run('state', 'readonly', store => requestResult(store.get('current'))),
    saveState: value => run('state', 'readwrite', store => requestResult(store.put(value, 'current'))),
    listHistory: async () => {
      const rows = await run('history', 'readonly', store => requestResult(store.getAll()));
      return (rows || []).sort((a, b) => b.date.localeCompare(a.date));
    },
    addHistory: entry => run('history', 'readwrite', store => requestResult(store.put(entry))),
    saveVideo: async entry => {
      if (!global.indexedDB) throw new Error('此瀏覽器無法保存影片');
      return run('videos', 'readwrite', store => requestResult(store.put(entry)));
    },
    getVideo: id => run('videos', 'readonly', store => requestResult(store.get(id))),
    removeVideo: id => run('videos', 'readwrite', store => requestResult(store.delete(id))),
    listVideos: async () => {
      const rows = await run('videos', 'readonly', store => new Promise((resolve, reject) => {
        const rows = []; const request = store.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return resolve(rows);
          const { blob, observations, reviewedSets, reviewDraft, ...metadata } = cursor.value;
          rows.push(metadata); cursor.continue();
        };
        request.onerror = () => reject(request.error);
      }));
      return (rows || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    replaceHistory: entries => run('history', 'readwrite', store => {
      store.clear();
      entries.forEach(entry => store.put(entry));
      return Promise.resolve(entries.length);
    }),
    reset: async () => {
      if (!global.indexedDB) return;
      const db = await open();
      db.close();
      await requestResult(global.indexedDB.deleteDatabase(DB_NAME));
    },
  };

  global.FitnessStore = api;
})(window);
