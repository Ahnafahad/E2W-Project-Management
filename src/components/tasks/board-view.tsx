'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { Task, TaskStatus } from '@/types'
import { TaskCard } from './task-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'

interface BoardViewProps {
  tasks: Task[]
  onTaskEdit: (task: Task) => void
  onTaskDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onTaskView?: (task: Task) => void
  onNewTask?: () => void
}

const STATUS_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'TODO', label: 'To Do' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'DONE', label: 'Done' },
  { id: 'BLOCKED', label: 'Blocked' },
]

export function BoardView({
  tasks,
  onTaskEdit,
  onTaskDelete,
  onStatusChange,
  onTaskView,
  onNewTask,
}: BoardViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(new Set())
  const [doneTasksLimit, setDoneTasksLimit] = useState(10)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    })
  )

  // Group tasks by status
  const tasksByStatus = STATUS_COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks.filter(task => task.status === column.id)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string
    const task = tasks.find(t => t._id === taskId)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveTask(null)
      return
    }

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    // Check if dropped on a valid status column
    if (STATUS_COLUMNS.some(col => col.id === newStatus)) {
      const task = tasks.find(t => t._id === taskId)
      if (task && task.status !== newStatus) {
        onStatusChange(taskId, newStatus)
      }
    }

    setActiveTask(null)
  }

  const handleDragCancel = () => {
    setActiveTask(null)
  }

  const toggleColumnCollapse = (columnId: TaskStatus) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev)
      if (next.has(columnId)) {
        next.delete(columnId)
      } else {
        next.add(columnId)
      }
      return next
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {STATUS_COLUMNS.map(column => {
          const columnTasks = tasksByStatus[column.id] || []
          const isDoneColumn = column.id === 'DONE'
          const displayedTasks = isDoneColumn ? columnTasks.slice(0, doneTasksLimit) : columnTasks
          const hasMoreTasks = isDoneColumn && columnTasks.length > doneTasksLimit

          return (
            <BoardColumn
              key={column.id}
              column={column}
              tasks={displayedTasks}
              totalTaskCount={columnTasks.length}
              onTaskEdit={onTaskEdit}
              onTaskDelete={onTaskDelete}
              onStatusChange={onStatusChange}
              onTaskView={onTaskView}
              onNewTask={onNewTask}
              isCollapsed={collapsedColumns.has(column.id)}
              onToggleCollapse={() => toggleColumnCollapse(column.id)}
              hasMoreTasks={hasMoreTasks}
              onShowMore={isDoneColumn ? () => setDoneTasksLimit(prev => prev + 10) : undefined}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80 rotate-3 scale-105">
            <TaskCard
              task={activeTask}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onStatusChange={onStatusChange}
              onView={onTaskView}
              compact
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

interface BoardColumnProps {
  column: { id: TaskStatus; label: string }
  tasks: Task[]
  totalTaskCount: number
  onTaskEdit: (task: Task) => void
  onTaskDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onTaskView?: (task: Task) => void
  onNewTask?: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  hasMoreTasks: boolean
  onShowMore?: () => void
}

function BoardColumn({
  column,
  tasks,
  totalTaskCount,
  onTaskEdit,
  onTaskDelete,
  onStatusChange,
  onTaskView,
  onNewTask,
  isCollapsed,
  onToggleCollapse,
  hasMoreTasks,
  onShowMore,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <Card className={`transition-colors ${isOver ? 'ring-2 ring-brand-gold bg-brand-beige' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <button
              onClick={onToggleCollapse}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={isCollapsed ? 'Expand column' : 'Collapse column'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {column.label}
            <span className="text-gray-500 font-normal">
              {tasks.length === totalTaskCount ? totalTaskCount : `${tasks.length}/${totalTaskCount}`}
            </span>
          </span>
          {onNewTask && column.id === 'TODO' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onNewTask}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      {!isCollapsed && (
        <CardContent
          ref={setNodeRef}
          className="space-y-3 min-h-[200px] pb-6"
        >
          {tasks.map(task => (
            <DraggableTask
              key={task._id}
              task={task}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onStatusChange={onStatusChange}
              onView={onTaskView}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <div className="text-xs">No tasks</div>
            </div>
          )}
          {hasMoreTasks && onShowMore && (
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowMore}
                className="w-full text-xs"
              >
                Show More ({totalTaskCount - tasks.length} more)
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

interface DraggableTaskProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onView?: (task: Task) => void
}

function DraggableTask({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onView,
}: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task._id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'z-50' : ''}`}
    >
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        onView={onView}
        compact
      />
    </div>
  )
}
