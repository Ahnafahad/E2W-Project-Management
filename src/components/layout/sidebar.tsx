'use client'

import { useState, useCallback } from 'react'
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Users,
  X,
  Archive,
  Megaphone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProjects } from '@/lib/context'
import { useModeContext } from '@/lib/mode-context'
import { ProjectStore } from '@/lib/storage'
import { cn, truncateText } from "@/lib/utils"

interface SidebarProps {
  onClose?: () => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: FolderOpen,
  },
  {
    name: 'My Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    name: 'Task Archive',
    href: '/tasks/archive',
    icon: Archive,
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    name: 'Team',
    href: '/team',
    icon: Users,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    name: 'Content Calendar',
    href: '/content-calendar',
    icon: Megaphone,
  },
]

const projectColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-red-500',
]

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { projects, refreshData } = useProjects()
  const { currentMode } = useModeContext()
  const isOCF = currentMode === 'ocf'

  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  // Debug: log nav click in OCF mode
  const handleNavClick = useCallback((itemName: string, itemHref: string, e: React.MouseEvent) => {
    console.log(`[Sidebar Debug] Click: "${itemName}" → ${itemHref}`)
    console.log(`[Sidebar Debug] Mode: ${currentMode}, pathname: ${pathname}`)
    console.log(`[Sidebar Debug] Event target:`, e.target)
    console.log(`[Sidebar Debug] Event currentTarget:`, e.currentTarget)
    console.log(`[Sidebar Debug] defaultPrevented: ${e.defaultPrevented}`)
    console.log(`[Sidebar Debug] onClose defined: ${!!onClose}`)

    // Check if something is blocking
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const elemAtPoint = document.elementFromPoint(e.clientX, e.clientY)
    console.log(`[Sidebar Debug] Element at click point:`, elemAtPoint)
    console.log(`[Sidebar Debug] Link rect:`, rect)

    if (onClose) onClose()

    // Force navigation as backup if Link doesn't work
    setTimeout(() => {
      const newPathname = window.location.pathname
      console.log(`[Sidebar Debug] After 500ms, pathname is: ${newPathname}`)
      if (newPathname !== itemHref) {
        console.warn(`[Sidebar Debug] Navigation didn't happen! Forcing router.push("${itemHref}")`)
        router.push(itemHref)
      }
    }, 500)
  }, [currentMode, pathname, onClose, router])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    try {
      const currentUser = localStorage.getItem('e2w_current_user')
      if (!currentUser) return

      const user = JSON.parse(currentUser)

      ProjectStore.create({
        name: newProjectName.trim(),
        description: '',
        owner: user._id,
        members: [user._id],
      })

      setNewProjectName('')
      setIsCreatingProject(false)
      refreshData()
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  // Active nav link styles differ by mode
  const activeClass = isOCF
    ? 'bg-[#1e3a6e] text-white font-medium'
    : 'bg-gray-100 text-gray-900 font-medium'

  const inactiveClass = isOCF
    ? 'text-gray-600 hover:bg-blue-50 hover:text-[#1e3a6e]'
    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'

  return (
    <div className="w-60 bg-white border-r border-gray-200 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Mobile Close Button */}
        {onClose && (
          <div className="flex justify-end lg:hidden">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* OCF mode badge */}
        {isOCF && (
          <div className="px-3 py-2 bg-[#1e3a6e]/10 rounded-lg">
            <p className="text-xs font-semibold text-[#1e3a6e] uppercase tracking-wide">
              OCF Mode
            </p>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(item.name, item.href, e)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive ? activeClass : inactiveClass
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {isOCF ? 'OCF Projects' : 'Projects'}
            </h3>
            {/* Hide "New Project" button in OCF mode */}
            {!isOCF && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsCreatingProject(true)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* New Project Form — only in E2W mode */}
          {!isOCF && isCreatingProject && (
            <form onSubmit={handleCreateProject} className="mb-3 p-2 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full text-sm px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-gray-900"
                autoFocus
                onBlur={() => {
                  if (!newProjectName.trim()) {
                    setIsCreatingProject(false)
                  }
                }}
              />
              <div className="flex gap-1 mt-2">
                <button
                  type="submit"
                  className="flex-1 text-xs py-1 bg-gray-900 text-white rounded hover:bg-gray-800"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingProject(false)
                    setNewProjectName('')
                  }}
                  className="flex-1 text-xs py-1 border border-gray-200 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <nav className="space-y-1">
            {projects.map((project, index) => {
              const isActive = pathname === '/projects'
              const color = isOCF ? 'bg-[#1e3a6e]' : projectColors[index % projectColors.length]

              return (
                <Link
                  key={project._id}
                  href="/projects"
                  prefetch={false}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive ? activeClass : inactiveClass
                  )}
                  title={project.name}
                >
                  <div className={cn("w-3 h-3 rounded-full", color)} />
                  <span className="truncate">{truncateText(project.name, 20)}</span>
                </Link>
              )
            })}

            {projects.length === 0 && !isCreatingProject && (
              <div className="px-3 py-2 text-xs text-gray-400 text-center">
                No projects yet
              </div>
            )}
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <Button
            className={cn(
              "w-full justify-start",
              isOCF && "bg-[#1e3a6e] hover:bg-[#162d58] text-white"
            )}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>

          {/* New Project button — hidden in OCF mode */}
          {!isOCF && (
            <Button
              variant="secondary"
              className="w-full justify-start"
              size="sm"
              onClick={() => setIsCreatingProject(true)}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              New Project
            </Button>
          )}
        </div>

        {/* Settings */}
        <div className="pt-4 border-t border-gray-100">
          <Link
            href="/settings"
            onClick={(e) => handleNavClick('Settings', '/settings', e)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === '/settings' ? activeClass : inactiveClass
            )}
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </div>
      </div>
    </div>
  )
}
