'use client'

import { useMemo, useState } from 'react'
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthWrapper } from "@/components/auth/auth-wrapper"
import {
  CheckSquare,
  Clock,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowRight
} from "lucide-react"
import { useAuth, useProjects, useTasks } from '@/lib/context'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { AnalyticsCharts } from '@/components/analytics/analytics-charts'
import { LucideIcon } from 'lucide-react'
import { PageErrorBoundary } from '@/components/error-boundary'
import { TaskForm } from '@/components/tasks/task-form'
import { Task } from '@/types'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  color: string
  bg: string
}

function StatCard({ title, value, icon: Icon, color, bg }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200 touch-manipulation">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-2 lg:p-3 rounded-full ${bg}`}>
            <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles = {
    LOW: "bg-gray-100 text-gray-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[priority as keyof typeof styles]}`}>
      {priority}
    </span>
  )
}

function DashboardContent() {
  const { user } = useAuth()
  const { projects } = useProjects()
  const { allTasks, refreshData } = useTasks()
  const [showTaskForm, setShowTaskForm] = useState(false)

  // Calculate stats
  const stats = useMemo(() => {
    const totalTasks = allTasks.length
    const inProgressTasks = allTasks.filter(task => task.status === 'IN_PROGRESS').length
    const completedTasks = allTasks.filter(task => task.status === 'DONE').length
    const overdueTasks = allTasks.filter(task =>
      task.dates.due &&
      new Date(task.dates.due) < new Date() &&
      task.status !== 'DONE'
    ).length

    return [
      {
        title: "Total Tasks",
        value: totalTasks.toString(),
        icon: CheckSquare,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        title: "In Progress",
        value: inProgressTasks.toString(),
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
      },
      {
        title: "Completed",
        value: completedTasks.toString(),
        icon: TrendingUp,
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        title: "Overdue",
        value: overdueTasks.toString(),
        icon: AlertTriangle,
        color: "text-red-600",
        bg: "bg-red-50",
      },
    ]
  }, [allTasks])

  // Get recent tasks (last 5 updated)
  const recentTasks = useMemo(() => {
    return allTasks
      .filter(task => task.status !== 'DONE')
      .sort((a, b) => new Date(b.dates.updated).getTime() - new Date(a.dates.updated).getTime())
      .slice(0, 5)
      .map(taskItem => {
        const project = projects.find(p => p._id === taskItem.project)
        const dueDate = taskItem.dates.due
          ? formatRelativeTime(new Date(taskItem.dates.due))
          : 'No due date'

        return {
          id: taskItem._id,
          title: taskItem.title,
          project: project?.name || 'Unknown Project',
          priority: taskItem.priority,
          dueDate,
          assignee: user?.name || 'Unassigned',
        }
      })
  }, [allTasks, projects, user])

  // Get project progress
  const projectProgress = useMemo(() => {
    return projects.map(project => {
      const projectTasks = allTasks.filter(task => task.project === project._id)
      const completedTasks = projectTasks.filter(task => task.status === 'DONE')
      const progress = projectTasks.length > 0
        ? Math.round((completedTasks.length / projectTasks.length) * 100)
        : 0

      return {
        id: project._id,
        name: project.name,
        tasks: projectTasks.length,
        completed: completedTasks.length,
        progress,
        color: "bg-blue-500", // Could be randomized or stored with project
      }
    })
  }, [projects, allTasks])

  const todayTasks = allTasks.filter(task =>
    task.dates.due &&
    new Date(task.dates.due).toDateString() === new Date().toDateString() &&
    task.status !== 'DONE'
  ).length

  const handleTaskSave = (_task: Task) => {
    setShowTaskForm(false)
    refreshData()
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Good morning, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-gray-600 mt-1">
              You have {todayTasks} task{todayTasks !== 1 ? 's' : ''} due today
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => setShowTaskForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Tasks</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/tasks'}>
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-500">{task.project} • Due {task.dueDate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {getInitials(task.assignee)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent tasks</p>
                    <p className="text-sm">Create your first task to get started!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Progress</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/projects'}>
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {projectProgress.length > 0 ? (
                  projectProgress.map((project) => (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${project.color}`} />
                          <span className="font-medium text-gray-900">{project.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{project.completed}/{project.tasks}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">{project.progress}% complete</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No projects yet</p>
                    <p className="text-sm">Create your first project to track progress!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/reports'}>
              <ArrowRight className="w-4 h-4 ml-2" />
              View Full Reports
            </Button>
          </div>
          <AnalyticsCharts tasks={allTasks} projects={projects} />
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={null}
          onSave={handleTaskSave}
          onCancel={() => setShowTaskForm(false)}
        />
      )}
    </MainLayout>
  )
}

export default function DashboardPage() {
  return (
    <AuthWrapper>
      <PageErrorBoundary>
        <DashboardContent />
      </PageErrorBoundary>
    </AuthWrapper>
  )
}