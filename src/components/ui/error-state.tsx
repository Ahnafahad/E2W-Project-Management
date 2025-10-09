import { ReactNode } from 'react'
import {
  AlertTriangle,
  WifiOff,
  ServerCrash,
  ShieldAlert,
  FileX,
  XCircle,
  RefreshCw,
  Home
} from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  error?: Error | string
  showDetails?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  children?: ReactNode
}

export function ErrorState({
  icon: Icon = AlertTriangle,
  title,
  description,
  error,
  showDetails = false,
  action,
  secondaryAction,
  className,
  children,
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="mb-4 text-red-500">
        <Icon className="w-16 h-16 mx-auto" strokeWidth={1.5} />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-gray-600 max-w-md mb-4">
          {description}
        </p>
      )}

      {showDetails && errorMessage && (
        <div className="w-full max-w-md mb-6">
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
              Show error details
            </summary>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm font-mono text-red-800 overflow-auto max-h-40">
              {errorMessage}
            </div>
          </details>
        </div>
      )}

      {children}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Preset error states for common scenarios

export function NetworkErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      icon={WifiOff}
      title="Connection Error"
      description="Unable to connect to the server. Please check your internet connection and try again."
      action={{
        label: 'Retry',
        onClick: onRetry,
      }}
    />
  )
}

export function ServerErrorState({ onRetry, onHome }: { onRetry: () => void; onHome: () => void }) {
  return (
    <ErrorState
      icon={ServerCrash}
      title="Server Error"
      description="Something went wrong on our end. We're working to fix it. Please try again later."
      action={{
        label: 'Try Again',
        onClick: onRetry,
      }}
      secondaryAction={{
        label: 'Go Home',
        onClick: onHome,
      }}
    />
  )
}

export function NotFoundErrorState({ onHome }: { onHome: () => void }) {
  return (
    <ErrorState
      icon={FileX}
      title="Page Not Found"
      description="The page you're looking for doesn't exist or has been moved."
      action={{
        label: 'Go to Dashboard',
        onClick: onHome,
      }}
    />
  )
}

export function UnauthorizedErrorState({ onLogin }: { onLogin: () => void }) {
  return (
    <ErrorState
      icon={ShieldAlert}
      title="Unauthorized"
      description="You don't have permission to access this resource. Please log in or contact your administrator."
      action={{
        label: 'Log In',
        onClick: onLogin,
      }}
    />
  )
}

export function LoadingErrorState({ error, onRetry }: { error?: Error | string; onRetry: () => void }) {
  return (
    <ErrorState
      icon={XCircle}
      title="Failed to Load"
      description="We couldn't load the content you requested."
      error={error}
      showDetails={process.env.NODE_ENV === 'development'}
      action={{
        label: 'Retry',
        onClick: onRetry,
      }}
    />
  )
}

export function DataSaveErrorState({ error, onRetry }: { error?: Error | string; onRetry: () => void }) {
  return (
    <ErrorState
      icon={AlertTriangle}
      title="Failed to Save"
      description="Your changes couldn't be saved. Please check your connection and try again."
      error={error}
      showDetails={process.env.NODE_ENV === 'development'}
      action={{
        label: 'Retry',
        onClick: onRetry,
      }}
    />
  )
}

export function DataDeleteErrorState({ error, onRetry }: { error?: Error | string; onRetry: () => void }) {
  return (
    <ErrorState
      icon={AlertTriangle}
      title="Failed to Delete"
      description="The item couldn't be deleted. Please try again."
      error={error}
      showDetails={process.env.NODE_ENV === 'development'}
      action={{
        label: 'Retry',
        onClick: onRetry,
      }}
    />
  )
}

// Inline error component for forms and smaller areas
interface InlineErrorProps {
  error: string | Error
  className?: string
}

export function InlineError({ error, className }: InlineErrorProps) {
  const errorMessage = error instanceof Error ? error.message : error

  return (
    <div className={cn('flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg', className)}>
      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-800">{errorMessage}</p>
      </div>
    </div>
  )
}

// Banner error component for page-level errors
interface ErrorBannerProps {
  error: string | Error
  onDismiss?: () => void
  onRetry?: () => void
  className?: string
}

export function ErrorBanner({ error, onDismiss, onRetry, className }: ErrorBannerProps) {
  const errorMessage = error instanceof Error ? error.message : error

  return (
    <div className={cn('flex items-center justify-between gap-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg', className)}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-red-900 text-sm">Error</p>
          <p className="text-sm text-red-800 mt-0.5">{errorMessage}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
            aria-label="Retry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
