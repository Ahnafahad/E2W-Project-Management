'use client'

import { useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { TaskDetail } from '@/components/tasks/task-detail'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react'
import { Task, SocialPlatform } from '@/types'
import { useTasks, useProjects } from '@/lib/context'
import { PageErrorBoundary } from '@/components/error-boundary'

const PLATFORM_STYLES: Record<SocialPlatform, { bg: string; text: string; dot: string }> = {
  LinkedIn:  { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-600' },
  Instagram: { bg: 'bg-pink-100',   text: 'text-pink-800',   dot: 'bg-pink-500' },
  Twitter:   { bg: 'bg-sky-100',    text: 'text-sky-800',    dot: 'bg-sky-400' },
  Facebook:  { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-700' },
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function ContentCalendarContent() {
  const { allTasks, refreshData } = useTasks()
  const { projects } = useProjects()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<SocialPlatform | 'ALL'>('ALL')

  // Only tasks that are content posts with a postDate
  const contentTasks = useMemo(() => {
    return allTasks.filter(t => t.contentPost?.isContentPost && t.contentPost.postDate)
  }, [allTasks])

  // Apply platform filter
  const filteredTasks = useMemo(() => {
    if (filterPlatform === 'ALL') return contentTasks
    return contentTasks.filter(t => t.contentPost!.platforms.includes(filterPlatform))
  }, [contentTasks, filterPlatform])

  // Build a map: "YYYY-MM-DD" -> Task[]
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    filteredTasks.forEach(task => {
      const key = task.contentPost!.postDate.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(task)
    })
    return map
  }, [filteredTasks])

  // Calendar grid for the current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d))
    }
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Monthly stats
  const monthTasks = useMemo(() => {
    return filteredTasks.filter(t => {
      const d = new Date(t.contentPost!.postDate)
      return d.getFullYear() === year && d.getMonth() === month
    })
  }, [filteredTasks, year, month])

  const platformCounts = useMemo(() => {
    const counts: Partial<Record<SocialPlatform, number>> = {}
    monthTasks.forEach(t => {
      t.contentPost!.platforms.forEach(p => {
        counts[p] = (counts[p] || 0) + 1
      })
    })
    return counts
  }, [monthTasks])

  const handleTaskUpdate = (task: Task) => {
    refreshData()
    setViewingTask(task)
  }

  const today = new Date()

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-gray-700" />
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Content Calendar</h1>
            </div>
            <p className="text-gray-600 mt-1">
              {monthTasks.length} post{monthTasks.length !== 1 ? 's' : ''} scheduled in {MONTHS[month]} {year}
            </p>
          </div>

          {/* Platform filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterPlatform('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filterPlatform === 'ALL'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              All
            </button>
            {(['LinkedIn', 'Instagram', 'Twitter', 'Facebook'] as SocialPlatform[]).map(p => {
              const s = PLATFORM_STYLES[p]
              return (
                <button
                  key={p}
                  onClick={() => setFilterPlatform(prev => prev === p ? 'ALL' : p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    filterPlatform === p
                      ? `${s.bg} ${s.text} border-transparent`
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {p}
                  {platformCounts[p] ? (
                    <span className="ml-1.5 opacity-70">{platformCounts[p]}</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900">
            {MONTHS[month]} {year}
          </h2>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar grid */}
        <Card>
          <CardContent className="p-0 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {DAYS.map(d => (
                <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, i) => {
                if (!date) {
                  return <div key={`empty-${i}`} className="min-h-[110px] border-b border-r border-gray-100 bg-gray-50/50" />
                }

                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                const dayTasks = tasksByDay.get(key) || []
                const isToday = isSameDay(date, today)
                const isPast = date < today && !isToday

                return (
                  <div
                    key={key}
                    className={`min-h-[110px] border-b border-r border-gray-100 p-1.5 ${
                      isPast ? 'bg-gray-50/40' : 'bg-white'
                    }`}
                  >
                    {/* Date number */}
                    <div className="flex justify-end mb-1">
                      <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium ${
                        isToday
                          ? 'bg-gray-900 text-white'
                          : isPast
                          ? 'text-gray-400'
                          : 'text-gray-700'
                      }`}>
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Posts */}
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map(task => {
                        const project = projects.find(p => p._id === task.project)
                        const firstPlatform = task.contentPost!.platforms[0]
                        const style = firstPlatform ? PLATFORM_STYLES[firstPlatform] : null

                        return (
                          <button
                            key={task._id}
                            onClick={() => setViewingTask(task)}
                            className={`w-full text-left px-1.5 py-1 rounded text-xs font-medium truncate transition-opacity hover:opacity-80 ${
                              style ? `${style.bg} ${style.text}` : 'bg-gray-100 text-gray-700'
                            }`}
                            title={task.title}
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style?.dot || 'bg-gray-400'}`} />
                              <span className="truncate">{task.title}</span>
                            </div>
                            {task.contentPost!.platforms.length > 1 && (
                              <div className="flex gap-0.5 mt-0.5 flex-wrap">
                                {task.contentPost!.platforms.map(p => (
                                  <span key={p} className="opacity-60 text-[10px]">{p.slice(0, 2)}</span>
                                ))}
                              </div>
                            )}
                          </button>
                        )
                      })}
                      {dayTasks.length > 3 && (
                        <p className="text-[10px] text-gray-400 pl-1">+{dayTasks.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming posts list */}
        {monthTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              All posts this month
            </h3>
            <div className="space-y-2">
              {[...monthTasks]
                .sort((a, b) => a.contentPost!.postDate.localeCompare(b.contentPost!.postDate))
                .map(task => {
                  const project = projects.find(p => p._id === task.project)
                  const postDate = new Date(task.contentPost!.postDate)
                  const isPast = postDate < today && !isSameDay(postDate, today)

                  return (
                    <button
                      key={task._id}
                      onClick={() => setViewingTask(task)}
                      className="w-full text-left"
                    >
                      <Card className={`hover:shadow-md transition-shadow ${isPast ? 'opacity-60' : ''}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {/* Date column */}
                            <div className="flex-shrink-0 text-center w-12">
                              <div className="text-xs text-gray-500">{postDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                              <div className="text-xl font-bold text-gray-900 leading-none">{postDate.getDate()}</div>
                              <div className="text-xs text-gray-400">{postDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{task.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{project?.name ?? 'No project'}</p>
                            </div>

                            {/* Platform badges */}
                            <div className="flex flex-wrap gap-1 justify-end">
                              {task.contentPost!.platforms.map(p => {
                                const s = PLATFORM_STYLES[p]
                                return (
                                  <span key={p} className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                                    {p}
                                  </span>
                                )
                              })}
                            </div>

                            {/* Status dot */}
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              task.status === 'DONE' ? 'bg-green-500' :
                              isPast ? 'bg-red-400' : 'bg-amber-400'
                            }`} />
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  )
                })}
            </div>
          </div>
        )}

        {contentTasks.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Megaphone className="w-14 h-14 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No content posts yet</h3>
              <p className="text-gray-500 text-sm">
                When creating a task, check "This is a social media post" and set a post date to see it here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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

export default function ContentCalendarPage() {
  return (
    <AuthWrapper>
      <PageErrorBoundary>
        <ContentCalendarContent />
      </PageErrorBoundary>
    </AuthWrapper>
  )
}
