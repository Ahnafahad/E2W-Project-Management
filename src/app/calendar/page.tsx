'use client'

import { useState } from 'react'
import { MainLayout } from "@/components/layout/main-layout"
import { AuthWrapper } from "@/components/auth/auth-wrapper"
import { PageErrorBoundary } from '@/components/error-boundary'
import { CalendarView } from '@/components/tasks/calendar-view'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskDetail } from '@/components/tasks/task-detail'
import { useTasks } from '@/lib/context'
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Task } from '@/types'

function CalendarContent() {
  const { allTasks, refreshData } = useTasks()
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)

  const handleTaskSave = (task: Task) => {
    setShowTaskForm(false)
    setEditingTask(null)
    refreshData()
  }

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleTaskView = (task: Task) => {
    setViewingTask(task)
  }

  const handleTaskUpdate = (task: Task) => {
    refreshData()
    setViewingTask(task)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">
              View your tasks by due date
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => setShowTaskForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Calendar View */}
        <CalendarView
          tasks={allTasks}
          onTaskView={handleTaskView}
          onTaskEdit={handleTaskEdit}
        />
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

export default function CalendarPage() {
  return (
    <AuthWrapper>
      <PageErrorBoundary>
        <CalendarContent />
      </PageErrorBoundary>
    </AuthWrapper>
  )
}
