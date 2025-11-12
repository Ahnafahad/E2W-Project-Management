/**
 * SSE Broadcasting Utility
 * Manages SSE client connections and broadcasting
 */

// Store active connections internally
const clients = new Set<ReadableStreamDefaultController>()

/**
 * Add a client to the active connections
 */
export function addClient(controller: ReadableStreamDefaultController) {
  clients.add(controller)
}

/**
 * Remove a client from active connections
 */
export function removeClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller)
}

/**
 * Broadcast an event to all connected SSE clients
 */
export function broadcastEvent(event: { type: string; data: unknown }) {
  const encoder = new TextEncoder()
  const message = `data: ${JSON.stringify(event)}\n\n`
  const encoded = encoder.encode(message)

  clients.forEach((controller) => {
    try {
      controller.enqueue(encoded)
    } catch (_error) {
      clients.delete(controller)
    }
  })
}
