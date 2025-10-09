'use client'

import { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

interface FormFieldProps {
  label?: string
  error?: string
  success?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function FormField({
  label,
  error,
  success,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {children}

      {/* Hint text */}
      {hint && !error && !success && (
        <div className="flex items-start gap-2 text-sm text-gray-500">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{hint}</span>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-start gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
}

export function Input({ error, success, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'input w-full',
        error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
        success && 'border-green-300 focus:border-green-500 focus:ring-green-500',
        className
      )}
      {...props}
    />
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  success?: boolean
}

export function Textarea({ error, success, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'input w-full min-h-[80px] resize-y',
        error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
        success && 'border-green-300 focus:border-green-500 focus:ring-green-500',
        className
      )}
      {...props}
    />
  )
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  success?: boolean
  children: ReactNode
}

export function Select({ error, success, className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'input w-full cursor-pointer',
        error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
        success && 'border-green-300 focus:border-green-500 focus:ring-green-500',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: boolean
}

export function Checkbox({ label, error, className, ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className={cn(
          'w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900',
          error && 'border-red-300',
          className
        )}
        {...props}
      />
      <span className={cn('text-sm', error ? 'text-red-600' : 'text-gray-700')}>
        {label}
      </span>
    </label>
  )
}

interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: boolean
}

export function Radio({ label, error, className, ...props }: RadioProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        className={cn(
          'w-4 h-4 border-gray-300 text-gray-900 focus:ring-gray-900',
          error && 'border-red-300',
          className
        )}
        {...props}
      />
      <span className={cn('text-sm', error ? 'text-red-600' : 'text-gray-700')}>
        {label}
      </span>
    </label>
  )
}

// Form validation helpers
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateRequired(value: string, fieldName: string): string | undefined {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`
  }
  return undefined
}

export function validateMinLength(value: string, min: number, fieldName: string): string | undefined {
  if (value.length < min) {
    return `${fieldName} must be at least ${min} characters`
  }
  return undefined
}

export function validateMaxLength(value: string, max: number, fieldName: string): string | undefined {
  if (value.length > max) {
    return `${fieldName} must be no more than ${max} characters`
  }
  return undefined
}
