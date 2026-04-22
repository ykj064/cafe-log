// 카페 운영 일지 Service Worker
const CACHE_NAME = 'cafe-log-v1';
const ASSETS = [
  '/cafe-log/',
  '/cafe-log/index.html',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Mono:wght@400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/cafe-log/', '/cafe-log/index.html']);
    })
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', e => {
  // Supabase API 요청은 항상 네트워크
  if (e.request.url.includes('supabase.co') || 
      e.request.url.includes('anthropic.com')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // 성공한 GET 요청만 캐시
        if (e.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // 오프라인 + 캐시 없으면 index.html 반환
        if (e.request.destination === 'document') {
          return caches.match('/cafe-log/index.html');
        }
      });
    })
  );
});
