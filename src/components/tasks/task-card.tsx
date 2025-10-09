'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  MessageSquare,
  Paperclip,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  User
} from 'lucide-react'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { UserApi } from '@/lib/api'
import { useProjects } from '@/lib/context'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: Task['status']) => void
  onView?: (task: Task) => void
  compact?: boolean
}

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const styles = {
    LOW: 'bg-gray-100 text-gray-700 border-gray-300',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-300',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
    URGENT: 'bg-red-100 text-red-700 border-red-300',
  }

  return (
    <span className={`px-2 py-1 rounded-sm text-xs font-medium border ${styles[priority]}`}>
      {priority}
    </span>
  )
}

function StatusBadge({ status, onStatusChange, taskId }: {
  status: Task['status']
  onStatusChange: (taskId: string, status: Task['status']) => void
  taskId: string
}) {
  const [showDropdown, setShowDropdown] = useState(false)

  const styles = {
    TODO: 'bg-gray-100 text-gray-700 border-gray-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-300',
    DONE: 'bg-green-100 text-green-700 border-green-300',
    BLOCKED: 'bg-red-100 text-red-700 border-red-300',
  }

  const labels = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
    BLOCKED: 'Blocked',
  }

  const statusOptions: Task['status'][] = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']

  return (
    <div className="relative">
      <button
        className={`px-2 py-1 rounded-sm text-xs font-medium border ${styles[status]} hover:opacity-80`}
        onClick={(e) => {
          e.stopPropagation()
          setShowDropdown(!showDropdown)
        }}
      >
        {labels[status]}
      </button>

      {showDropdown && (
        <>
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
            {statusOptions.map(option => (
              <button
                key={option}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  onStatusChange(taskId, option)
                  setShowDropdown(false)
                }}
              >
                {labels[option]}
              </button>
            ))}
          </div>
          <div
            className="fixed inset-0 z-[5]"
            onClick={() => setShowDropdown(false)}
          />
        </>
      )}
    </div>
  )
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange, onView, compact = false }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [assigneeUsers, setAssigneeUsers] = useState<any[]>([])
  const { projects } = useProjects()

  const project = projects.find(p => p._id === task.project)
  const isOverdue = task.dates.due && new Date(task.dates.due) < new Date() && task.status !== 'DONE'

  // Load assignee users
  useEffect(() => {
    const loadAssignees = async () => {
      const users = await Promise.all(
        task.assignees.map(id => UserApi.getById(id))
      )
      setAssigneeUsers(users.filter(u => u !== null))
    }
    if (task.assignees.length > 0) {
      loadAssignees()
    }
  }, [task.assignees])

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task._id)
    }
    setShowMenu(false)
  }

  return (
    <Card
      className={`group hover:shadow-md transition-all duration-200 ${isOverdue ? 'border-red-300 bg-red-50/30' : ''} ${onView ? 'cursor-pointer' : ''}`}
      onClick={() => onView && onView(task)}
    >
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate pr-2">
                {task.title}
              </h3>
              {!compact && task.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>

              {showMenu && (
                <>
                  <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-32">
                    {onView && (
                      <button
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-t-lg"
                        onClick={(e) => {
                          e.stopPropagation()
                          onView(task)
                          setShowMenu(false)
                        }}
                      >
                        <MessageSquare className="w-3 h-3" />
                        View
                      </button>
                    )}
                    <button
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(task)
                        setShowMenu(false)
                      }}
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete()
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge
              status={task.status}
              onStatusChange={onStatusChange}
              taskId={task._id}
            />
            <PriorityBadge priority={task.priority} />

            {/* Tags */}
            {task.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 rounded-sm text-xs bg-gray-100 text-gray-600"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-xs text-gray-400">
                +{task.tags.length - 2} more
              </span>
            )}
          </div>

          {/* Meta Information */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              {/* Due Date */}
              {task.dates.due && (
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                  <Calendar className="w-3 h-3" />
                  <span>{formatRelativeTime(new Date(task.dates.due))}</span>
                </div>
              )}

              {/* Comments */}
              {task.commentCount > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{task.commentCount}</span>
                </div>
              )}

              {/* Attachments */}
              {task.attachments.length > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  <span>{task.attachments.length}</span>
                </div>
              )}

              {/* Time Estimate */}
              {task.timeEstimate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{Math.round(task.timeEstimate / 60)}h</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Project */}
              {project && (
                <span className="text-xs text-gray-400">
                  {project.name}
                </span>
              )}

              {/* Assignee */}
              {assigneeUsers.length > 0 && (
                <div className="flex -space-x-1">
                  {assigneeUsers.slice(0, 3).map((user, index) => {
                    return (
                      <div
                        key={user._id}
                        className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white"
                        title={user?.name || 'Unknown User'}
                      >
                        <span className="text-xs font-medium">
                          {user ? getInitials(user.name) : 'U'}
                        </span>
                      </div>
                    )
                  })}
                  {task.assignees.length > 3 && (
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-xs">+{task.assignees.length - 3}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}