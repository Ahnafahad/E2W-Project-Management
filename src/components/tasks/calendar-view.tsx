'use client'

import { useState, useMemo } from 'react'
import { Task } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface CalendarViewProps {
  tasks: Task[]
  onTaskView?: (task: Task) => void
  onTaskEdit?: (task: Task) => void
}

export function CalendarView({ tasks, onTaskView, onTaskEdit }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')

  // Get the first day of the current month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = firstDayOfMonth.getDay()

  // Get total days in month
  const daysInMonth = lastDayOfMonth.getDate()

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
    }

    return days
  }, [currentDate, firstDayOfWeek, daysInMonth])

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {}

    tasks.forEach(task => {
      if (task.dates.due) {
        const dateKey = new Date(task.dates.due).toDateString()
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(task)
      }
    })

    return grouped
  }, [tasks])

  const getTasksForDate = (date: Date | null): Task[] => {
    if (!date) return []
    const dateKey = date.toDateString()
    return tasksByDate[dateKey] || []
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date | null): boolean => {
    if (!date) return false
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date | null): boolean => {
    if (!date) return false
    return date.getMonth() === currentDate.getMonth()
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                {monthName}
              </h2>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={goToToday}>
                Today
              </Button>
              <div className="flex items-center border border-gray-200 rounded-lg p-1">
                <Button
                  variant={view === 'month' ? 'primary' : 'ghost'}
                  size="sm"
                  className="h-8"
                  onClick={() => setView('month')}
                >
                  Month
                </Button>
                <Button
                  variant={view === 'week' ? 'primary' : 'ghost'}
                  size="sm"
                  className="h-8"
                  onClick={() => setView('week')}
                >
                  Week
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div
                key={day}
                className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              const dayTasks = getTasksForDate(date)
              const today = isToday(date)
              const currentMonth = isCurrentMonth(date)

              return (
                <div
                  key={index}
                  className={`bg-white min-h-[120px] p-2 ${
                    !currentMonth ? 'opacity-40' : ''
                  } ${today ? 'ring-2 ring-brand-gold' : ''}`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-medium mb-2 ${today ? 'text-brand-charcoal' : 'text-gray-700'}`}>
                        {date.getDate()}
                        {today && <span className="ml-1 text-xs text-brand-gold">(Today)</span>}
                      </div>

                      {/* Tasks for this day */}
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map(task => (
                          <button
                            key={task._id}
                            onClick={() => onTaskView && onTaskView(task)}
                            className="w-full text-left p-1.5 rounded text-xs bg-gray-50 hover:bg-gray-100 transition-colors border-l-2 border-gray-400"
                            style={{
                              borderLeftColor:
                                task.status === 'DONE'
                                  ? '#10B981'
                                  : task.status === 'IN_PROGRESS'
                                  ? '#3B82F6'
                                  : task.status === 'BLOCKED'
                                  ? '#EF4444'
                                  : '#9CA3AF',
                            }}
                          >
                            <div className="truncate font-medium">{task.title}</div>
                            <div className="text-gray-500 truncate">
                              {task.priority} • {task.status.replace('_', ' ')}
                            </div>
                          </button>
                        ))}

                        {dayTasks.length > 3 && (
                          <div className="text-xs text-gray-500 pl-1.5">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tasks without due date */}
      {tasks.filter(t => !t.dates.due).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Tasks without due date</h3>
            <div className="space-y-2">
              {tasks
                .filter(t => !t.dates.due)
                .slice(0, 5)
                .map(task => (
                  <button
                    key={task._id}
                    onClick={() => onTaskView && onTaskView(task)}
                    className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {task.status.replace('_', ' ')} • {task.priority}
                    </div>
                  </button>
                ))}
              {tasks.filter(t => !t.dates.due).length > 5 && (
                <div className="text-sm text-gray-500 pl-3">
                  +{tasks.filter(t => !t.dates.due).length - 5} more tasks
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
