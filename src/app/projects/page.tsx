'use client'

import { useState, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  CheckSquare,
  Calendar,
  TrendingUp,
  Settings
} from 'lucide-react'
import { Project } from '@/types'
import { ProjectApi } from '@/lib/api'
import { useProjects, useAuth, useTasks } from '@/lib/context'
import { formatRelativeTime } from '@/lib/utils'
import { PageErrorBoundary } from '@/components/error-boundary'

interface ProjectFormProps {
  project?: Project | null
  onSave: (project: Project) => void
  onCancel: () => void
}

function ProjectForm({ project, onSave, onCancel }: ProjectFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !user) return

    setIsLoading(true)
    setError('')

    try {
      let savedProject: Project | null

      if (project) {
        // Update existing project
        savedProject = await ProjectApi.update(project._id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
        })
      } else {
        // Create new project
        savedProject = await ProjectApi.create({
          name: formData.name.trim(),
          description: formData.description.trim(),
          owner: user._id,
          members: [user._id],
        })
      }

      if (savedProject) {
        onSave(savedProject)
      } else {
        throw new Error('Failed to save project')
      }
    } catch (error) {
      setError('Failed to save project')
      console.error('Project save error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{project ? 'Edit Project' : 'Create New Project'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Enter project name"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input min-h-[80px] resize-none"
                placeholder="Enter project description (optional)"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="flex-1"
              >
                {isLoading ? 'Saving...' : (project ? 'Update' : 'Create')}
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

function ProjectCard({ project, onEdit, onDelete }: {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const { allTasks } = useTasks()

  const projectTasks = allTasks.filter(task => task.project === project._id)
  const completedTasks = projectTasks.filter(task => task.status === 'DONE')
  const inProgressTasks = projectTasks.filter(task => task.status === 'IN_PROGRESS')
  const overdueTasks = projectTasks.filter(task =>
    task.dates.due &&
    new Date(task.dates.due) < new Date() &&
    task.status !== 'DONE'
  )

  const progress = projectTasks.length > 0
    ? Math.round((completedTasks.length / projectTasks.length) * 100)
    : 0

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${project.name}"? This will also delete all tasks in this project.`)) {
      onDelete(project._id)
    }
    setShowMenu(false)
  }

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate pr-2">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>

              {showMenu && (
                <>
                  <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-32">
                    <button
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-t-lg"
                      onClick={() => {
                        onEdit(project)
                        setShowMenu(false)
                      }}
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                      onClick={handleDelete}
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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{projectTasks.length}</div>
              <div className="text-gray-500">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{inProgressTasks.length}</div>
              <div className="text-gray-500">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{completedTasks.length}</div>
              <div className="text-gray-500">Completed</div>
            </div>
          </div>

          {/* Progress Bar */}
          {projectTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Warnings */}
          {overdueTasks.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <Calendar className="w-4 h-4" />
              <span>{overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
            </div>
            <span>Updated {project.updated ? formatRelativeTime(new Date(project.updated)) : 'recently'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectsContent() {
  const { projects, refreshData } = useProjects()
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects

    const query = searchQuery.toLowerCase()
    return projects.filter(project =>
      project.name.toLowerCase().includes(query) ||
      (project.description && project.description.toLowerCase().includes(query))
    )
  }, [projects, searchQuery])

  const handleProjectSave = (project: Project) => {
    setShowProjectForm(false)
    setEditingProject(null)
    refreshData()
  }

  const handleProjectEdit = (project: Project) => {
    setEditingProject(project)
    setShowProjectForm(true)
  }

  const handleProjectDelete = async (projectId: string) => {
    await ProjectApi.delete(projectId)
    refreshData()
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">
              {filteredProjects.length} of {projects.length} projects
            </p>
          </div>

          <Button onClick={() => setShowProjectForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project._id}
                project={project}
                onEdit={handleProjectEdit}
                onDelete={handleProjectDelete}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <CheckSquare className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Create your first project to organize your tasks'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowProjectForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onSave={handleProjectSave}
          onCancel={() => {
            setShowProjectForm(false)
            setEditingProject(null)
          }}
        />
      )}
    </MainLayout>
  )
}

export default function ProjectsPage() {
  return (
    <AuthWrapper>
      <PageErrorBoundary>
        <ProjectsContent />
      </PageErrorBoundary>
    </AuthWrapper>
  )
}