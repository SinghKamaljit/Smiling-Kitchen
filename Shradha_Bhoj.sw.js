const CACHE_NAME = 'shradha-bhoj-v1';
const APP_SHELL = [
    './',
    './Shradha_Bhoj.manifest.json',
    './Shradha_Bhoj-icon-192.png',
    './Shradha_Bhoj-icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // config.json holds the owner's live settings (amounts, labels, QR) — always try the network
    // first so a guest sees the latest published version, falling back to the last cached copy
    // only when offline.
    if (url.includes('Shradha_Bhoj.config.json')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Everything else (the app shell) is cache-first for instant, offline-friendly loading,
    // refreshing the cache in the background whenever the network is available.
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const networkFetch = fetch(event.request)
                .then((response) => {
                    if (response && response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || networkFetch;
        })
    );
});
