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
import { Plus } from 'lucide-react'

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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {STATUS_COLUMNS.map(column => (
          <BoardColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id] || []}
            onTaskEdit={onTaskEdit}
            onTaskDelete={onTaskDelete}
            onStatusChange={onStatusChange}
            onTaskView={onTaskView}
            onNewTask={onNewTask}
          />
        ))}
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
  onTaskEdit: (task: Task) => void
  onTaskDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onTaskView?: (task: Task) => void
  onNewTask?: () => void
}

function BoardColumn({
  column,
  tasks,
  onTaskEdit,
  onTaskDelete,
  onStatusChange,
  onTaskView,
  onNewTask,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <Card className={`transition-colors ${isOver ? 'ring-2 ring-brand-gold bg-brand-beige' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            {column.label}
            <span className="text-gray-500 font-normal">{tasks.length}</span>
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
      </CardContent>
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
