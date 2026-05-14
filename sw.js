// ─────────────────────────────────────────────────────────────────
// FIX #13 : Numéro de version à incrémenter à chaque déploiement
// (ex: cdm2026-v2, cdm2026-v3 ...) pour forcer le rafraîchissement
// du cache sur tous les appareils des utilisateurs.
// ─────────────────────────────────────────────────────────────────
// PR #2 : bump v3 après l'extraction du CSS en /styles/*.css
// PR #3 : bump v4 après l'extraction de 10 modules JS dans /js/
// (force le refresh du cache pour que les clients existants récupèrent
// la nouvelle structure de chargement)
const CACHE = 'cdm2026-v4';

// FIX #8 : Les polices Google Fonts sont maintenant mises en cache
// pour que l'app reste belle en mode hors-ligne.
// Note : les polices Google Fonts ont des URLs variables selon le
// navigateur (User-Agent). On utilise la stratégie "cache then network"
// dans le handler fetch pour les capturer dynamiquement au premier chargement.
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  // PR #2 : feuilles de style séparées
  '/styles/variables.css',
  '/styles/reset.css',
  '/styles/components.css',
  '/styles/animations.css',
  '/styles/screens.css',
  // PR #3 : modules JS extraits
  '/js/supabase.js',
  '/js/avatars.js',
  '/js/data/flags.js',
  '/js/data/cotes.js',
  '/js/badges.js',
  '/js/cartes.js',
  '/js/pwa.js',
  '/js/rewards.js',
  '/js/notifications.js',
  '/js/badge-unlock.js',
];

// ── Install : mise en cache des assets statiques ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate : suppression des anciens caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE)
          .map(k => {
            console.log('[SW] Suppression ancien cache :', k);
            return caches.delete(k);
          })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch : stratégie adaptée selon le type de ressource ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Supabase : toujours réseau (données en temps réel — ne jamais cacher)
  if (url.hostname.includes('supabase.co')) return;

  // Google Fonts (CSS et polices .woff2) : cache-first avec fallback réseau
  // FIX #8 : capture des polices au premier chargement pour le mode hors-ligne
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            // Ne cacher que les réponses valides
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Autres ressources : réseau d'abord, cache en fallback hors-ligne
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
