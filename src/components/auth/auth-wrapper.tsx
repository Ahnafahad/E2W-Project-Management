'use client'

import { useAuth } from '@/lib/context'
import { LoginForm } from './login-form'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return <>{children}</>
}