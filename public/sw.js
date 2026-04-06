const CACHE_NAME = 'roadrescue-v1';
const STATIC_CACHE_NAME = 'roadrescue-static-v1';
const API_CACHE_NAME = 'roadrescue-api-v1';
const RUNTIME_CACHE_NAME = 'roadrescue-runtime-v1';

// Cache URLs - using existing Vite assets
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/profile/user',
  '/emergency',
  '/offline.html',
  '/manifest.json',
  '/vite.svg',
  // Static assets will be added dynamically during build
];

// API endpoints that should be cached
const API_ENDPOINTS = [
  '/api/providers',
  '/api/emergency',
  '/api/user/profile'
];

// Cache duration settings
const CACHE_DURATIONS = {
  static: 30 * 24 * 60 * 60 * 1000, // 30 days
  api: 5 * 60 * 1000, // 5 minutes
  runtime: 24 * 60 * 60 * 1000 // 24 hours
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v1');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v1');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== RUNTIME_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isAPIRequest(url)) {
    // Network First for API calls
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(url)) {
    // Stale-While-Revalidate for static assets
    event.respondWith(handleStaticAsset(request));
  } else {
    // Network First for navigation requests
    event.respondWith(handleNavigationRequest(request));
  }
});

// Handle API requests with Network First strategy
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful response
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        message: 'Please check your internet connection',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Handle static assets with Stale-While-Revalidate strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Always try to get fresh version in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Revalidate in background
    fetchPromise.then((networkResponse) => {
      if (networkResponse && networkResponse.ok) {
        console.log('[SW] Updated static asset:', request.url);
      }
    });
    
    return cachedResponse;
  }
  
  // If no cache, wait for network
  return fetchPromise || new Response('Offline', { status: 503 });
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  const url = new URL(request.url);
  
  // Only handle same-origin navigation requests
  if (url.origin !== self.location.origin) {
    return fetch(request);
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful HTML responses
      if (networkResponse.headers.get('content-type')?.includes('text/html')) {
        const cache = await caches.open(RUNTIME_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for navigation, trying cache:', request.url);
  }
  
  // Try cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return offline page for navigation failures
  return caches.match('/offline.html');
}

// Helper functions
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') || 
         API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint));
}

function isStaticAsset(url) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.ico', '.woff', '.woff2', '.ttf', '.eot'
  ];
  
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname.startsWith('/icons/') ||
         url.pathname.startsWith('/screenshots/') ||
         url.pathname.includes('vite.svg');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'emergency-request') {
    event.waitUntil(syncEmergencyRequests());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update from RoadRescue',
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [200, 100, 200],
    data: {
      url: '/emergency'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('RoadRescue', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

// Sync emergency requests when back online
async function syncEmergencyRequests() {
  try {
    const cache = await caches.open(RUNTIME_CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('emergency-request')) {
        try {
          const response = await cache.match(request);
          const data = await response.json();
          
          // Retry the emergency request
          await fetch('/api/emergency', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
          
          // Remove from cache after successful sync
          await cache.delete(request);
          console.log('[SW] Synced emergency request:', data.id);
        } catch (error) {
          console.error('[SW] Failed to sync emergency request:', error);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Error during sync:', error);
  }
}
