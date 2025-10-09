'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Task, TaskStatus, TaskPriority } from '@/types'
import { TaskApi } from '@/lib/api'
import { useAuth, useProjects } from '@/lib/context'
import { FileUpload, FileAttachment } from '@/components/ui/file-upload'
import { X } from 'lucide-react'

interface TaskFormProps {
  task?: Task | null
  projectId?: string
  onSave: (task: Task) => void
  onCancel: () => void
}

export function TaskForm({ task, projectId, onSave, onCancel }: TaskFormProps) {
  const { user } = useAuth()
  const { projects } = useProjects()

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO' as TaskStatus,
    priority: task?.priority || 'MEDIUM' as TaskPriority,
    project: task?.project || projectId || '',
    assignees: task?.assignees || [user?._id || ''],
    tags: task?.tags?.join(', ') || '',
    dueDate: task?.dates?.due ? new Date(task.dates.due).toISOString().split('T')[0] : '',
    timeEstimate: task?.timeEstimate ? Math.floor(task.timeEstimate / 60) : '', // Convert to hours
  })

  const [attachments, setAttachments] = useState<FileAttachment[]>(
    task?.attachments || []
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.project || !user) return

    setIsLoading(true)
    setError('')

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        project: formData.project,
        assignees: formData.assignees.filter(id => id),
        creator: user._id,
        watchers: [user._id],
        dependencies: task?.dependencies || [],
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        customFields: task?.customFields || {},
        dates: {
          created: task?.dates?.created || new Date(),
          updated: new Date(),
          due: formData.dueDate ? new Date(formData.dueDate) : undefined,
          start: task?.dates?.start,
          completed: task?.dates?.completed,
        },
        timeEstimate: formData.timeEstimate ? parseInt(formData.timeEstimate) * 60 : undefined, // Convert to minutes
        timeTracked: task?.timeTracked || 0,
        attachments: attachments,
        commentCount: task?.commentCount || 0,
        recurring: task?.recurring,
        deleted: false,
      }

      let savedTask: Task | null

      if (task) {
        // Update existing task
        savedTask = await TaskApi.update(task._id, taskData)
      } else {
        // Create new task
        savedTask = await TaskApi.create(taskData)
      }

      if (savedTask) {
        onSave(savedTask)
      } else {
        throw new Error('Failed to save task')
      }
    } catch (error) {
      setError('Failed to save task')
      console.error('Task save error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{task ? 'Edit Task' : 'Create New Task'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="Enter task title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input min-h-[100px] resize-none"
                placeholder="Enter task description"
              />
            </div>

            {/* Project and Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project *
                </label>
                <select
                  required
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="input"
                >
                  <option value="">Select project</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  className="input"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
            </div>

            {/* Priority and Due Date Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                  className="input"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            {/* Tags and Time Estimate Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="input"
                  placeholder="bug, feature, urgent (comma separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Estimate (hours)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.timeEstimate}
                  onChange={(e) => setFormData({ ...formData, timeEstimate: e.target.value })}
                  className="input"
                  placeholder="0"
                />
              </div>
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Attachments
              </label>
              <FileUpload
                files={attachments}
                onFilesChange={setAttachments}
                maxFiles={5}
                maxFileSize={10 * 1024 * 1024} // 10MB
                acceptedTypes={['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                compact
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading || !formData.title.trim() || !formData.project}
                className="flex-1"
              >
                {isLoading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}