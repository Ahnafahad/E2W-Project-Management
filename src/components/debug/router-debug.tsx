'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useModeContext } from '@/lib/mode-context'

/**
 * Temporary debug component — logs global errors, unhandled rejections,
 * and monitors route changes to diagnose OCF-mode router freeze.
 * REMOVE after debugging is complete.
 */
export function RouterDebug() {
  const pathname = usePathname()
  const { currentMode } = useModeContext()

  // Log every render of this component (tracks re-renders from mode/route changes)
  console.log(`[RouterDebug] render: mode=${currentMode} pathname=${pathname}`)

  // Log pathname changes
  useEffect(() => {
    console.log(`[RouterDebug] pathname changed → ${pathname}`)
  }, [pathname])

  // Log mode changes
  useEffect(() => {
    console.log(`[RouterDebug] mode changed → ${currentMode}`)
  }, [currentMode])

  // Catch ALL uncaught errors and unhandled promise rejections
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      console.error(`[RouterDebug] UNCAUGHT ERROR:`, event.error)
      console.error(`[RouterDebug] Message: ${event.message}`)
      console.error(`[RouterDebug] Source: ${event.filename}:${event.lineno}:${event.colno}`)
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error(`[RouterDebug] UNHANDLED PROMISE REJECTION:`, event.reason)
    }

    // Monitor render count per second to detect infinite re-render loops
    let renderCount = 0
    const renderInterval = setInterval(() => {
      if (renderCount > 50) {
        console.error(`[RouterDebug] POSSIBLE INFINITE LOOP: ${renderCount} renders in last second`)
      }
      renderCount = 0
    }, 1000)

    // Patch console.error to catch React internal errors
    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
      const msg = args[0]?.toString?.() || ''
      if (
        msg.includes('Maximum update depth') ||
        msg.includes('Too many re-renders') ||
        msg.includes('Cannot update a component') ||
        msg.includes('Hydration') ||
        msg.includes('startTransition')
      ) {
        originalConsoleError('[RouterDebug] REACT ERROR DETECTED:', ...args)
      }
      originalConsoleError(...args)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
      clearInterval(renderInterval)
      console.error = originalConsoleError
    }
  }, [])

  // Track render count
  useEffect(() => {
    // This is a ref-like pattern: we store render count on window for the interval above
    ;(window as any).__routerDebugRenderCount = ((window as any).__routerDebugRenderCount || 0) + 1
  })

  return null // renders nothing
}
