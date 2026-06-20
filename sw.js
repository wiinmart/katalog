const CACHE_NAME = 'wiinmart-v803'; // Naikkan angka ini SETIAP kali upload perubahan baru, supaya HP pengguna ambil versi terbaru

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

  const url = new URL(event.request.url);
  const isHtml = event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  // HTML (index.html): NETWORK-FIRST. Selalu coba ambil versi terbaru dari server dulu,
  // supaya perubahan tampilan/fitur langsung kelihatan begitu di-upload. Cache cuma jadi cadangan saat offline.
  if (isHtml) {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return networkResponse;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // File lain (gambar, manifest, dll): CACHE-FIRST seperti biasa, biar hemat kuota & cepat
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
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
