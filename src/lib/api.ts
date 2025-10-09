import { User, Project, Task, Comment, ProjectStats, ActivityLog } from '@/types'

// API Response types
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// API client with error handling
class ApiClient {
  private static async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })

      const data: ApiResponse<T> = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'API request failed')
      }

      return data.data as T
    } catch (error: unknown) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  static async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  static async patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// User API
export class UserApi {
  static async getAll(): Promise<User[]> {
    return ApiClient.get<User[]>('/api/users')
  }

  static async getById(id: string): Promise<User | null> {
    try {
      return await ApiClient.get<User>(`/api/users/${id}`)
    } catch {
      return null
    }
  }

  static async getByEmail(email: string): Promise<User | null> {
    try {
      const users = await ApiClient.get<User[]>(`/api/users?email=${email}`)
      return users[0] || null
    } catch {
      return null
    }
  }

  static async create(userData: Omit<User, '_id' | 'created' | 'projectRoles'>): Promise<User> {
    return ApiClient.post<User>('/api/users', userData)
  }

  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      return await ApiClient.patch<User>(`/api/users/${id}`, updates)
    } catch {
      return null
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await ApiClient.delete(`/api/users/${id}`)
      return true
    } catch {
      return false
    }
  }
}

// Project API
export class ProjectApi {
  static async getAll(userId?: string): Promise<Project[]> {
    const endpoint = userId ? `/api/projects?userId=${userId}` : '/api/projects'
    return ApiClient.get<Project[]>(endpoint)
  }

  static async getById(id: string): Promise<Project | null> {
    try {
      return await ApiClient.get<Project>(`/api/projects/${id}`)
    } catch {
      return null
    }
  }

  static async create(projectData: Omit<Project, '_id' | 'created' | 'updated'>): Promise<Project> {
    return ApiClient.post<Project>('/api/projects', projectData)
  }

  static async update(id: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      return await ApiClient.patch<Project>(`/api/projects/${id}`, updates)
    } catch {
      return null
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await ApiClient.delete(`/api/projects/${id}`)
      return true
    } catch {
      return false
    }
  }

  static async getStats(projectId: string): Promise<ProjectStats | null> {
    try {
      return await ApiClient.get<ProjectStats>(`/api/projects/${projectId}/stats`)
    } catch {
      return null
    }
  }
}

// Task API
export class TaskApi {
  static async getAll(filters?: {
    projectId?: string
    userId?: string
    status?: string
    priority?: string
    search?: string
  }): Promise<Task[]> {
    const params = new URLSearchParams()
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.userId) params.append('userId', filters.userId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.search) params.append('search', filters.search)

    const endpoint = params.toString() ? `/api/tasks?${params}` : '/api/tasks'
    return ApiClient.get<Task[]>(endpoint)
  }

  static async getById(id: string): Promise<Task | null> {
    try {
      return await ApiClient.get<Task>(`/api/tasks/${id}`)
    } catch {
      return null
    }
  }

  static async getByProject(projectId: string): Promise<Task[]> {
    return this.getAll({ projectId })
  }

  static async getByUser(userId: string): Promise<Task[]> {
    return this.getAll({ userId })
  }

  static async create(taskData: Omit<Task, '_id' | 'dates' | 'commentCount'>): Promise<Task> {
    return ApiClient.post<Task>('/api/tasks', taskData)
  }

  static async update(id: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      return await ApiClient.patch<Task>(`/api/tasks/${id}`, updates)
    } catch {
      return null
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await ApiClient.delete(`/api/tasks/${id}`)
      return true
    } catch {
      return false
    }
  }

  static async search(query: string, projectId?: string): Promise<Task[]> {
    return this.getAll({ search: query, projectId })
  }
}

// Comment API
export class CommentApi {
  static async getByTask(taskId: string): Promise<Comment[]> {
    try {
      return await ApiClient.get<Comment[]>(`/api/tasks/${taskId}/comments`)
    } catch {
      return []
    }
  }

  static async create(
    taskId: string,
    commentData: Omit<Comment, '_id' | 'created' | 'updated' | 'edited' | 'reactions' | 'task'>
  ): Promise<Comment> {
    return ApiClient.post<Comment>(`/api/tasks/${taskId}/comments`, commentData)
  }

  static async update(id: string, updates: Partial<Comment>): Promise<Comment | null> {
    try {
      return await ApiClient.patch<Comment>(`/api/comments/${id}`, updates)
    } catch {
      return null
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await ApiClient.delete(`/api/comments/${id}`)
      return true
    } catch {
      return false
    }
  }
}

// TimeEntry API
export interface TimeEntry {
  _id: string
  task: string
  user: string
  startTime: Date
  endTime?: Date
  duration: number
  description: string
  created: Date
  updated: Date
}

export class TimeEntryApi {
  static async getByTask(taskId: string): Promise<TimeEntry[]> {
    try {
      return await ApiClient.get<TimeEntry[]>(`/api/tasks/${taskId}/time-entries`)
    } catch {
      return []
    }
  }

  static async create(taskId: string, entryData: {
    user: string
    startTime: Date
    endTime?: Date
    duration: number
    description: string
  }): Promise<TimeEntry> {
    return ApiClient.post<TimeEntry>(`/api/tasks/${taskId}/time-entries`, entryData)
  }

  static async update(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry | null> {
    try {
      return await ApiClient.patch<TimeEntry>(`/api/time-entries/${id}`, updates)
    } catch {
      return null
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await ApiClient.delete(`/api/time-entries/${id}`)
      return true
    } catch {
      return false
    }
  }
}

// Local storage helpers for current user (client-side only)
const CURRENT_USER_KEY = 'e2w_current_user'

export class UserSession {
  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  static setCurrentUser(user: User | null): void {
    if (typeof window === 'undefined') return
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(CURRENT_USER_KEY)
      }
    } catch (error) {
      console.error('Error setting current user:', error)
    }
  }

  static clearCurrentUser(): void {
    this.setCurrentUser(null)
  }
}
