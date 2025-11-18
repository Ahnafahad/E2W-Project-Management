'use client'

import { useState, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskDetail } from '@/components/tasks/task-detail'
import { BoardView } from '@/components/tasks/board-view'
import { CalendarView } from '@/components/tasks/calendar-view'
import { TimelineView } from '@/components/tasks/timeline-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Kanban,
  GanttChart
} from 'lucide-react'
import { Task, TaskStatus, TaskPriority } from '@/types'
import { TaskApi } from '@/lib/api'
import { useTasks, useProjects } from '@/lib/context'
import { PageErrorBoundary } from '@/components/error-boundary'

type ViewMode = 'list' | 'grid' | 'board' | 'calendar' | 'timeline'
type SortField = 'title' | 'created' | 'due' | 'priority' | 'status'
type SortDirection = 'asc' | 'desc'

function TasksContent() {
  const { allTasks, refreshData } = useTasks()
  const { projects } = useProjects()

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL')
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'ALL'>('ALL')
  const [filterProject, setFilterProject] = useState<string>('ALL')
  const [hideCompleted, setHideCompleted] = useState(true)
  const [sortField, setSortField] = useState<SortField>('created')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showFilters, setShowFilters] = useState(false)

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    const filtered = allTasks.filter(task => {
      // Hide completed filter
      if (hideCompleted && task.status === 'DONE') return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchableText = `${task.title} ${task.description} ${task.tags.join(' ')}`.toLowerCase()
        if (!searchableText.includes(query)) return false
      }

      // Status filter
      if (filterStatus !== 'ALL' && task.status !== filterStatus) return false

      // Priority filter
      if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false

      // Project filter
      if (filterProject !== 'ALL' && task.project !== filterProject) return false

      return true
    })

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'created':
          aValue = new Date(a.dates.created).getTime()
          bValue = new Date(b.dates.created).getTime()
          break
        case 'due':
          aValue = a.dates.due ? new Date(a.dates.due).getTime() : 0
          bValue = b.dates.due ? new Date(b.dates.due).getTime() : 0
          break
        case 'priority':
          const priorityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        case 'status':
          const statusOrder = { TODO: 1, IN_PROGRESS: 2, BLOCKED: 3, DONE: 4 }
          aValue = statusOrder[a.status]
          bValue = statusOrder[b.status]
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [allTasks, searchQuery, filterStatus, filterPriority, filterProject, hideCompleted, sortField, sortDirection])

  // Group tasks by status for board view
  const tasksByStatus = useMemo(() => {
    const groups = {
      TODO: [] as Task[],
      IN_PROGRESS: [] as Task[],
      DONE: [] as Task[],
      BLOCKED: [] as Task[],
    }

    filteredAndSortedTasks.forEach(task => {
      groups[task.status].push(task)
    })

    return groups
  }, [filteredAndSortedTasks])

  const handleTaskSave = (task: Task) => {
    setShowTaskForm(false)
    setEditingTask(null)
    refreshData()
  }

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleTaskDelete = async (taskId: string) => {
    await TaskApi.delete(taskId)
    refreshData()
  }

  const handleTaskView = (task: Task) => {
    setViewingTask(task)
  }

  const handleTaskUpdate = (task: Task) => {
    refreshData()
    setViewingTask(task) // Update the viewing task with latest data
  }

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await TaskApi.update(taskId, { status })
    refreshData()
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterStatus('ALL')
    setFilterPriority('ALL')
    setFilterProject('ALL')
    setHideCompleted(true)
  }

  const hasActiveFilters = searchQuery || filterStatus !== 'ALL' || filterPriority !== 'ALL' || filterProject !== 'ALL' || !hideCompleted

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">My Tasks</h1>
              <p className="text-gray-600 mt-1">
                {filteredAndSortedTasks.length} of {allTasks.length} tasks
              </p>
            </div>

            <Button onClick={() => setShowTaskForm(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>

          {/* View Mode Toggles - Mobile Optimized */}
          <div className="flex items-center justify-between">
            <div className="flex items-center border border-gray-200 rounded-lg p-1 overflow-x-auto">
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                className="h-8 px-2 lg:px-3 whitespace-nowrap"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:ml-2 sm:inline">List</span>
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                className="h-8 px-2 lg:px-3 whitespace-nowrap"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:ml-2 sm:inline">Grid</span>
              </Button>
              <Button
                variant={viewMode === 'board' ? 'primary' : 'ghost'}
                size="sm"
                className="h-8 px-2 lg:px-3 whitespace-nowrap"
                onClick={() => setViewMode('board')}
              >
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:ml-2 sm:inline">Board</span>
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
                size="sm"
                className="h-8 px-2 lg:px-3 whitespace-nowrap"
                onClick={() => setViewMode('calendar')}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:ml-2 sm:inline">Calendar</span>
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'primary' : 'ghost'}
                size="sm"
                className="h-8 px-2 lg:px-3 whitespace-nowrap"
                onClick={() => setViewMode('timeline')}
              >
                <GanttChart className="w-4 h-4" />
                <span className="hidden sm:ml-2 sm:inline">Timeline</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:w-auto"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 w-2 h-2 bg-accent rounded-full" />
                )}
              </Button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'ALL')}
                      className="w-full text-sm border border-gray-200 rounded-md px-2 py-1"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'ALL')}
                      className="w-full text-sm border border-gray-200 rounded-md px-2 py-1"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project
                    </label>
                    <select
                      value={filterProject}
                      onChange={(e) => setFilterProject(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-md px-2 py-1"
                    >
                      <option value="ALL">All Projects</option>
                      {projects.map(project => (
                        <option key={project._id} value={project._id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideCompleted}
                      onChange={(e) => setHideCompleted(e.target.checked)}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Hide completed tasks
                    </span>
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Sort by:</span>
          {(['title', 'created', 'due', 'priority', 'status'] as SortField[]).map(field => (
            <Button
              key={field}
              variant="ghost"
              size="sm"
              className={`h-8 ${sortField === field ? 'bg-gray-100' : ''}`}
              onClick={() => handleSort(field)}
            >
              {field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}
              {sortField === field && (
                sortDirection === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
              )}
            </Button>
          ))}
        </div>

        {/* Task List */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredAndSortedTasks.length > 0 ? (
              filteredAndSortedTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onEdit={handleTaskEdit}
                  onDelete={handleTaskDelete}
                  onStatusChange={handleStatusChange}
                  onView={handleTaskView}
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <List className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-gray-500 mb-4">
                    {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first task to get started'}
                  </p>
                  {!hasActiveFilters && (
                    <Button onClick={() => setShowTaskForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedTasks.length > 0 ? (
              filteredAndSortedTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onEdit={handleTaskEdit}
                  onDelete={handleTaskDelete}
                  onStatusChange={handleStatusChange}
                  onView={handleTaskView}
                  compact
                />
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-gray-400 mb-4">
                      <Grid3X3 className="w-12 h-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-500 mb-4">
                      {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first task to get started'}
                    </p>
                    {!hasActiveFilters && (
                      <Button onClick={() => setShowTaskForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Task
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Board View */}
        {viewMode === 'board' && (
          <BoardView
            tasks={filteredAndSortedTasks}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            onStatusChange={handleStatusChange}
            onTaskView={handleTaskView}
            onNewTask={() => setShowTaskForm(true)}
          />
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <CalendarView
            tasks={filteredAndSortedTasks}
            onTaskView={handleTaskView}
            onTaskEdit={handleTaskEdit}
          />
        )}

        {/* Timeline View */}
        {viewMode === 'timeline' && (
          <TimelineView
            tasks={filteredAndSortedTasks}
            onTaskView={handleTaskView}
          />
        )}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onSave={handleTaskSave}
          onCancel={() => {
            setShowTaskForm(false)
            setEditingTask(null)
          }}
        />
      )}

      {/* Task Detail Modal */}
      {viewingTask && (
        <TaskDetail
          task={viewingTask}
          onClose={() => setViewingTask(null)}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </MainLayout>
  )
}

export default function TasksPage() {
  return (
    <AuthWrapper>
      <PageErrorBoundary>
        <TasksContent />
      </PageErrorBoundary>
    </AuthWrapper>
  )
}