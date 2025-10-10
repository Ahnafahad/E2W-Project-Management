// IndexedDB-based offline queue for syncing data when connection is restored

const DB_NAME = 'e2w-pm-offline'
const DB_VERSION = 1
const QUEUE_STORE = 'sync-queue'

export interface QueuedOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  resource: 'task' | 'project' | 'comment' | 'timeEntry' | 'user'
  endpoint: string
  method: 'POST' | 'PATCH' | 'DELETE'
  data?: unknown
  timestamp: number
  retries: number
}

class OfflineQueueManager {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object store for queued operations
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('resource', 'resource', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  async addToQueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    const id = `${operation.resource}_${Date.now()}_${Math.random().toString(36).substring(2)}`
    const queueItem: QueuedOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      retries: 0,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE], 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.add(queueItem)

      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllQueued(): Promise<QueuedOperation[]> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE], 'readonly')
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async removeFromQueue(id: string): Promise<void> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE], 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async updateRetryCount(id: string): Promise<void> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE], 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (item) {
          item.retries += 1
          const putRequest = store.put(item)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async processQueue(): Promise<{ success: number; failed: number }> {
    const items = await this.getAllQueued()
    let success = 0
    let failed = 0

    for (const item of items) {
      try {
        // Make the API request
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: item.data ? JSON.stringify(item.data) : undefined,
        })

        if (response.ok) {
          // Successfully synced, remove from queue
          await this.removeFromQueue(item.id)
          success++
        } else {
          // Failed, update retry count
          if (item.retries < 3) {
            await this.updateRetryCount(item.id)
          } else {
            // Max retries reached, remove from queue
            await this.removeFromQueue(item.id)
          }
          failed++
        }
      } catch (error) {
        console.error('Failed to sync item:', item.id, error)
        if (item.retries < 3) {
          await this.updateRetryCount(item.id)
        } else {
          await this.removeFromQueue(item.id)
        }
        failed++
      }
    }

    return { success, failed }
  }

  async clearQueue(): Promise<void> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE], 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getQueueCount(): Promise<number> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE], 'readonly')
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineQueue = new OfflineQueueManager()

// Hook to trigger sync when connection is restored
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('Connection restored, processing offline queue...')
    try {
      const result = await offlineQueue.processQueue()
      console.log(`Synced ${result.success} items, ${result.failed} failed`)

      // Trigger a background sync if supported
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready
        await (registration as any).sync.register('background-sync')
      }
    } catch (error) {
      console.error('Error processing offline queue:', error)
    }
  })
}
