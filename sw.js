// 카페 운영 일지 Service Worker - 백그라운드 업데이트
const CACHE_NAME = 'cafe-log-v5';
const ASSETS = ['/cafe-log/', '/cafe-log/index.html'];

// 설치: 새 캐시에 파일 저장
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  // 기존 SW를 즉시 교체하지 않고 대기 (사용 중일 때 방해 안 함)
  // self.skipWaiting() 제거 → 앱 닫을 때까지 기존 버전 유지
});

// 활성화: 이전 캐시 삭제 + 클라이언트에 업데이트 알림
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => {
      // 모든 클라이언트에 업데이트 알림 전송
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'APP_UPDATED' }));
      });
    })
  );
  self.clients.claim();
});

// 요청 처리: 캐시 우선 (stale-while-revalidate)
self.addEventListener('fetch', e => {
  // API 요청은 항상 네트워크
  if(e.request.url.includes('supabase.co') ||
     e.request.url.includes('anthropic.com') ||
     e.request.url.includes('googleapis.com') ||
     e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // 캐시된 버전 즉시 반환 (사용자는 기다림 없음)
      const fetchPromise = fetch(e.request).then(response => {
        if(response.status === 200){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
