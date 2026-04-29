const CACHE_NAME = 'cafe-log-v4';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['/cafe-log/', '/cafe-log/index.html'])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.url.includes('supabase.co') || e.request.url.includes('anthropic.com')) return;
  e.respondWith(
    fetch(e.request).then(response => {
      if(e.request.method === 'GET' && response.status === 200){
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return response;
    }).catch(() => caches.match(e.request).then(cached => cached || caches.match('/cafe-log/index.html')))
  );
});
