const CACHE_VERSION = 'v3';
const STATIC_CACHE = `aave-yield-static-${CACHE_VERSION}`;
const PAGES_CACHE = `aave-yield-pages-${CACHE_VERSION}`;

// Cache TTL in milliseconds
const CACHE_TTL = {
  STATIC: 24 * 60 * 60 * 1000, // 24 hours for static assets
  PAGES: 4 * 60 * 60 * 1000, // 4 hours for pages (longer since React Query handles data)
};

const STATIC_CACHE_URLS = ['/', '/favicon.ico', '/manifest.json'];

// Helper function to add timestamp to cached responses
function addTimestamp(response) {
  const responseWithTimestamp = response.clone();
  const headers = new Headers(responseWithTimestamp.headers);
  headers.set('sw-cache-timestamp', Date.now().toString());
  return new Response(responseWithTimestamp.body, {
    status: responseWithTimestamp.status,
    statusText: responseWithTimestamp.statusText,
    headers: headers,
  });
}

// Helper function to check if cache is expired
function isCacheExpired(response, ttl) {
  const timestamp = response.headers.get('sw-cache-timestamp');
  if (!timestamp) return true;
  return Date.now() - parseInt(timestamp) > ttl;
}

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const validCaches = [STATIC_CACHE, PAGES_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!validCaches.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        return self.clients.claim();
      }),
  );
});

// Fetch event - complementary caching to React Query
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and extensions
  if (request.method !== 'GET' || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    return;
  }

  // Skip API requests - let React Query handle them completely
  if (url.pathname.includes('/api/')) {
    return; // Pass through to network, React Query will handle caching
  }

  // Static assets - cache-first with long TTL
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Next.js assets - cache-first (immutable)
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(handleNextAsset(request));
    return;
  }

  // Pages - network-first with offline fallback
  event.respondWith(handlePageRequest(request));
});

// Handle static assets with aggressive caching
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached && !isCacheExpired(cached, CACHE_TTL.STATIC)) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, addTimestamp(response.clone()));
    }
    return response;
  } catch {
    return cached || fetch(request);
  }
}

// Handle Next.js assets with immutable caching
async function handleNextAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached; // Next.js assets are immutable
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return fetch(request);
  }
}

// Handle page requests - network-first for fresh content, cache for offline
async function handlePageRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, addTimestamp(response.clone()));
    }
    return response;
  } catch {
    // Network failed, try to serve from cache for offline support
    const cache = await caches.open(PAGES_CACHE);
    const cached = await cache.match(request);
    return (
      cached ||
      new Response('Offline - Please check your connection', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      })
    );
  }
}

// Check if URL is a static asset
function isStaticAsset(url) {
  const staticExtensions = [
    '.ico',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.css',
    '.js',
    '.woff',
    '.woff2',
    '.ttf',
  ];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}
