'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, X, Wifi, WifiOff } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAProviderProps {
  children: React.ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineToast, setShowOfflineToast] = useState(false)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker()
    }

    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Don't show prompt immediately, wait for user interaction
      setTimeout(() => {
        if (!isAppInstalled()) {
          setShowInstallPrompt(true)
        }
      }, 30000) // Show after 30 seconds
    }

    // Handle app installed
    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineToast(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineToast(true)
      setTimeout(() => setShowOfflineToast(false), 5000)
    }

    // Set initial online status
    setIsOnline(navigator.onLine)

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      setSwRegistration(registration)
      console.log('Service Worker registered successfully:', registration)

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
            }
          })
        }
      })

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          setUpdateAvailable(true)
        }
      })

    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  const isAppInstalled = (): boolean => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://')
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      console.log(`User ${outcome} the install prompt`)
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('Error showing install prompt:', error)
    }
  }

  const handleUpdateClick = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  const shouldShowInstallPrompt = () => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      return daysSinceDismissed > 7 // Show again after 7 days
    }
    return true
  }

  return (
    <>
      {children}

      {/* Install Prompt */}
      {showInstallPrompt && deferredPrompt && shouldShowInstallPrompt() && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
          <Card className="border-brand-gold shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-gold rounded-full flex items-center justify-center">
                  <Download className="w-4 h-4 text-brand-charcoal" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">Install E2W PM</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Install our app for faster access and offline functionality
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={handleInstallClick} className="text-xs">
                      Install
                    </Button>
                    <Button size="sm" variant="ghost" onClick={dismissInstallPrompt} className="text-xs">
                      Not now
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 w-6"
                  onClick={dismissInstallPrompt}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Update Available Notification */}
      {updateAvailable && (
        <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
          <Card className="border-blue-500 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">Update Available</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    A new version of the app is available
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={handleUpdateClick} className="text-xs">
                      Update
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setUpdateAvailable(false)} className="text-xs">
                      Later
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 w-6"
                  onClick={() => setUpdateAvailable(false)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Offline Toast */}
      {showOfflineToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="border-orange-500 bg-orange-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-800">
                  You&apos;re offline. Changes will sync when reconnected.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Online Toast */}
      {isOnline && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 opacity-0 transition-opacity">
          <Card className="border-green-500 bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">Back online</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PWA Status Indicator (hidden, for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-2 right-2 z-50 text-xs bg-black text-white p-1 rounded opacity-50">
          PWA: {isAppInstalled() ? 'Installed' : 'Browser'} |
          SW: {swRegistration ? 'Active' : 'None'} |
          Online: {isOnline ? 'Yes' : 'No'}
        </div>
      )}
    </>
  )
}