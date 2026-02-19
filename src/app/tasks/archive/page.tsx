'use client'

import { useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskDetail } from '@/components/tasks/task-detail'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Archive, CheckSquare, Search, Calendar } from 'lucide-react'
import { Task, TaskStatus } from '@/types'
import { TaskApi } from '@/lib/api'
import { useTasks, useProjects } from '@/lib/context'
import { PageErrorBoundary } from '@/components/error-boundary'

type DateFilter = 'week' | 'month' | 'year'

function getDateRange(filter: DateFilter): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(now)
  if (filter === 'week') {
    const day = now.getDay()
    start.setDate(now.getDate() - day)
  } else if (filter === 'month') {
    start.setDate(1)
  } else {
    start.setMonth(0, 1)
  }
  start.setHours(0, 0, 0, 0)

  return { start, end }
}

function getFilterLabel(filter: DateFilter): string {
  const now = new Date()
  if (filter === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    return `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }
  if (filter === 'month') {
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  return now.getFullYear().toString()
}

function ArchiveContent() {
  const { allTasks, refreshData } = useTasks()
  const { projects } = useProjects()
  const [dateFilter, setDateFilter] = useState<DateFilter>('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProject, setFilterProject] = useState('ALL')
  const [viewingTask, setViewingTask] = useState<Task | null>(null)

  const completedTasks = useMemo(() => {
    const { start, end } = getDateRange(dateFilter)

    return allTasks.filter(task => {
      if (task.status !== 'DONE') return false

      // Use completed date if set, otherwise fall back to updated date
      const completedAt = task.dates.completed
        ? new Date(task.dates.completed)
        : new Date(task.dates.updated)

      if (completedAt < start || completedAt > end) return false

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchable = `${task.title} ${task.description ?? ''} ${task.tags.join(' ')}`.toLowerCase()
        if (!searchable.includes(query)) return false
      }

      if (filterProject !== 'ALL' && task.project !== filterProject) return false

      return true
    }).sort((a, b) => {
      const aDate = a.dates.completed ? new Date(a.dates.completed) : new Date(a.dates.updated)
      const bDate = b.dates.completed ? new Date(b.dates.completed) : new Date(b.dates.updated)
      return bDate.getTime() - aDate.getTime()
    })
  }, [allTasks, dateFilter, searchQuery, filterProject])

  // Group by project
  const groupedByProject = useMemo(() => {
    const groups = new Map<string, { projectName: string; tasks: Task[] }>()

    completedTasks.forEach(task => {
      const project = projects.find(p => p._id === task.project)
      const projectName = project?.name ?? 'No Project'
      const key = task.project ?? 'none'
      if (!groups.has(key)) {
        groups.set(key, { projectName, tasks: [] })
      }
      groups.get(key)!.tasks.push(task)
    })

    return Array.from(groups.entries()).map(([id, data]) => ({ id, ...data }))
  }, [completedTasks, projects])

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await TaskApi.update(taskId, { status })
    refreshData()
  }

  const handleTaskUpdate = (task: Task) => {
    refreshData()
    setViewingTask(task)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Archive className="w-6 h-6 text-gray-700" />
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Task Archive</h1>
            </div>
            <p className="text-gray-600 mt-1">
              {completedTasks.length} completed task{completedTasks.length !== 1 ? 's' : ''} — {getFilterLabel(dateFilter)}
            </p>
          </div>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-2">
          {(['week', 'month', 'year'] as DateFilter[]).map(f => (
            <Button
              key={f}
              variant={dateFilter === f ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setDateFilter(f)}
            >
              <Calendar className="w-3 h-3 mr-1.5" />
              This {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Search & Project Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search completed tasks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <select
                value={filterProject}
                onChange={e => setFilterProject(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-900"
              >
                <option value="ALL">All Projects</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {completedTasks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-full">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
                  <p className="text-xs text-gray-500">Tasks Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-full">
                  <Archive className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{groupedByProject.length}</p>
                  <p className="text-xs text-gray-500">Projects</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-full">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {completedTasks.filter(t => {
                      const d = t.dates.completed ? new Date(t.dates.completed) : new Date(t.dates.updated)
                      return d.toDateString() === new Date().toDateString()
                    }).length}
                  </p>
                  <p className="text-xs text-gray-500">Completed Today</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Task List Grouped by Project */}
        {groupedByProject.length > 0 ? (
          <div className="space-y-8">
            {groupedByProject.map(({ id, projectName, tasks }) => (
              <div key={id}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-base font-semibold text-gray-700">{projectName}</h2>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {tasks.map(task => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onStatusChange={handleStatusChange}
                      onView={setViewingTask}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Archive className="w-14 h-14 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No completed tasks</h3>
              <p className="text-gray-500 text-sm">
                No tasks were completed {dateFilter === 'week' ? 'this week' : dateFilter === 'month' ? 'this month' : 'this year'}.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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

export default function TaskArchivePage() {
  return (
    <AuthWrapper>
      <PageErrorBoundary>
        <ArchiveContent />
      </PageErrorBoundary>
    </AuthWrapper>
  )
}
