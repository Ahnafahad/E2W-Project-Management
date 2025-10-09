'use client'

import { useState, useMemo } from 'react'
import { Task } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

interface TimelineViewProps {
  tasks: Task[]
  onTaskView?: (task: Task) => void
}

type TimeScale = 'day' | 'week' | 'month'

export function TimelineView({ tasks, onTaskView }: TimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [timeScale, setTimeScale] = useState<TimeScale>('week')

  // Filter tasks that have due dates
  const tasksWithDates = useMemo(() => {
    return tasks.filter(task => task.dates.due || task.dates.start)
  }, [tasks])

  // Calculate view range based on time scale
  const viewRange = useMemo(() => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    switch (timeScale) {
      case 'day':
        start.setDate(start.getDate() - 3)
        end.setDate(end.getDate() + 4)
        break
      case 'week':
        start.setDate(start.getDate() - 7)
        end.setDate(end.getDate() + 21)
        break
      case 'month':
        start.setMonth(start.getMonth() - 1)
        end.setMonth(end.getMonth() + 2)
        break
    }

    return { start, end }
  }, [currentDate, timeScale])

  // Generate timeline columns
  const timelineColumns = useMemo(() => {
    const columns: Date[] = []
    const current = new Date(viewRange.start)

    while (current <= viewRange.end) {
      columns.push(new Date(current))

      switch (timeScale) {
        case 'day':
          current.setDate(current.getDate() + 1)
          break
        case 'week':
          current.setDate(current.getDate() + 7)
          break
        case 'month':
          current.setMonth(current.getMonth() + 1)
          break
      }
    }

    return columns
  }, [viewRange, timeScale])

  // Position tasks on timeline
  const positionedTasks = useMemo(() => {
    return tasksWithDates.map(task => {
      const startDate = task.dates.start ? new Date(task.dates.start) : new Date(task.dates.created)
      const endDate = task.dates.due ? new Date(task.dates.due) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)

      // Calculate position and width as percentage
      const totalDuration = viewRange.end.getTime() - viewRange.start.getTime()
      const taskStart = Math.max(startDate.getTime(), viewRange.start.getTime())
      const taskEnd = Math.min(endDate.getTime(), viewRange.end.getTime())

      const left = ((taskStart - viewRange.start.getTime()) / totalDuration) * 100
      const width = ((taskEnd - taskStart) / totalDuration) * 100

      // Only show tasks that are visible in the current range
      const isVisible = taskEnd >= viewRange.start.getTime() && taskStart <= viewRange.end.getTime()

      return {
        task,
        left: Math.max(0, left),
        width: Math.max(1, Math.min(100 - left, width)),
        isVisible,
        startDate,
        endDate,
      }
    }).filter(item => item.isVisible)
  }, [tasksWithDates, viewRange])

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)

    switch (timeScale) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 14 : -14))
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
    }

    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatColumnHeader = (date: Date): string => {
    switch (timeScale) {
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      case 'week':
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  }

  const getTaskColor = (status: Task['status']): string => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-400'
      case 'IN_PROGRESS':
        return 'bg-blue-500'
      case 'DONE':
        return 'bg-green-500'
      case 'BLOCKED':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getPriorityIndicator = (priority: Task['priority']): string => {
    switch (priority) {
      case 'URGENT':
        return 'border-l-4 border-red-600'
      case 'HIGH':
        return 'border-l-4 border-orange-500'
      case 'MEDIUM':
        return 'border-l-4 border-yellow-500'
      case 'LOW':
        return 'border-l-4 border-gray-400'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-[200px] text-center">
                <div className="text-lg font-semibold">Timeline View</div>
                <div className="text-sm text-gray-500">
                  {viewRange.start.toLocaleDateString()} - {viewRange.end.toLocaleDateString()}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={goToToday}>
                Today
              </Button>
              <div className="flex items-center border border-gray-200 rounded-lg p-1">
                <Button
                  variant={timeScale === 'day' ? 'primary' : 'ghost'}
                  size="sm"
                  className="h-8"
                  onClick={() => setTimeScale('day')}
                >
                  Day
                </Button>
                <Button
                  variant={timeScale === 'week' ? 'primary' : 'ghost'}
                  size="sm"
                  className="h-8"
                  onClick={() => setTimeScale('week')}
                >
                  Week
                </Button>
                <Button
                  variant={timeScale === 'month' ? 'primary' : 'ghost'}
                  size="sm"
                  className="h-8"
                  onClick={() => setTimeScale('month')}
                >
                  Month
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Column Headers */}
            <div className="grid grid-cols-[200px_1fr] border-b border-gray-200">
              <div className="p-3 bg-gray-50 border-r border-gray-200 font-medium text-sm">
                Task
              </div>
              <div className="relative h-12 bg-gray-50">
                {timelineColumns.map((date, index) => (
                  <div
                    key={index}
                    className="absolute top-0 bottom-0 border-l border-gray-300 px-2 py-2"
                    style={{
                      left: `${(index / timelineColumns.length) * 100}%`,
                      width: `${100 / timelineColumns.length}%`,
                    }}
                  >
                    <div className="text-xs text-gray-600 whitespace-nowrap">
                      {formatColumnHeader(date)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Rows */}
            {positionedTasks.length > 0 ? (
              <div className="relative">
                {positionedTasks.map(({ task, left, width }, index) => (
                  <div
                    key={task._id}
                    className="grid grid-cols-[200px_1fr] border-b border-gray-100 hover:bg-gray-50"
                  >
                    {/* Task Name */}
                    <div className="p-3 border-r border-gray-200">
                      <div className="text-sm font-medium truncate">{task.title}</div>
                      <div className="text-xs text-gray-500">{task.status}</div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="relative h-16 p-2">
                      {/* Background grid lines */}
                      {timelineColumns.map((_, colIndex) => (
                        <div
                          key={colIndex}
                          className="absolute top-0 bottom-0 border-l border-gray-100"
                          style={{
                            left: `${(colIndex / timelineColumns.length) * 100}%`,
                          }}
                        />
                      ))}

                      {/* Task Bar */}
                      <button
                        onClick={() => onTaskView && onTaskView(task)}
                        className={`absolute top-2 bottom-2 rounded ${getTaskColor(task.status)} ${getPriorityIndicator(task.priority)} hover:opacity-80 transition-opacity cursor-pointer`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                        }}
                      >
                        <div className="px-2 text-white text-xs font-medium truncate">
                          {task.title}
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <div className="mb-2">No tasks with dates in this range</div>
                <div className="text-sm">Adjust the time range or add due dates to tasks</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="font-medium">Status:</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400"></div>
              <span>To Do</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>Done</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>Blocked</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
