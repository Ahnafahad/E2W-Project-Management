'use client'

import { MainLayout } from "@/components/layout/main-layout"
import { AuthWrapper } from "@/components/auth/auth-wrapper"
import { PageErrorBoundary } from '@/components/error-boundary'
import { CalendarView } from '@/components/tasks/calendar-view'
import { useTasks } from '@/lib/context'
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

function CalendarContent() {
  const { allTasks } = useTasks()

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
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Calendar View */}
        <CalendarView
          tasks={allTasks}
          onTaskView={(task) => {
            // In a real app, this would open a task detail modal
            console.log('View task:', task)
          }}
        />
      </div>
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
