'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
}

interface NotificationContextType {
  notifications: Notification[]
  showNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2)}`
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000,
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove after duration
    setTimeout(() => {
      removeNotification(id)
    }, newNotification.duration)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

function NotificationContainer({
  notifications,
  onRemove,
}: {
  notifications: Notification[]
  onRemove: (id: string) => void
}) {
  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full pointer-events-none">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => onRemove(notification.id)}
        />
      ))}
    </div>
  )
}

function NotificationItem({
  notification,
  onRemove,
}: {
  notification: Notification
  onRemove: () => void
}) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  }

  const colors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  }

  return (
    <div
      className={`${colors[notification.type]} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in pointer-events-auto`}
    >
      <div className="flex-shrink-0">{icons[notification.type]}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900">{notification.title}</div>
        {notification.message && (
          <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
        )}
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
