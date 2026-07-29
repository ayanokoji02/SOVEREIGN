const CACHE_NAME = 'sovereign-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS).catch(function(){ /* fonts/CDN may fail offline-first install, that's fine */ });
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){ return n !== CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  const isNavigation = e.request.mode === 'navigate';
  if(isNavigation){
    // Network-first for the page itself, so updates are picked up promptly when online.
    e.respondWith(
      fetch(e.request).then(function(res){
        const clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, clone); });
        return res;
      }).catch(function(){
        return caches.match(e.request).then(function(cached){ return cached || caches.match('./index.html'); });
      })
    );
    return;
  }
  // Cache-first for everything else (app.js, icons, fonts) — fast, and works offline.
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(res){
        const clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, clone); });
        return res;
      }).catch(function(){ return cached; });
    })
  );
});
