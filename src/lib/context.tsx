'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Project, Task } from '@/types'
import { ProjectApi, TaskApi, UserSession } from './api'
import { useSession } from 'next-auth/react'

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean

  // Data
  projects: Project[]
  tasks: Task[]
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
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Helper function to refresh data for a user
  const refreshDataForUser = useCallback(async (userId: string) => {
    try {
      const [userProjects, userTasks] = await Promise.all([
        ProjectApi.getAll(userId),
        TaskApi.getByUser(userId),
      ])

      setProjects(userProjects)
      setTasks(userTasks)

      // Set current project to first project if exists
      if (userProjects.length > 0 && !currentProject) {
        setCurrentProject(userProjects[0])
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }, [currentProject])

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
        setProjects([])
        setTasks([])
        setCurrentProject(null)
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [session, status, refreshDataForUser])

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

    // Data
    projects,
    tasks,
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

// Hook for projects
export function useProjects() {
  const { projects, currentProject, setCurrentProject, refreshData } = useApp()
  return { projects, currentProject, setCurrentProject, refreshData }
}

// Hook for tasks
export function useTasks(projectId?: string) {
  const { tasks, refreshData } = useApp()

  const filteredTasks = projectId
    ? tasks.filter(task => task.project === projectId)
    : tasks

  return { tasks: filteredTasks, allTasks: tasks, refreshData }
}