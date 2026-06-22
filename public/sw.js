const CACHE_NAME = 'roundup-calc-v2';
const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'icon.svg',
  'icon-192.png',
  'icon-512.png'
];

// Installe le service worker et pré-cache les ressources statiques de base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pré-mise en cache des ressources essentielles');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Active le service worker et nettoie les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepte les requêtes réseau pour servir depuis le cache d'abord (Cache-first)
self.addEventListener('fetch', (event) => {
  // Uniquement pour les requêtes de type GET
  if (event.request.method !== 'GET') return;

  // Évite de mettre en cache les extensions de navigateur ou ressources externes non désirées
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    // On laisse passer les CDNs de polices par exemple (hôtes explicitement autorisés)
    const allowedExternalHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
    if (allowedExternalHosts.has(url.hostname.toLowerCase())) {
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request).then((networkResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          });
        })
      );
    }
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Optionnel : mettre à jour le cache en arrière-plan (Stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Erreur silencieuse en mode hors-ligne */});

        return cachedResponse;
      }

      // Si pas dans le cache, récupérer sur le réseau et l'ajouter au cache de manière dynamique
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        // En cas de panne réseau complète et ressource manquante
        console.log('[Service Worker] Requête échouée et hors cache:', err);
        return caches.match('/index.html');
      });
    })
  );
});

// Installe le gestionnaire pour les notifications Push natives de fond
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_PUSH_NOTIFICATION') {
    const { title, body } = event.data;
    const options = {
      body: body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200],
      tag: 'weather-critical-alert',
      renotify: true,
      data: {
        date: new Date().toLocaleDateString('fr-FR')
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Gère le clic sur la notification native
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
