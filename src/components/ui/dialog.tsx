'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-scale-in',
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}

interface DialogHeaderProps {
  children: ReactNode
  onClose?: () => void
  className?: string
}

export function DialogHeader({ children, onClose, className }: DialogHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between p-6 border-b border-gray-200', className)}>
      <div className="flex-1 pr-4">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      )}
    </div>
  )
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-xl font-semibold text-gray-900', className)}>
      {children}
    </h2>
  )
}

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-gray-600 mt-1', className)}>
      {children}
    </p>
  )
}

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('p-6 overflow-y-auto', className)}>
      {children}
    </div>
  )
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50', className)}>
      {children}
    </div>
  )
}

// Confirmation Dialog Variant
interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <DialogHeader onClose={onClose}>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <p className="text-gray-600">{description}</p>
      </DialogBody>
      <DialogFooter>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            variantStyles[variant]
          )}
        >
          {isLoading ? 'Loading...' : confirmText}
        </button>
      </DialogFooter>
    </Dialog>
  )
}
