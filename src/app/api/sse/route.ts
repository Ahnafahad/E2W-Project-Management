import { NextRequest } from 'next/server'

// Store active connections
const clients = new Set<ReadableStreamDefaultController>()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller)

      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`
      controller.enqueue(encoder.encode(data))

      // Keep-alive ping every 30 seconds
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch (_error) {
          clearInterval(keepAlive)
        }
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive)
        clients.delete(controller)
        try {
          controller.close()
        } catch (_error) {
          // Already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// Helper function to broadcast events to all connected clients
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
