'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Project, Task } from '@/types'
import { ProjectApi, TaskApi, UserSession } from './api'
import { useSession } from 'next-auth/react'
import { useModeContext } from './mode-context'

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean

  // Raw unfiltered data — mode filtering happens in hooks
  allProjects: Project[]
  allTasks: Task[]
  currentProject: Project | null

  // Actions
  refreshData: () => Promise<void>
  setCurrentProject: (project: Project | null) => void

  // Loading states
  isLoading: boolean
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user data from session
  useEffect(() => {
    const loadUserData = async () => {
      if (status === 'loading') {
        return
      }

      if (status === 'authenticated' && session?.user) {
        try {
          // Fetch full user data from API
          const userData = await fetch(`/api/users?email=${session.user.email}`).then(r => r.json())
          if (userData.success && userData.data.length > 0) {
            const fullUser = userData.data[0]
            setUser(fullUser)
            UserSession.setCurrentUser(fullUser)

            // Load user's projects and tasks
            await refreshDataForUser(fullUser._id)
          }
        } catch (error) {
          console.error('Failed to load user data:', error)
        } finally {
          setIsLoading(false)
        }
      } else {
        // Not authenticated
        setUser(null)
        setAllProjects([])
        setAllTasks([])
        setCurrentProject(null)
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [session, status])

  // Helper function to refresh data for a user
  const refreshDataForUser = async (userId: string) => {
    try {
      const [userProjects, userTasks] = await Promise.all([
        ProjectApi.getAll(), // Fetch all projects so all users can see all projects
        TaskApi.getAll(), // Fetch all tasks so all users can see all tasks
      ])

      setAllProjects(userProjects)
      setAllTasks(userTasks)

      // Set current project to first project if exists
      if (userProjects.length > 0 && !currentProject) {
        setCurrentProject(userProjects[0])
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }

  const refreshData = async () => {
    if (user) {
      await refreshDataForUser(user._id)
    }
  }

  const handleSetCurrentProject = (project: Project | null) => {
    setCurrentProject(project)
  }

  const value: AppState = {
    // Auth
    user,
    isAuthenticated: !!user,

    // Data (unfiltered — hooks apply mode filtering)
    allProjects,
    allTasks,
    currentProject,

    // Actions
    refreshData,
    setCurrentProject: handleSetCurrentProject,

    // Loading
    isLoading,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// Hook for authentication
export function useAuth() {
  const { user, isAuthenticated } = useApp()
  return { user, isAuthenticated }
}

// Hook for projects — filters by mode
export function useProjects() {
  const { allProjects, currentProject, setCurrentProject, refreshData } = useApp()
  const { currentMode } = useModeContext()

  const projects = currentMode === 'ocf'
    ? allProjects.filter(p => p.isOCF)
    : allProjects

  console.log(`[useProjects] mode=${currentMode} total=${allProjects.length} filtered=${projects.length}`)

  return { projects, currentProject, setCurrentProject, refreshData }
}

// Hook for tasks — filters by mode
export function useTasks(projectId?: string) {
  const { allProjects, allTasks, refreshData } = useApp()
  const { currentMode } = useModeContext()

  const ocfProjectIds = new Set(allProjects.filter(p => p.isOCF).map(p => p._id))

  const modeTasks = currentMode === 'ocf'
    ? allTasks.filter(t => ocfProjectIds.has(t.project))
    : allTasks

  const filteredTasks = projectId
    ? modeTasks.filter(task => task.project === projectId)
    : modeTasks

  console.log(`[useTasks] mode=${currentMode} total=${allTasks.length} filtered=${modeTasks.length} ocfProjectIds=${[...ocfProjectIds].join(',')}`)

  return { tasks: filteredTasks, allTasks: modeTasks, refreshData }
}
