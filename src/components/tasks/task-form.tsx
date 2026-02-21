'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Task, TaskStatus, TaskPriority, User, SocialPlatform } from '@/types'
import { TaskApi, UserApi } from '@/lib/api'
import { useAuth, useProjects, useTasks } from '@/lib/context'
import { useModeContext } from '@/lib/mode-context'
import { cn } from '@/lib/utils'
// import { FileUpload, FileAttachment } from '@/components/ui/file-upload' // Disabled until file storage backend is implemented
import { X, Megaphone } from 'lucide-react'

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
  const { currentMode } = useModeContext()
  const isOCF = currentMode === 'ocf'

  const [teamMembers, setTeamMembers] = useState<User[]>([])

  // OCF project is the only project visible in OCF mode
  const ocfProject = projects.find(p => p.isOCF)
  const defaultProject = isOCF
    ? (ocfProject?._id || '')
    : (task?.project || projectId || '')

  // Calculate available rank positions based on existing non-deleted, non-completed tasks
  const activeTasks = allTasks.filter(t => t.status !== 'DONE' && !t.deleted)
  const totalActiveTasksCount = task && task.status !== 'DONE' ? activeTasks.length : activeTasks.length + 1

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO' as TaskStatus,
    priority: task?.priority || 'MEDIUM' as TaskPriority,
    project: defaultProject,
    assignees: task?.assignees || [],
    tags: task?.tags?.join(', ') || '',
    dueDate: task?.dates?.due ? new Date(task.dates.due).toISOString().split('T')[0] : '',
    timeEstimate: task?.timeEstimate ? Math.floor(task.timeEstimate / 60) : '', // Convert to hours
    priorityRank: task?.priorityRank || totalActiveTasksCount, // Default to last position
  })

  const ALL_PLATFORMS: SocialPlatform[] = ['LinkedIn', 'Instagram', 'Twitter', 'Facebook']
  const [isContentPost, setIsContentPost] = useState<boolean>(!!task?.contentPost?.isContentPost)
  const [postDate, setPostDate] = useState<string>(task?.contentPost?.postDate || '')
  const [postPlatforms, setPostPlatforms] = useState<SocialPlatform[]>(task?.contentPost?.platforms || [])

  // External assignees (OCF mode only)
  const [externalAssigneeInput, setExternalAssigneeInput] = useState('')
  const [externalAssignees, setExternalAssignees] = useState<string[]>(task?.externalAssignees || [])

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

  // When OCF project becomes available, lock the project field
  useEffect(() => {
    if (isOCF && ocfProject && !formData.project) {
      setFormData(prev => ({ ...prev, project: ocfProject._id }))
    }
  }, [isOCF, ocfProject])

  const addExternalAssignee = () => {
    const trimmed = externalAssigneeInput.trim()
    if (trimmed && !externalAssignees.includes(trimmed)) {
      setExternalAssignees(prev => [...prev, trimmed])
    }
    setExternalAssigneeInput('')
  }

  const removeExternalAssignee = (name: string) => {
    setExternalAssignees(prev => prev.filter(a => a !== name))
  }

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
        contentPost: isContentPost && postDate && postPlatforms.length > 0
          ? { isContentPost: true as const, postDate, platforms: postPlatforms }
          : undefined,
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
        externalAssignees: isOCF ? externalAssignees : [],
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
          <CardTitle>
            {task ? 'Edit Task' : 'Create New Task'}
            {isOCF && (
              <span className="ml-2 text-xs font-normal text-[#1e3a6e] bg-[#1e3a6e]/10 px-2 py-0.5 rounded-full">
                OCF
              </span>
            )}
          </CardTitle>
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
                {isOCF ? (
                  // In OCF mode: project is locked to the OCF project
                  <div className="input bg-gray-50 text-gray-600 cursor-not-allowed flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1e3a6e] inline-block" />
                    {ocfProject?.name || 'Oxford Cambridge Fellowship'}
                  </div>
                ) : (
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
                )}
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
                  teamMembers
                    .filter(member => member.email !== 'annurababil37@gmail.com')
                    .map(member => (
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

            {/* External Assignees — OCF mode only */}
            {isOCF && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  External Assignees
                  <span className="ml-1 text-xs text-gray-400 font-normal">(not in the system)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={externalAssigneeInput}
                    onChange={(e) => setExternalAssigneeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addExternalAssignee()
                      }
                    }}
                    className="input flex-1"
                    placeholder="Name or organization (external)"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addExternalAssignee}
                  >
                    Add
                  </Button>
                </div>
                {externalAssignees.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {externalAssignees.map(name => (
                      <span
                        key={name}
                        className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-full"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => removeExternalAssignee(name)}
                          className="hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

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

            {/* Content Post */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isContentPost}
                  onChange={e => {
                    setIsContentPost(e.target.checked)
                    if (!e.target.checked) {
                      setPostDate('')
                      setPostPlatforms([])
                    }
                  }}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">This is a social media post</span>
                </div>
              </label>

              {isContentPost && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Post Date <span className="text-gray-400 font-normal">(when it goes live)</span>
                    </label>
                    <input
                      type="date"
                      value={postDate}
                      onChange={e => setPostDate(e.target.value)}
                      className="input"
                      required={isContentPost}
                    />
                    <p className="text-xs text-gray-400 mt-1">This is separate from the task due date.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platforms
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_PLATFORMS.map(platform => {
                        const selected = postPlatforms.includes(platform)
                        const colours: Record<SocialPlatform, string> = {
                          LinkedIn: 'bg-blue-600 text-white border-blue-600',
                          Instagram: 'bg-pink-500 text-white border-pink-500',
                          Twitter: 'bg-sky-400 text-white border-sky-400',
                          Facebook: 'bg-blue-800 text-white border-blue-800',
                        }
                        return (
                          <button
                            key={platform}
                            type="button"
                            onClick={() => {
                              setPostPlatforms(prev =>
                                prev.includes(platform)
                                  ? prev.filter(p => p !== platform)
                                  : [...prev, platform]
                              )
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              selected ? colours[platform] : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {platform}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
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
                className={cn(
                  "flex-1",
                  isOCF && "bg-[#1e3a6e] hover:bg-[#162d58]"
                )}
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

