const CACHE_NAME = 'wiinmart-v803'; // Banner instal sekarang otomatis muncul untuk semua pengunjung

// File-file inti yang dibutuhkan agar aplikasi tetap bisa dibuka saat offline
const assetsToCache = [
  './',
  'index.html',
  'manifest.json',
  'logo-192.jpg',
  'logo-512.jpg',
  'logo.jpg',
  'sampul.jpg',
  'banner-toko.jpeg',
  'best-seller.jpeg',
  'foto-wiinmart.jpg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        assetsToCache.map(url =>
          cache.add(url).catch(err => console.warn('Gagal cache:', url, err))
        )
      )
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => {
      if (key !== CACHE_NAME) return caches.delete(key);
    })))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Lewati permintaan non-GET (misalnya ke Firebase Database) agar tidak di-cache
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
        // Simpan salinan asset baru dari domain sendiri ke cache (kecuali Firebase/API)
        if (
          event.request.url.startsWith(self.location.origin) &&
          networkResponse && networkResponse.status === 200
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => cachedResponse);
    })
  );
});
