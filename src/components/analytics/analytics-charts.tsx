'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Users,
  Target,
  Activity
} from 'lucide-react'
import { Task, Project } from '@/types'
import { formatRelativeTime } from '@/lib/utils'

interface AnalyticsChartsProps {
  tasks: Task[]
  projects: Project[]
}

interface ChartData {
  label: string
  value: number
  percentage?: number
  color: string
}

export function AnalyticsCharts({ tasks, projects }: AnalyticsChartsProps) {
  // Task completion trends over the last 7 days
  const completionTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date
    })

    return last7Days.map(date => {
      const dayTasks = tasks.filter(task => {
        const completedDate = task.dates.completed
        return completedDate &&
               new Date(completedDate).toDateString() === date.toDateString()
      })

      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: dayTasks.length,
        color: dayTasks.length > 0 ? 'bg-green-500' : 'bg-gray-200'
      }
    })
  }, [tasks])

  // Task distribution by status
  const statusDistribution = useMemo(() => {
    const statusCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      BLOCKED: 0
    }

    tasks.forEach(task => {
      if (!task.deleted) {
        statusCounts[task.status]++
      }
    })

    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0)

    return Object.entries(statusCounts).map(([status, count]) => ({
      label: status.replace('_', ' '),
      value: count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: {
        TODO: 'bg-gray-500',
        IN_PROGRESS: 'bg-blue-500',
        DONE: 'bg-green-500',
        BLOCKED: 'bg-red-500'
      }[status]
    }))
  }, [tasks])

  // Priority distribution
  const priorityDistribution = useMemo(() => {
    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0
    }

    tasks.forEach(task => {
      if (!task.deleted && task.status !== 'DONE') {
        priorityCounts[task.priority]++
      }
    })

    const total = Object.values(priorityCounts).reduce((sum, count) => sum + count, 0)

    return Object.entries(priorityCounts).map(([priority, count]) => ({
      label: priority,
      value: count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: {
        LOW: 'bg-gray-400',
        MEDIUM: 'bg-yellow-500',
        HIGH: 'bg-orange-500',
        URGENT: 'bg-red-600'
      }[priority]
    }))
  }, [tasks])

  // Project progress overview
  const projectProgress = useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(task => task.project === project._id && !task.deleted)
      const completedTasks = projectTasks.filter(task => task.status === 'DONE')
      const progress = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0

      return {
        id: project._id,
        name: project.name,
        total: projectTasks.length,
        completed: completedTasks.length,
        progress: Math.round(progress),
        color: progress >= 75 ? 'bg-green-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
      }
    }).sort((a, b) => b.progress - a.progress)
  }, [tasks, projects])

  // Productivity metrics
  const productivityMetrics = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfLastWeek = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000)

    const thisWeekCompleted = tasks.filter(task => {
      const completed = task.dates.completed
      return completed && new Date(completed) >= startOfWeek
    }).length

    const lastWeekCompleted = tasks.filter(task => {
      const completed = task.dates.completed
      return completed &&
             new Date(completed) >= startOfLastWeek &&
             new Date(completed) < startOfWeek
    }).length

    const weeklyChange = lastWeekCompleted > 0
      ? Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100)
      : 0

    return {
      thisWeek: thisWeekCompleted,
      lastWeek: lastWeekCompleted,
      change: weeklyChange,
      trend: weeklyChange > 0 ? 'up' : weeklyChange < 0 ? 'down' : 'stable'
    }
  }, [tasks])

  const maxCompletionValue = Math.max(...completionTrend.map(d => d.value), 1)

  return (
    <div className="space-y-6">
      {/* Productivity Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Productivity Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{productivityMetrics.thisWeek}</div>
              <div className="text-sm text-gray-500">Tasks This Week</div>
              <div className={`flex items-center justify-center gap-1 mt-1 text-sm ${
                productivityMetrics.trend === 'up' ? 'text-green-600' :
                productivityMetrics.trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {productivityMetrics.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                {productivityMetrics.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                {Math.abs(productivityMetrics.change)}% vs last week
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{productivityMetrics.lastWeek}</div>
              <div className="text-sm text-gray-500">Tasks Last Week</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => !t.deleted && t.status !== 'DONE').length}
              </div>
              <div className="text-sm text-gray-500">Active Tasks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Daily Completions (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completionTrend.map((day, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-12 text-sm font-medium text-gray-600">
                    {day.label}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${day.color}`}
                        style={{
                          width: `${(day.value / maxCompletionValue) * 100}%`
                        }}
                      />
                    </div>
                    <div className="w-8 text-sm font-medium text-gray-900">
                      {day.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Task Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusDistribution.map((status, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium text-gray-600">
                    {status.label}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${status.color}`}
                        style={{ width: `${status.percentage}%` }}
                      />
                    </div>
                    <div className="w-12 text-sm font-medium text-gray-900">
                      {status.value} ({status.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Active Tasks by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priorityDistribution.map((priority, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium text-gray-600">
                    {priority.label}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${priority.color}`}
                        style={{ width: `${priority.percentage}%` }}
                      />
                    </div>
                    <div className="w-12 text-sm font-medium text-gray-900">
                      {priority.value} ({priority.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Project Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projectProgress.slice(0, 5).map((project, index) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {project.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {project.completed}/{project.total} ({project.progress}%)
                    </div>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${project.color}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              ))}
              {projectProgress.length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  No projects to display
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}