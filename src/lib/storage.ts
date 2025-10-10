import { User, Project, Task, Comment, ProjectStats, Automation, ActivityLog } from '@/types'

// Storage keys
const STORAGE_KEYS = {
  USERS: 'e2w_users',
  PROJECTS: 'e2w_projects',
  TASKS: 'e2w_tasks',
  COMMENTS: 'e2w_comments',
  PROJECT_STATS: 'e2w_project_stats',
  AUTOMATIONS: 'e2w_automations',
  ACTIVITY_LOG: 'e2w_activity_log',
  CURRENT_USER: 'e2w_current_user',
  APP_DATA: 'e2w_app_data',
} as const

// Utility functions for localStorage
class Storage {
  static get<T>(key: string): T[] {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`Error reading from localStorage key ${key}:`, error)
      return []
    }
  }

  static set<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`Error writing to localStorage key ${key}:`, error)
    }
  }

  static getItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error(`Error reading item from localStorage key ${key}:`, error)
      return null
    }
  }

  static setItem<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`Error writing item to localStorage key ${key}:`, error)
    }
  }

  static remove(key: string): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing from localStorage key ${key}:`, error)
    }
  }

  static clear(): void {
    if (typeof window === 'undefined') return
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }
}

// Generate unique IDs
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// User management
export class UserStore {
  static getAll(): User[] {
    return Storage.get<User>(STORAGE_KEYS.USERS)
  }

  static getById(id: string): User | null {
    const users = this.getAll()
    return users.find(user => user._id === id) || null
  }

  static getByEmail(email: string): User | null {
    const users = this.getAll()
    return users.find(user => user.email === email) || null
  }

  static create(userData: Omit<User, '_id' | 'created' | 'projectRoles'>): User {
    const users = this.getAll()
    const newUser: User = {
      _id: generateId(),
      ...userData,
      created: new Date(),
      projectRoles: [],
    }

    users.push(newUser)
    Storage.set(STORAGE_KEYS.USERS, users)
    return newUser
  }

  static update(id: string, updates: Partial<User>): User | null {
    const users = this.getAll()
    const index = users.findIndex(user => user._id === id)

    if (index === -1) return null

    users[index] = { ...users[index], ...updates }
    Storage.set(STORAGE_KEYS.USERS, users)
    return users[index]
  }

  static delete(id: string): boolean {
    const users = this.getAll()
    const filtered = users.filter(user => user._id !== id)

    if (filtered.length === users.length) return false

    Storage.set(STORAGE_KEYS.USERS, filtered)
    return true
  }

  static getCurrentUser(): User | null {
    return Storage.getItem<User>(STORAGE_KEYS.CURRENT_USER)
  }

  static setCurrentUser(user: User | null): void {
    if (user) {
      Storage.setItem(STORAGE_KEYS.CURRENT_USER, user)
    } else {
      Storage.remove(STORAGE_KEYS.CURRENT_USER)
    }
  }
}

// Project management
export class ProjectStore {
  static getAll(): Project[] {
    return Storage.get<Project>(STORAGE_KEYS.PROJECTS)
  }

  static getById(id: string): Project | null {
    const projects = this.getAll()
    return projects.find(project => project._id === id) || null
  }

  static getByUser(userId: string): Project[] {
    const projects = this.getAll()
    return projects.filter(project =>
      project.owner === userId || project.members.includes(userId)
    )
  }

  static create(projectData: Omit<Project, '_id' | 'created' | 'updated'>): Project {
    const projects = this.getAll()
    const newProject: Project = {
      _id: generateId(),
      ...projectData,
      created: new Date(),
      updated: new Date(),
    }

    projects.push(newProject)
    Storage.set(STORAGE_KEYS.PROJECTS, projects)

    // Create initial project stats
    ProjectStatsStore.create(newProject._id)

    return newProject
  }

  static update(id: string, updates: Partial<Project>): Project | null {
    const projects = this.getAll()
    const index = projects.findIndex(project => project._id === id)

    if (index === -1) return null

    projects[index] = {
      ...projects[index],
      ...updates,
      updated: new Date()
    }
    Storage.set(STORAGE_KEYS.PROJECTS, projects)
    return projects[index]
  }

  static delete(id: string): boolean {
    const projects = this.getAll()
    const filtered = projects.filter(project => project._id !== id)

    if (filtered.length === projects.length) return false

    Storage.set(STORAGE_KEYS.PROJECTS, filtered)

    // Clean up related data
    TaskStore.deleteByProject(id)
    ProjectStatsStore.delete(id)

    return true
  }
}

// Task management
export class TaskStore {
  static getAll(): Task[] {
    return Storage.get<Task>(STORAGE_KEYS.TASKS)
  }

  static getById(id: string): Task | null {
    const tasks = this.getAll()
    return tasks.find(task => task._id === id && !task.deleted) || null
  }

  static getByProject(projectId: string): Task[] {
    const tasks = this.getAll()
    return tasks.filter(task => task.project === projectId && !task.deleted)
  }

  static getByUser(userId: string): Task[] {
    const tasks = this.getAll()
    return tasks.filter(task =>
      (task.assignees.includes(userId) || task.creator === userId || task.watchers.includes(userId))
      && !task.deleted
    )
  }

  static create(taskData: Omit<Task, '_id' | 'dates' | 'commentCount'> & { dates?: Partial<Task['dates']> }): Task {
    const tasks = this.getAll()
    const newTask: Task = {
      _id: generateId(),
      ...taskData,
      dates: {
        created: new Date(),
        updated: new Date(),
        due: taskData.dates?.due,
        start: taskData.dates?.start,
        completed: taskData.dates?.completed,
      },
      commentCount: 0,
    }

    tasks.push(newTask)
    Storage.set(STORAGE_KEYS.TASKS, tasks)

    // Update project stats
    ProjectStatsStore.updateStats(newTask.project)

    // Log activity
    ActivityLogStore.log(newTask.creator, 'task_created', 'task', newTask._id, {
      taskTitle: newTask.title,
      projectId: newTask.project
    })

    return newTask
  }

  static update(id: string, updates: Partial<Task>): Task | null {
    const tasks = this.getAll()
    const index = tasks.findIndex(task => task._id === id)

    if (index === -1) return null

    const oldTask = tasks[index]
    tasks[index] = {
      ...oldTask,
      ...updates,
      dates: {
        ...oldTask.dates,
        ...updates.dates,
        updated: new Date(),
        completed: updates.status === 'DONE' ? new Date() : oldTask.dates.completed
      }
    }

    Storage.set(STORAGE_KEYS.TASKS, tasks)

    // Update project stats
    ProjectStatsStore.updateStats(tasks[index].project)

    return tasks[index]
  }

  static delete(id: string): boolean {
    const tasks = this.getAll()
    const index = tasks.findIndex(task => task._id === id)

    if (index === -1) return false

    // Soft delete
    tasks[index] = {
      ...tasks[index],
      deleted: true,
      deletedAt: new Date()
    }

    Storage.set(STORAGE_KEYS.TASKS, tasks)

    // Update project stats
    ProjectStatsStore.updateStats(tasks[index].project)

    return true
  }

  static deleteByProject(projectId: string): void {
    const tasks = this.getAll()
    const updatedTasks = tasks.map(task =>
      task.project === projectId
        ? { ...task, deleted: true, deletedAt: new Date() }
        : task
    )
    Storage.set(STORAGE_KEYS.TASKS, updatedTasks)
  }

  static search(query: string, projectId?: string): Task[] {
    const tasks = this.getAll()
    const searchTerms = query.toLowerCase().split(' ')

    return tasks.filter(task => {
      if (task.deleted) return false
      if (projectId && task.project !== projectId) return false

      const searchText = `${task.title} ${task.description} ${task.tags.join(' ')}`.toLowerCase()
      return searchTerms.every(term => searchText.includes(term))
    })
  }
}

// Comment management
export class CommentStore {
  static getAll(): Comment[] {
    return Storage.get<Comment>(STORAGE_KEYS.COMMENTS)
  }

  static getByTask(taskId: string): Comment[] {
    const comments = this.getAll()
    return comments.filter(comment => comment.task === taskId && !comment.deleted)
      .sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
  }

  static create(commentData: Omit<Comment, '_id' | 'created' | 'updated' | 'edited' | 'reactions'>): Comment {
    const comments = this.getAll()
    const newComment: Comment = {
      _id: generateId(),
      ...commentData,
      created: new Date(),
      updated: new Date(),
      edited: false,
      reactions: {},
    }

    comments.push(newComment)
    Storage.set(STORAGE_KEYS.COMMENTS, comments)

    // Update task comment count
    const task = TaskStore.getById(newComment.task)
    if (task) {
      TaskStore.update(task._id, { commentCount: task.commentCount + 1 })
    }

    return newComment
  }

  static update(id: string, updates: Partial<Comment>): Comment | null {
    const comments = this.getAll()
    const index = comments.findIndex(comment => comment._id === id)

    if (index === -1) return null

    comments[index] = {
      ...comments[index],
      ...updates,
      updated: new Date(),
      edited: true
    }
    Storage.set(STORAGE_KEYS.COMMENTS, comments)
    return comments[index]
  }

  static delete(id: string): boolean {
    const comments = this.getAll()
    const index = comments.findIndex(comment => comment._id === id)

    if (index === -1) return false

    const comment = comments[index]
    comments[index] = { ...comment, deleted: true }
    Storage.set(STORAGE_KEYS.COMMENTS, comments)

    // Update task comment count
    const task = TaskStore.getById(comment.task)
    if (task) {
      TaskStore.update(task._id, { commentCount: Math.max(0, task.commentCount - 1) })
    }

    return true
  }
}

// Project statistics
export class ProjectStatsStore {
  static getAll(): ProjectStats[] {
    return Storage.get<ProjectStats>(STORAGE_KEYS.PROJECT_STATS)
  }

  static getByProject(projectId: string): ProjectStats | null {
    const stats = this.getAll()
    return stats.find(stat => stat.project === projectId) || null
  }

  static create(projectId: string): ProjectStats {
    const stats = this.getAll()
    const newStats: ProjectStats = {
      project: projectId,
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      tasksByStatus: {
        TODO: 0,
        IN_PROGRESS: 0,
        DONE: 0,
        BLOCKED: 0,
      },
      tasksByPriority: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        URGENT: 0,
      },
      avgCompletionTime: 0,
      velocityLastWeek: 0,
      lastUpdated: new Date(),
    }

    stats.push(newStats)
    Storage.set(STORAGE_KEYS.PROJECT_STATS, stats)
    return newStats
  }

  static updateStats(projectId: string): void {
    const tasks = TaskStore.getByProject(projectId)
    const stats = this.getAll()
    const index = stats.findIndex(stat => stat.project === projectId)

    if (index === -1) {
      this.create(projectId)
      return
    }

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Calculate statistics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'DONE').length
    const overdueTasks = tasks.filter(task =>
      task.dates.due &&
      new Date(task.dates.due) < now &&
      task.status !== 'DONE'
    ).length

    const tasksByStatus = tasks.reduce((acc, task) => {
      acc[task.status]++
      return acc
    }, { TODO: 0, IN_PROGRESS: 0, DONE: 0, BLOCKED: 0 })

    const tasksByPriority = tasks.reduce((acc, task) => {
      acc[task.priority]++
      return acc
    }, { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 })

    const velocityLastWeek = tasks.filter(task =>
      task.status === 'DONE' &&
      task.dates.completed &&
      new Date(task.dates.completed) >= weekAgo
    ).length

    // Calculate average completion time
    const completedTasksWithTime = tasks.filter(task =>
      task.status === 'DONE' &&
      task.dates.completed &&
      task.dates.created
    )

    const avgCompletionTime = completedTasksWithTime.length > 0
      ? completedTasksWithTime.reduce((sum, task) => {
          const completedTime = new Date(task.dates.completed!).getTime()
          const createdTime = new Date(task.dates.created).getTime()
          return sum + (completedTime - createdTime) / (1000 * 60 * 60 * 24) // days
        }, 0) / completedTasksWithTime.length
      : 0

    stats[index] = {
      ...stats[index],
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksByStatus,
      tasksByPriority,
      avgCompletionTime,
      velocityLastWeek,
      lastUpdated: new Date(),
    }

    Storage.set(STORAGE_KEYS.PROJECT_STATS, stats)
  }

  static delete(projectId: string): boolean {
    const stats = this.getAll()
    const filtered = stats.filter(stat => stat.project !== projectId)

    if (filtered.length === stats.length) return false

    Storage.set(STORAGE_KEYS.PROJECT_STATS, filtered)
    return true
  }
}

// Activity log
export class ActivityLogStore {
  static getAll(): ActivityLog[] {
    return Storage.get<ActivityLog>(STORAGE_KEYS.ACTIVITY_LOG)
  }

  static getByUser(userId: string, limit = 50): ActivityLog[] {
    const logs = this.getAll()
    return logs
      .filter(log => log.user === userId)
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      .slice(0, limit)
  }

  static getByProject(projectId: string, limit = 50): ActivityLog[] {
    const logs = this.getAll()
    return logs
      .filter(log => log.details?.projectId === projectId)
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      .slice(0, limit)
  }

  static log(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    details?: Record<string, unknown>
  ): ActivityLog {
    const logs = this.getAll()
    const newLog: ActivityLog = {
      _id: generateId(),
      user: userId,
      action,
      resource,
      resourceId,
      details,
      created: new Date(),
    }

    logs.push(newLog)

    // Keep only last 1000 logs to prevent storage bloat
    const trimmedLogs = logs.slice(-1000)
    Storage.set(STORAGE_KEYS.ACTIVITY_LOG, trimmedLogs)

    return newLog
  }
}

// Initialize app with demo data
export function initializeApp(): void {
  const currentUser = UserStore.getCurrentUser()
  if (currentUser) return // Already initialized

  // Create demo user
  const demoUser = UserStore.create({
    email: 'demo@e2w.global',
    name: 'John Doe',
    avatar: '/E2W Black Logo.png',
  })

  UserStore.setCurrentUser(demoUser)

  // Create demo projects
  const project1 = ProjectStore.create({
    name: 'Website Redesign',
    description: 'Complete redesign of the company website with modern UI/UX',
    owner: demoUser._id,
    members: [demoUser._id],
  })

  const project2 = ProjectStore.create({
    name: 'Mobile App Development',
    description: 'Native mobile app for iOS and Android platforms',
    owner: demoUser._id,
    members: [demoUser._id],
  })

  const project3 = ProjectStore.create({
    name: 'Marketing Campaign',
    description: 'Q4 marketing campaign for product launch',
    owner: demoUser._id,
    members: [demoUser._id],
  })

  // Create demo tasks
  const tasks = [
    {
      title: 'Design new landing page',
      description: 'Create wireframes and mockups for the new landing page',
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      project: project1._id,
      assignees: [demoUser._id],
      creator: demoUser._id,
      watchers: [demoUser._id],
      tags: ['design', 'ui'],
      dates: { due: new Date(Date.now() + 24 * 60 * 60 * 1000) }, // Tomorrow
      dependencies: [],
      attachments: [],
      customFields: {},
      timeEstimate: undefined,
      timeTracked: 0,
      recurring: undefined,
      deleted: false,
    },
    {
      title: 'Implement user authentication',
      description: 'Set up secure user authentication system',
      status: 'TODO' as const,
      priority: 'URGENT' as const,
      project: project2._id,
      assignees: [demoUser._id],
      creator: demoUser._id,
      watchers: [demoUser._id],
      tags: ['backend', 'security'],
      dates: { due: new Date() }, // Today
      dependencies: [],
      attachments: [],
      customFields: {},
      timeEstimate: undefined,
      timeTracked: 0,
      recurring: undefined,
      deleted: false,
    },
    {
      title: 'Create marketing materials',
      description: 'Design brochures, flyers, and digital assets',
      status: 'DONE' as const,
      priority: 'MEDIUM' as const,
      project: project3._id,
      assignees: [demoUser._id],
      creator: demoUser._id,
      watchers: [demoUser._id],
      tags: ['marketing', 'design'],
      dates: {
        due: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        completed: new Date()
      },
      dependencies: [],
      attachments: [],
      customFields: {},
      timeEstimate: undefined,
      timeTracked: 0,
      recurring: undefined,
      deleted: false,
    },
  ]

  tasks.forEach(taskData => TaskStore.create(taskData))
}