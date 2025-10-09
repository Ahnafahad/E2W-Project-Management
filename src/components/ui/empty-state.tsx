import { ReactNode } from 'react'
import {
  LucideIcon,
  CheckSquare,
  FolderKanban,
  Search,
  Filter,
  MessageSquare,
  Bell,
  Activity,
  Clock,
  Paperclip,
  Users
} from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {Icon && (
        <div className="mb-4 text-gray-300">
          <Icon className="w-16 h-16 mx-auto" strokeWidth={1.5} />
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-gray-600 max-w-md mb-6">
          {description}
        </p>
      )}

      {children}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Preset empty states for common scenarios

export function EmptyTasksState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={CheckSquare}
      title="No tasks yet"
      description="Get started by creating your first task. Tasks help you organize and track your work."
      action={{
        label: 'Create Task',
        onClick: onCreate,
      }}
    />
  )
}

export function EmptyProjectsState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={FolderKanban}
      title="No projects yet"
      description="Create a project to organize your tasks and collaborate with your team."
      action={{
        label: 'Create Project',
        onClick: onCreate,
      }}
    />
  )
}

export function EmptySearchState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try adjusting your search terms.`}
      action={{
        label: 'Clear Search',
        onClick: onClear,
      }}
    />
  )
}

export function EmptyFilterState({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      icon={Filter}
      title="No matching results"
      description="No items match your current filters. Try adjusting or clearing your filters."
      action={{
        label: 'Clear Filters',
        onClick: onClear,
      }}
    />
  )
}

export function EmptyCommentsState() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No comments yet"
      description="Be the first to share your thoughts on this task."
    />
  )
}

export function EmptyNotificationsState() {
  return (
    <EmptyState
      icon={Bell}
      title="No notifications"
      description="You're all caught up! You'll see notifications here when there's activity."
    />
  )
}

export function EmptyActivityState() {
  return (
    <EmptyState
      icon={Activity}
      title="No recent activity"
      description="Activity and updates will appear here as team members work on tasks."
    />
  )
}

export function EmptyTimeEntriesState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={Clock}
      title="No time tracked"
      description="Start tracking time on this task to monitor hours spent."
      action={{
        label: 'Start Timer',
        onClick: onAdd,
      }}
    />
  )
}

export function EmptyAttachmentsState({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={Paperclip}
      title="No attachments"
      description="Upload files to share documents, images, or other resources."
      action={{
        label: 'Upload File',
        onClick: onUpload,
      }}
    />
  )
}

export function EmptyTeamMembersState({ onInvite }: { onInvite: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No team members"
      description="Invite team members to collaborate on this project."
      action={{
        label: 'Invite Members',
        onClick: onInvite,
      }}
    />
  )
}
