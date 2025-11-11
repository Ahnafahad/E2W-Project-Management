'use client'

import { useState, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { AnalyticsCharts } from '@/components/analytics/analytics-charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Download,
  Filter,
  FileText,
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  CheckSquare,
  AlertTriangle
} from 'lucide-react'
import { useProjects, useTasks } from '@/lib/context'

type ReportType = 'overview' | 'productivity' | 'projects' | 'team' | 'custom'
type TimeRange = '7d' | '30d' | '90d' | 'all'

function ReportsContent() {
  const { allTasks } = useTasks()
  const { projects } = useProjects()

  const [activeReport, setActiveReport] = useState<ReportType>('overview')
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [selectedProject, setSelectedProject] = useState<string>('all')

  // Filter tasks based on time range and project
  const filteredTasks = useMemo(() => {
    let filtered = allTasks.filter(task => !task.deleted)

    // Apply time range filter
    if (timeRange !== 'all') {
      const days = {
        '7d': 7,
        '30d': 30,
        '90d': 90
      }[timeRange]

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      filtered = filtered.filter(task =>
        new Date(task.dates.created) >= cutoffDate
      )
    }

    // Apply project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(task => task.project === selectedProject)
    }

    return filtered
  }, [allTasks, timeRange, selectedProject])

  // Calculate key metrics
  const metrics = useMemo(() => {
    const total = filteredTasks.length
    const completed = filteredTasks.filter(task => task.status === 'DONE').length
    const inProgress = filteredTasks.filter(task => task.status === 'IN_PROGRESS').length
    const overdue = filteredTasks.filter(task =>
      task.dates.due &&
      new Date(task.dates.due) < new Date() &&
      task.status !== 'DONE'
    ).length

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // Calculate average completion time
    const completedTasks = filteredTasks.filter(task => task.dates.completed)
    const avgCompletionTime = completedTasks.length > 0
      ? Math.round(
          completedTasks.reduce((sum, task) => {
            const created = new Date(task.dates.created).getTime()
            const completed = new Date(task.dates.completed!).getTime()
            return sum + (completed - created)
          }, 0) / completedTasks.length / (1000 * 60 * 60 * 24)
        )
      : 0

    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate,
      avgCompletionTime
    }
  }, [filteredTasks])

  // Generate exportable report data
  const generateReportData = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      selectedProject: selectedProject === 'all' ? 'All Projects' : projects.find(p => p._id === selectedProject)?.name,
      metrics,
      tasks: filteredTasks.map(task => ({
        id: task._id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        project: projects.find(p => p._id === task.project)?.name || 'Unknown',
        created: task.dates.created,
        completed: task.dates.completed,
        due: task.dates.due,
        timeTracked: task.timeTracked
      })),
      projects: projects.map(project => {
        const projectTasks = filteredTasks.filter(task => task.project === project._id)
        const completedTasks = projectTasks.filter(task => task.status === 'DONE')
        return {
          id: project._id,
          name: project.name,
          totalTasks: projectTasks.length,
          completedTasks: completedTasks.length,
          progress: projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0
        }
      })
    }

    return reportData
  }

  const exportReport = (format: 'json' | 'csv') => {
    const data = generateReportData()
    const timestamp = new Date().toISOString().split('T')[0]

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `e2w-report-${timestamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (format === 'csv') {
      // Generate CSV for tasks
      const headers = ['ID', 'Title', 'Status', 'Priority', 'Project', 'Created', 'Completed', 'Due', 'Time Tracked (minutes)']
      const csvContent = [
        headers.join(','),
        ...data.tasks.map(task => [
          task.id,
          `"${task.title.replace(/"/g, '""')}"`,
          task.status,
          task.priority,
          `"${task.project.replace(/"/g, '""')}"`,
          task.created,
          task.completed || '',
          task.due || '',
          task.timeTracked || 0
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `e2w-tasks-report-${timestamp}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const reportTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'productivity', label: 'Productivity', icon: TrendingUp },
    { id: 'projects', label: 'Projects', icon: FileText },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'custom', label: 'Custom', icon: Filter }
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">
              Insights and analytics for your projects and tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => exportReport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => exportReport('json')}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Projects</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 overflow-x-auto">
            {reportTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id as ReportType)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeReport === tab.id
                    ? 'border-brand-gold text-brand-charcoal'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.total}</div>
                  <div className="text-xs text-gray-500">Total Tasks</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckSquare className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.completed}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.inProgress}</div>
                  <div className="text-xs text-gray-500">In Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.overdue}</div>
                  <div className="text-xs text-gray-500">Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.completionRate}%</div>
                  <div className="text-xs text-gray-500">Completion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        {activeReport === 'overview' && (
          <AnalyticsCharts tasks={filteredTasks} projects={projects} />
        )}

        {/* Productivity Report */}
        {activeReport === 'productivity' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Completion Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">{metrics.avgCompletionTime}</div>
                  <div className="text-sm text-gray-500">days average</div>
                  <p className="text-xs text-gray-400 mt-2">
                    Based on {filteredTasks.filter(t => t.dates.completed).length} completed tasks
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Tracking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTasks
                    .filter(task => task.timeTracked && task.timeTracked > 0)
                    .slice(0, 5)
                    .map(taskItem => (
                      <div key={taskItem._id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 truncate">{taskItem.title}</span>
                        <span className="text-sm font-medium">
                          {Math.round(taskItem.timeTracked! / 60)}h
                        </span>
                      </div>
                    ))}
                  {filteredTasks.filter(task => task.timeTracked && task.timeTracked > 0).length === 0 && (
                    <div className="text-center py-4 text-gray-400">
                      No time tracking data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Project Report */}
        {activeReport === 'projects' && (
          <Card>
            <CardHeader>
              <CardTitle>Project Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Project</th>
                      <th className="text-center py-2">Total Tasks</th>
                      <th className="text-center py-2">Completed</th>
                      <th className="text-center py-2">In Progress</th>
                      <th className="text-center py-2">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(project => {
                      const projectTasks = filteredTasks.filter(task => task.project === project._id)
                      const completed = projectTasks.filter(task => task.status === 'DONE').length
                      const inProgress = projectTasks.filter(task => task.status === 'IN_PROGRESS').length
                      const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0

                      return (
                        <tr key={project._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 font-medium">{project.name}</td>
                          <td className="text-center">{projectTasks.length}</td>
                          <td className="text-center">{completed}</td>
                          <td className="text-center">{inProgress}</td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 bg-blue-500 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{progress}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Report */}
        {activeReport === 'team' && (
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3" />
                <p>Team analytics will be available with multi-user features</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Report */}
        {activeReport === 'custom' && (
          <Card>
            <CardHeader>
              <CardTitle>Custom Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <Filter className="w-12 h-12 mx-auto mb-3" />
                <p>Custom report builder coming soon</p>
                <p className="text-sm mt-1">Create custom filters and visualizations</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}

export default function ReportsPage() {
  return (
    <AuthWrapper>
      <ReportsContent />
    </AuthWrapper>
  )
}