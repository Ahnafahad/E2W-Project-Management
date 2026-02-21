'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type AppMode = 'e2w' | 'ocf'

interface ModeState {
  currentMode: AppMode
  setMode: (mode: AppMode) => void
  canToggle: boolean
}

const ModeContext = createContext<ModeState | null>(null)

const MODE_STORAGE_KEY = 'e2w_current_mode'

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [currentMode, setCurrentMode] = useState<AppMode>('e2w')
  const [canToggle, setCanToggle] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    const resolveMode = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          // Fetch full user to get accessMode
          const res = await fetch(`/api/users?email=${encodeURIComponent(session.user.email)}`)
          const data = await res.json()
          if (data.success && data.data.length > 0) {
            const fullUser = data.data[0]
            if (fullUser.accessMode === 'ocf_only') {
              setCurrentMode('ocf')
              setCanToggle(false)
            } else {
              // Default 'both' — read from localStorage
              const stored = localStorage.getItem(MODE_STORAGE_KEY) as AppMode | null
              setCurrentMode(stored === 'ocf' ? 'ocf' : 'e2w')
              setCanToggle(true)
            }
          }
        } catch {
          // fallback to e2w
          setCurrentMode('e2w')
          setCanToggle(false)
        }
      } else if (status === 'unauthenticated') {
        setCurrentMode('e2w')
        setCanToggle(false)
      }
    }

    resolveMode()
  }, [session, status])

  const setMode = (mode: AppMode) => {
    if (!canToggle) return
    setCurrentMode(mode)
    localStorage.setItem(MODE_STORAGE_KEY, mode)
  }

  return (
    <ModeContext.Provider value={{ currentMode, setMode, canToggle }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useModeContext() {
  const context = useContext(ModeContext)
  if (!context) {
    throw new Error('useModeContext must be used within a ModeProvider')
  }
  return context
}
