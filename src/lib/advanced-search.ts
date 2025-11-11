/**
 * Advanced Search System
 * Provides powerful search capabilities across tasks, projects, and comments
 */

import type { Task, Project, Comment } from '@/types'

export interface SearchFilters {
  query?: string
  projectIds?: string[]
  assigneeIds?: string[]
  status?: string[]
  priority?: string[]
  tags?: string[]
  dateRange?: {
    start?: Date
    end?: Date
  }
  hasAttachments?: boolean
  hasComments?: boolean
}

export interface SearchResult<T> {
  item: T
  score: number
  matches: {
    field: string
    indices: [number, number][]
  }[]
}

/**
 * Advanced search implementation with relevance scoring
 */
export class AdvancedSearch {
  /**
   * Search tasks with filters and scoring
   */
  static searchTasks(
    tasks: Task[],
    filters: SearchFilters
  ): SearchResult<Task>[] {
    let results = tasks.map((task) => ({
      item: task,
      score: 0,
      matches: [] as SearchResult<Task>['matches'],
    }))

    // Apply query search with relevance scoring
    if (filters.query) {
      const query = filters.query.toLowerCase()
      results = results
        .map((result) => {
          const task = result.item
          let score = 0
          const matches: SearchResult<Task>['matches'] = []

          // Title match (highest weight)
          const titleMatch = task.title.toLowerCase()
          if (titleMatch.includes(query)) {
            score += 100
            if (titleMatch.startsWith(query)) score += 50
            matches.push({ field: 'title', indices: this.findIndices(titleMatch, query) })
          }

          // Description match
          if (task.description) {
            const descMatch = task.description.toLowerCase()
            if (descMatch.includes(query)) {
              score += 50
              matches.push({ field: 'description', indices: this.findIndices(descMatch, query) })
            }
          }

          // Tags match
          const matchedTags = task.tags.filter((tag) =>
            tag.toLowerCase().includes(query)
          )
          if (matchedTags.length > 0) {
            score += 30 * matchedTags.length
            matches.push({ field: 'tags', indices: [] })
          }

          return { ...result, score, matches }
        })
        .filter((r) => r.score > 0)
    }

    // Apply project filter
    if (filters.projectIds && filters.projectIds.length > 0) {
      results = results.filter((r) =>
        filters.projectIds!.includes(r.item.project)
      )
    }

    // Apply assignee filter
    if (filters.assigneeIds && filters.assigneeIds.length > 0) {
      results = results.filter((r) =>
        r.item.assignees.some((a) => filters.assigneeIds!.includes(a))
      )
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      results = results.filter((r) => filters.status!.includes(r.item.status))
    }

    // Apply priority filter
    if (filters.priority && filters.priority.length > 0) {
      results = results.filter((r) =>
        filters.priority!.includes(r.item.priority)
      )
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((r) =>
        r.item.tags.some((tag) => filters.tags!.includes(tag))
      )
    }

    // Apply date range filter
    if (filters.dateRange) {
      results = results.filter((r) => {
        const dueDate = r.item.dates.due
        if (!dueDate) return false

        const due = new Date(dueDate)
        if (filters.dateRange!.start && due < filters.dateRange!.start)
          return false
        if (filters.dateRange!.end && due > filters.dateRange!.end) return false

        return true
      })
    }

    // Apply attachments filter
    if (filters.hasAttachments !== undefined) {
      results = results.filter(
        (r) =>
          (r.item.attachments.length > 0) === filters.hasAttachments
      )
    }

    // Apply comments filter
    if (filters.hasComments !== undefined) {
      results = results.filter(
        (r) => (r.item.commentCount > 0) === filters.hasComments
      )
    }

    // Sort by score (descending)
    return results.sort((a, b) => b.score - a.score)
  }

  /**
   * Search projects
   */
  static searchProjects(
    projects: Project[],
    query: string
  ): SearchResult<Project>[] {
    if (!query) {
      return projects.map((p) => ({ item: p, score: 0, matches: [] }))
    }

    const lowerQuery = query.toLowerCase()

    return projects
      .map((project) => {
        let score = 0
        const matches: SearchResult<Project>['matches'] = []

        // Name match
        const nameMatch = project.name.toLowerCase()
        if (nameMatch.includes(lowerQuery)) {
          score += 100
          if (nameMatch.startsWith(lowerQuery)) score += 50
          matches.push({ field: 'name', indices: this.findIndices(nameMatch, lowerQuery) })
        }

        // Description match
        if (project.description) {
          const descMatch = project.description.toLowerCase()
          if (descMatch.includes(lowerQuery)) {
            score += 50
            matches.push({ field: 'description', indices: this.findIndices(descMatch, lowerQuery) })
          }
        }

        return { item: project, score, matches }
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
  }

  /**
   * Search comments
   */
  static searchComments(
    comments: Comment[],
    query: string
  ): SearchResult<Comment>[] {
    if (!query) {
      return comments.map((c) => ({ item: c, score: 0, matches: [] }))
    }

    const lowerQuery = query.toLowerCase()

    return comments
      .map((comment) => {
        let score = 0
        const matches: SearchResult<Comment>['matches'] = []

        const contentMatch = comment.content.toLowerCase()
        if (contentMatch.includes(lowerQuery)) {
          score += 100
          matches.push({ field: 'content', indices: this.findIndices(contentMatch, lowerQuery) })
        }

        return { item: comment, score, matches }
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
  }

  /**
   * Get search suggestions based on partial query
   */
  static getSuggestions(
    tasks: Task[],
    projects: Project[],
    partialQuery: string,
    limit = 5
  ): string[] {
    const query = partialQuery.toLowerCase()
    const suggestions = new Set<string>()

    // Collect from task titles
    tasks.forEach((task) => {
      if (task.title.toLowerCase().includes(query)) {
        suggestions.add(task.title)
      }
    })

    // Collect from project names
    projects.forEach((project) => {
      if (project.name.toLowerCase().includes(query)) {
        suggestions.add(project.name)
      }
    })

    // Collect from tags
    tasks.forEach((task) => {
      task.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(query)) {
          suggestions.add(tag)
        }
      })
    })

    return Array.from(suggestions).slice(0, limit)
  }

  /**
   * Find all indices of a substring in a string
   */
  private static findIndices(text: string, query: string): [number, number][] {
    const indices: [number, number][] = []
    let index = text.indexOf(query)

    while (index !== -1) {
      indices.push([index, index + query.length])
      index = text.indexOf(query, index + 1)
    }

    return indices
  }
}
