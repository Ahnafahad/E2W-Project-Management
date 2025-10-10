'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Task, TaskStatus, TaskPriority, User } from '@/types'
import { TaskApi, UserApi } from '@/lib/api'
import { useAuth, useProjects, useTasks } from '@/lib/context'
// import { FileUpload, FileAttachment } from '@/components/ui/file-upload' // Disabled until file storage backend is implemented
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
  const { allTasks } = useTasks()
  const [teamMembers, setTeamMembers] = useState<User[]>([])

  // Calculate available rank positions based on existing non-deleted, non-completed tasks
  const activeTasks = allTasks.filter(t => t.status !== 'DONE' && !t.deleted)
  const totalActiveTasksCount = task && task.status !== 'DONE' ? activeTasks.length : activeTasks.length + 1

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO' as TaskStatus,
    priority: task?.priority || 'MEDIUM' as TaskPriority,
    project: task?.project || projectId || '',
    assignees: task?.assignees || [],
    tags: task?.tags?.join(', ') || '',
    dueDate: task?.dates?.due ? new Date(task.dates.due).toISOString().split('T')[0] : '',
    timeEstimate: task?.timeEstimate ? Math.floor(task.timeEstimate / 60) : '', // Convert to hours
    priorityRank: task?.priorityRank || totalActiveTasksCount, // Default to last position
  })

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const users = await UserApi.getAll()
        setTeamMembers(users)
      } catch (error) {
        console.error('Failed to fetch team members:', error)
      }
    }
    fetchTeamMembers()
  }, [])

  // Disabled until file storage backend is implemented
  // const [attachments, setAttachments] = useState<FileAttachment[]>(
  //   task?.attachments?.map(att => ({
  //     id: att.fileId,
  //     name: att.name,
  //     size: att.size,
  //     type: att.type,
  //     data: att.fileId, // fileId stores the base64 data or URL
  //     uploadedAt: att.uploadedAt,
  //     uploadedBy: 'unknown' // Attachment type doesn't have uploadedBy
  //   })) || []
  // )

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
        timeEstimate: formData.timeEstimate ? parseInt(String(formData.timeEstimate)) * 60 : undefined, // Convert to minutes
        timeTracked: task?.timeTracked || 0,
        attachments: task?.attachments || [], // File uploads disabled until backend storage is implemented
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

            {/* Team Members Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Team Members
              </label>
              <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {teamMembers.length > 0 ? (
                  teamMembers.map(member => (
                    <label key={member._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.assignees.includes(member._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, assignees: [...formData.assignees, member._id] })
                          } else {
                            setFormData({ ...formData, assignees: formData.assignees.filter(id => id !== member._id) })
                          }
                        }}
                        className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-700">{member.name}</span>
                      <span className="text-xs text-gray-500">({member.email})</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Loading team members...</p>
                )}
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

            {/* Priority Ranking */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority Rank (Across All Projects)
              </label>
              <select
                value={formData.priorityRank || totalActiveTasksCount}
                onChange={(e) => setFormData({ ...formData, priorityRank: parseInt(e.target.value) })}
                className="input"
              >
                {Array.from({ length: totalActiveTasksCount }, (_, i) => i + 1).map(rank => (
                  <option key={rank} value={rank}>
                    {rank} {rank === 1 ? '(Highest Priority)' : rank === totalActiveTasksCount ? '(Lowest Priority)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Rank 1 = Highest priority. Total active tasks: {totalActiveTasksCount}
              </p>
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

            {/* File Attachments - Temporarily Disabled */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Attachments
              </label>
              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <div className="text-yellow-600 text-sm">
                    <strong>Feature Not Available:</strong> File uploads require backend storage (S3, Vercel Blob, or Cloudinary) to be configured.
                    This feature is temporarily disabled until file storage is set up.
                  </div>
                </div>
              </div>
              {/* Commented out until file storage backend is implemented
              <FileUpload
                files={attachments}
                onFilesChange={setAttachments}
                maxFiles={5}
                maxFileSize={10 * 1024 * 1024} // 10MB
                acceptedTypes={['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                compact
              />
              */}
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