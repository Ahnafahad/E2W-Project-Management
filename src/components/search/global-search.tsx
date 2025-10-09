'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Search,
  X,
  File,
  CheckSquare,
  Users,
  Calendar,
  Clock
} from 'lucide-react'
import { TaskStore, ProjectStore, UserStore } from '@/lib/storage'
import { Task, Project, User } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import { useProjects, useTasks } from '@/lib/context'

interface SearchResult {
  type: 'task' | 'project' | 'user'
  id: string
  title: string
  subtitle?: string
  data: Task | Project | User
  match: string[]
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { projects } = useProjects()
  const { allTasks } = useTasks()

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    const searchResults = performSearch(query)
    setResults(searchResults.slice(0, 10)) // Limit to 10 results
    setSelectedIndex(0)
    setIsLoading(false)
  }, [query, projects, allTasks])

  const performSearch = (searchQuery: string): SearchResult[] => {
    const searchTerms = searchQuery.toLowerCase().split(' ')
    const results: SearchResult[] = []

    // Search tasks
    allTasks.forEach(task => {
      if (task.deleted) return

      const searchableText = `${task.title} ${task.description || ''} ${task.tags.join(' ')}`.toLowerCase()
      const matches: string[] = []

      searchTerms.forEach(term => {
        if (searchableText.includes(term)) {
          if (task.title.toLowerCase().includes(term)) matches.push('title')
          if (task.description?.toLowerCase().includes(term)) matches.push('description')
          if (task.tags.some(tag => tag.toLowerCase().includes(term))) matches.push('tags')
        }
      })

      if (matches.length > 0) {
        const project = projects.find(p => p._id === task.project)
        results.push({
          type: 'task',
          id: task._id,
          title: task.title,
          subtitle: project ? `in ${project.name}` : '',
          data: task,
          match: matches
        })
      }
    })

    // Search projects
    projects.forEach(project => {
      const searchableText = `${project.name} ${project.description}`.toLowerCase()
      const matches: string[] = []

      searchTerms.forEach(term => {
        if (searchableText.includes(term)) {
          if (project.name.toLowerCase().includes(term)) matches.push('name')
          if (project.description && project.description.toLowerCase().includes(term)) matches.push('description')
        }
      })

      if (matches.length > 0) {
        results.push({
          type: 'project',
          id: project._id,
          title: project.name,
          subtitle: project.description ? project.description.substring(0, 100) + '...' : '',
          data: project,
          match: matches
        })
      }
    })

    // Search users
    const users = UserStore.getAll()
    users.forEach(user => {
      const searchableText = `${user.name} ${user.email}`.toLowerCase()
      const matches: string[] = []

      searchTerms.forEach(term => {
        if (searchableText.includes(term)) {
          if (user.name.toLowerCase().includes(term)) matches.push('name')
          if (user.email.toLowerCase().includes(term)) matches.push('email')
        }
      })

      if (matches.length > 0) {
        results.push({
          type: 'user',
          id: user._id,
          title: user.name,
          subtitle: user.email,
          data: user,
          match: matches
        })
      }
    })

    // Sort by relevance (more matches = higher priority)
    return results.sort((a, b) => b.match.length - a.match.length)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        selectResult(results[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const selectResult = (result: SearchResult) => {
    switch (result.type) {
      case 'task':
        router.push('/tasks')
        break
      case 'project':
        router.push(`/projects/${result.id}`)
        break
      case 'user':
        router.push('/team')
        break
    }
    onClose()
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-blue-500" />
      case 'project':
        return <File className="w-4 h-4 text-green-500" />
      case 'user':
        return <Users className="w-4 h-4 text-purple-500" />
      default:
        return <Search className="w-4 h-4 text-gray-500" />
    }
  }

  const getResultMetadata = (result: SearchResult) => {
    if (result.type === 'task') {
      const task = result.data as Task
      return (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="capitalize">{task.status.replace('_', ' ')}</span>
          <span>•</span>
          <span className="capitalize">{task.priority}</span>
          {task.dates.due && (
            <>
              <span>•</span>
              <Clock className="w-3 h-3" />
              <span>{formatRelativeTime(new Date(task.dates.due))}</span>
            </>
          )}
        </div>
      )
    } else if (result.type === 'project') {
      const project = result.data as Project
      const projectTasks = allTasks.filter(t => t.project === project._id && !t.deleted)
      return (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{projectTasks.length} tasks</span>
          <span>•</span>
          <span>{project.members.length} members</span>
        </div>
      )
    }
    return null
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardContent className="p-0">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search tasks, projects, and people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-lg bg-transparent border-none outline-none placeholder-gray-400"
            />
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => selectResult(result)}
                  >
                    <div className="flex items-start gap-3">
                      {getResultIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-sm text-gray-600 truncate">
                            {result.subtitle}
                          </div>
                        )}
                        {getResultMetadata(result)}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">
                        {result.type}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="p-8 text-center text-gray-500">
                No results found for &quot;{query}&quot;
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <div className="mb-4">
                  <Search className="w-12 h-12 mx-auto text-gray-300" />
                </div>
                <div className="text-lg font-medium mb-2">Search everything</div>
                <div className="text-sm">
                  Find tasks, projects, and people quickly
                </div>
                <div className="mt-4 text-xs text-gray-400">
                  Use ⌘K to open search anytime
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}