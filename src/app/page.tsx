'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context'
import { AuthWrapper } from '@/components/auth/auth-wrapper'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  return (
    <AuthWrapper>
      <div>Redirecting to dashboard...</div>
    </AuthWrapper>
  )
}
