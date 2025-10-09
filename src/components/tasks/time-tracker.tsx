'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Play,
  Pause,
  Square,
  Clock,
  Plus,
  Trash2
} from 'lucide-react'
import { Task } from '@/types'
import { TimeEntryApi, TaskApi, TimeEntry as ITimeEntry } from '@/lib/api'
import { useAuth } from '@/lib/context'
import { formatRelativeTime } from '@/lib/utils'

interface TimeTrackerProps {
  task: Task
  onUpdate: (task: Task) => void
}

export function TimeTracker({ task, onUpdate }: TimeTrackerProps) {
  const { user } = useAuth()
  const [isTracking, setIsTracking] = useState(false)
  const [currentStartTime, setCurrentStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [timeEntries, setTimeEntries] = useState<ITimeEntry[]>([])
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ITimeEntry | null>(null)
  const [manualEntry, setManualEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    minutes: '',
    description: ''
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadTimeEntries()
  }, [task._id])

  useEffect(() => {
    if (isTracking && currentStartTime) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - currentStartTime.getTime()) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isTracking, currentStartTime])

  const loadTimeEntries = async () => {
    const entries = await TimeEntryApi.getByTask(task._id)
    setTimeEntries(entries)
  }

  const saveTimeEntry = async (entry: {
    startTime: Date
    endTime?: Date
    duration: number
    description: string
  }) => {
    if (!user) return

    await TimeEntryApi.create(task._id, {
      user: user._id,
      ...entry,
    })

    await loadTimeEntries()
    await updateTaskTrackedTime()
  }

  const deleteTimeEntry = async (entryId: string) => {
    await TimeEntryApi.delete(entryId)
    await loadTimeEntries()
    await updateTaskTrackedTime()
  }

  const updateTaskTrackedTime = async () => {
    const updatedTask = await TaskApi.getById(task._id)
    if (updatedTask) {
      onUpdate(updatedTask)
    }
  }

  const startTracking = () => {
    setCurrentStartTime(new Date())
    setElapsedTime(0)
    setIsTracking(true)
  }

  const pauseTracking = async () => {
    if (currentStartTime && user) {
      const duration = Math.floor((Date.now() - currentStartTime.getTime()) / 1000)

      await saveTimeEntry({
        startTime: currentStartTime,
        endTime: new Date(),
        duration,
        description: `Time tracked on ${new Date().toLocaleDateString()}`,
      })
    }

    setIsTracking(false)
    setCurrentStartTime(null)
    setElapsedTime(0)
  }

  const stopTracking = () => {
    pauseTracking()
  }

  const addManualEntry = async () => {
    if ((!manualEntry.hours && !manualEntry.minutes) || !user) return

    const totalMinutes = (parseInt(manualEntry.hours) || 0) * 60 + (parseInt(manualEntry.minutes) || 0)
    const totalSeconds = totalMinutes * 60

    await saveTimeEntry({
      startTime: new Date(manualEntry.date),
      endTime: new Date(manualEntry.date),
      duration: totalSeconds,
      description: manualEntry.description || `Manual time entry - ${totalMinutes} minutes`,
    })

    setShowAddEntry(false)
    setManualEntry({
      date: new Date().toISOString().split('T')[0],
      hours: '',
      minutes: '',
      description: ''
    })
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getTotalTrackedTime = (): string => {
    const totalSeconds = timeEntries.reduce((sum, entry) => sum + entry.duration, 0)
    const currentSeconds = isTracking ? elapsedTime : 0
    return formatDuration(totalSeconds + currentSeconds)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Controls */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-center mb-4">
            <div className="text-3xl font-mono font-bold text-gray-900">
              {formatDuration(elapsedTime)}
            </div>
            <div className="text-sm text-gray-500">
              {isTracking ? 'Currently tracking' : 'Timer stopped'}
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {!isTracking ? (
              <Button onClick={startTracking} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Start
              </Button>
            ) : (
              <>
                <Button onClick={pauseTracking} variant="secondary" className="flex items-center gap-2">
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
                <Button onClick={stopTracking} variant="secondary" className="flex items-center gap-2">
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Total Time */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm text-blue-600 font-medium">Total Time Tracked</div>
          <div className="text-xl font-bold text-blue-900">{getTotalTrackedTime()}</div>
          {task.timeEstimate && (
            <div className="text-xs text-blue-600">
              Estimated: {formatDuration(task.timeEstimate * 60)}
            </div>
          )}
        </div>

        {/* Manual Entry */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Time Entries</h4>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddEntry(!showAddEntry)}
              className="flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Entry
            </Button>
          </div>

          {showAddEntry && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={manualEntry.date}
                    onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
                    className="w-full text-xs px-2 py-1 border border-gray-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={manualEntry.hours}
                    onChange={(e) => setManualEntry({ ...manualEntry, hours: e.target.value })}
                    className="w-full text-xs px-2 py-1 border border-gray-200 rounded"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={manualEntry.minutes}
                    onChange={(e) => setManualEntry({ ...manualEntry, minutes: e.target.value })}
                    className="w-full text-xs px-2 py-1 border border-gray-200 rounded"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={manualEntry.description}
                  onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
                  className="w-full text-xs px-2 py-1 border border-gray-200 rounded"
                  placeholder="What did you work on?"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addManualEntry}>Add</Button>
                <Button size="sm" variant="secondary" onClick={() => setShowAddEntry(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Time Entries List */}
          <div className="space-y-2">
            {timeEntries.length > 0 ? (
              timeEntries.map(entry => (
                <div key={entry._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{formatDuration(entry.duration)}</div>
                    <div className="text-xs text-gray-500">{entry.description}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(entry.startTime).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTimeEntry(entry._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm">No time entries yet</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}