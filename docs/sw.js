// 홈 화면에 설치할 수 있게 하는 최소 서비스 워커.
// 새 버전을 올리면 바로 보이도록 네트워크를 먼저 쓰고, 끊겼을 때만 저장본을 연다.
const CACHE = 'newbie-quest-v1';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'])));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});
