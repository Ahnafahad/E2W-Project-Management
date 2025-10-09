const CACHE_NAME = 'e2w-pm-v1.0.0'
const STATIC_CACHE_NAME = 'e2w-pm-static-v1.0.0'
const DYNAMIC_CACHE_NAME = 'e2w-pm-dynamic-v1.0.0'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/tasks',
  '/projects',
  '/calendar',
  '/team',
  '/reports',
  '/settings',
  '/manifest.json',
  '/E2W Black Logo.png',
  '/E2W Gold Logo.png',
  '/E2W Mint Logo.png',
  '/E2W White Logo.png',
  '/_next/static/css/app/layout.css',
  '/_next/static/css/app/globals.css'
]

// URLs that should always go to network first
const NETWORK_FIRST_ROUTES = [
  '/api/',
  '/auth/',
  '/_next/webpack-hmr'
]

// URLs that should use cache first
const CACHE_FIRST_ROUTES = [
  '/_next/static/',
  '/icons/',
  '/images/',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
  '.css',
  '.js'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        // Add each asset individually to avoid failing entire cache on single error
        const cachePromises = STATIC_ASSETS.map(asset => {
          return cache.add(asset).catch(err => {
            console.warn(`[SW] Failed to cache ${asset}:`, err)
          })
        })
        return Promise.allSettled(cachePromises)
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((err) => {
        console.error('[SW] Failed to cache static assets:', err)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const deletePromises = cacheNames
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE_NAME &&
                   cacheName !== DYNAMIC_CACHE_NAME &&
                   cacheName.startsWith('e2w-pm-')
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })

        return Promise.all(deletePromises)
      })
      .then(() => {
        console.log('[SW] Service worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Skip webpack HMR and dev server requests
  if (url.pathname.includes('_next/webpack-hmr') ||
      url.pathname.includes('__nextjs') ||
      url.searchParams.has('_rsc')) {
    return
  }

  event.respondWith(handleRequest(request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  try {
    // Network first for API routes and auth
    if (NETWORK_FIRST_ROUTES.some(route => url.pathname.startsWith(route))) {
      return await networkFirstStrategy(request)
    }

    // Cache first for static assets
    if (CACHE_FIRST_ROUTES.some(route =>
      url.pathname.includes(route) || url.pathname.endsWith(route)
    )) {
      return await cacheFirstStrategy(request)
    }

    // Stale while revalidate for pages
    return await staleWhileRevalidateStrategy(request)

  } catch (error) {
    console.error('[SW] Error handling request:', error)
    return await fallbackStrategy(request)
  }
}

// Network first strategy - try network, fallback to cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url)
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Network error', { status: 408 })
  }
}

// Cache first strategy - try cache, fallback to network
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error('[SW] Failed to fetch from network:', error)
    throw error
  }
}

// Stale while revalidate - return cache immediately, update in background
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)

  // Start network request (don't await)
  const networkRequest = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(error => {
      console.log('[SW] Background fetch failed:', error)
    })

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse
  }

  // If no cache, wait for network
  try {
    return await networkRequest
  } catch (error) {
    throw error
  }
}

// Fallback strategy for when everything fails
async function fallbackStrategy(request) {
  const url = new URL(request.url)

  // For HTML pages, return offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    const offlineResponse = await caches.match('/offline')
    if (offlineResponse) {
      return offlineResponse
    }

    // Create basic offline response
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>E2W PM - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: system-ui, sans-serif;
              text-align: center;
              padding: 50px;
              background: #f5f5f5;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              padding: 30px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #333; margin-bottom: 20px; }
            p { color: #666; line-height: 1.5; }
            .logo { width: 64px; height: 64px; margin: 0 auto 20px; }
            .retry {
              margin-top: 20px;
              padding: 10px 20px;
              background: #000;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo" style="background: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">E2W</div>
            <h1>You're Offline</h1>
            <p>It looks like you've lost your internet connection. Don't worry - your data is stored locally and will sync when you're back online.</p>
            <button class="retry" onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  }

  // For other requests, return network error
  return new Response('Network error', {
    status: 408,
    statusText: 'Network Error'
  })
}

// Background sync for when user comes back online
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Send any pending data to server when back online
    const pendingData = await getStoredPendingData()

    if (pendingData.length > 0) {
      console.log('[SW] Syncing pending data:', pendingData.length, 'items')

      for (const item of pendingData) {
        try {
          await syncDataItem(item)
          await removePendingDataItem(item.id)
        } catch (error) {
          console.error('[SW] Failed to sync item:', item.id, error)
        }
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

async function getStoredPendingData() {
  // This would integrate with your IndexedDB storage
  return []
}

async function syncDataItem(item) {
  // Sync individual items to server
  // This would be implemented based on your API
}

async function removePendingDataItem(id) {
  // Remove synced item from pending queue
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received')

  const options = {
    body: event.data ? event.data.text() : 'New notification from E2W PM',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/checkmark-24x24.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-24x24.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('E2W Project Management', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received.')

  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

console.log('[SW] Service worker script loaded')