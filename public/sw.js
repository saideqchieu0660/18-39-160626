const CACHE_NAME = 'henosis-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch(err => console.error("Cache install error:", err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass API requests cache so it isn't tampered with
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  // Stale-While-Revalidate pattern for HTML/JS/CSS assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
           caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, networkResponse.clone());
           });
        }
        return networkResponse;
      }).catch(() => {
        // Fail silently in offline mode
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Background Sync capability to reconnect and upload data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-henosis-data') {
    event.waitUntil(syncOfflineData());
  }
});

function initOfflineDB_SW() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HenosisOfflineDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { keyPath: 'id' });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getPendingRequests_SW() {
  const db = await initOfflineDB_SW();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending_sync'], 'readonly');
    const store = transaction.objectStore('pending_sync');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearPendingRequests_SW(ids) {
  const db = await initOfflineDB_SW();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending_sync'], 'readwrite');
    const store = transaction.objectStore('pending_sync');
    ids.forEach(id => store.delete(id));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function syncOfflineData() {
  try {
    const requests = await getPendingRequests_SW();
    if (!requests || requests.length === 0) return;

    console.log(`[SW Background Sync] Khởi động đồng bộ ${requests.length} requests...`);
    
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests })
    });

    if (response.ok) {
      const data = await response.json();
      if(data.success && data.processedIds) {
          await clearPendingRequests_SW(data.processedIds);
          console.log(`[SW Background Sync] Đã đồng bộ ${data.processedIds.length} requests lên máy chủ!`);
      } else {
          const ids = requests.map(r => r.id);
          await clearPendingRequests_SW(ids);
      }
    } else {
      throw new Error(`Máy chủ từ chối lúc đồng bộ, trạng thái: ${response.status}`);
    }
  } catch (error) {
    console.error('[SW Background Sync] Thất bại, sẽ tự thử lại lần sau:', error);
    throw error;
  }
}
