import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Task, ProjectStats, ActivityLog } from '@/models'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/tasks/[id] - Get task by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id } = await params

    const task = await Task.findById(id).lean()

    if (!task || task.deleted) {
      return NextResponse.json({
        success: false,
        error: 'Task not found',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: task,
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error fetching task:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch task',
    }, { status: 500 })
  }
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id: taskId } = await params

    const body = await request.json()

    // Get current task to track changes
    const currentTask = await Task.findById(taskId)

    if (!currentTask) {
      return NextResponse.json({
        success: false,
        error: 'Task not found',
      }, { status: 404 })
    }

    // Remove fields that shouldn't be updated directly
    delete body._id
    delete body.dates?.created

    // Handle priorityRank changes
    if (body.priorityRank !== undefined && body.priorityRank !== currentTask.priorityRank) {
      // Count active tasks (not deleted, not archived, not completed)
      const activeTasksCount = await Task.countDocuments({
        deleted: { $ne: true },
        archived: { $ne: true },
        status: { $ne: 'DONE' }
      })

      const maxRank = activeTasksCount

      // Validate bounds
      if (body.priorityRank < 1 || body.priorityRank > maxRank) {
        return NextResponse.json({
          success: false,
          error: `Priority rank must be between 1 and ${maxRank}`,
        }, { status: 400 })
      }

      const oldRank = currentTask.priorityRank
      const newRank = body.priorityRank

      // Adjust ranks of other tasks
      if (oldRank && newRank) {
        if (newRank < oldRank) {
          // Moving up (lower number = higher priority)
          // Shift tasks down between newRank and oldRank
          await Task.updateMany(
            {
              _id: { $ne: taskId },
              deleted: { $ne: true },
              archived: { $ne: true },
              status: { $ne: 'DONE' },
              priorityRank: { $gte: newRank, $lt: oldRank }
            },
            {
              $inc: { priorityRank: 1 }
            }
          )
        } else {
          // Moving down (higher number = lower priority)
          // Shift tasks up between oldRank and newRank
          await Task.updateMany(
            {
              _id: { $ne: taskId },
              deleted: { $ne: true },
              archived: { $ne: true },
              status: { $ne: 'DONE' },
              priorityRank: { $gt: oldRank, $lte: newRank }
            },
            {
              $inc: { priorityRank: -1 }
            }
          )
        }
      }
    }

    // Update dates
    const updates: Record<string, unknown> = {
      ...body,
      'dates.updated': new Date(),
    }

    // If status changed to DONE, set completed date
    if (body.status === 'DONE' && currentTask.status !== 'DONE') {
      updates['dates.completed'] = new Date()
    }

    // If status changed from DONE to something else, remove completed date
    if (body.status && body.status !== 'DONE' && currentTask.status === 'DONE') {
      updates['dates.completed'] = null
    }

    // If archived changed to true, set archivedAt date
    if (body.archived === true && !currentTask.archived) {
      updates.archivedAt = new Date()
    }

    // If unarchived, remove archivedAt date
    if (body.archived === false && currentTask.archived) {
      updates.archivedAt = null
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      updates,
      { new: true, runValidators: true }
    ).lean()

    // Auto-rerank if task is being marked as DONE, archived, or deleted
    if (((body.status === 'DONE' && currentTask.status !== 'DONE') || (body.archived === true && !currentTask.archived)) && currentTask.priorityRank) {
      await reRankTasks(currentTask.priorityRank)
    }

    // Update project stats
    await updateProjectStats(task!.project)

    // Log activity if status changed
    if (body.status && body.status !== currentTask.status) {
      await ActivityLog.create({
        user: body.userId || currentTask.creator,
        action: 'task_status_changed',
        resource: 'task',
        resourceId: taskId,
        details: {
          taskTitle: task!.title,
          oldStatus: currentTask.status,
          newStatus: body.status,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: task,
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error updating task:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task',
    }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Soft delete task
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id } = await params

    // Get current task to access priorityRank before deletion
    const currentTask = await Task.findById(id)

    if (!currentTask) {
      return NextResponse.json({
        success: false,
        error: 'Task not found',
      }, { status: 404 })
    }

    const task = await Task.findByIdAndUpdate(
      id,
      {
        deleted: true,
        deletedAt: new Date(),
        'dates.updated': new Date(),
      },
      { new: true }
    )

    // Auto-rerank tasks after deletion
    if (currentTask.priorityRank) {
      await reRankTasks(currentTask.priorityRank)
    }

    // Update project stats
    await updateProjectStats(task!.project)

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error deleting task:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete task',
    }, { status: 500 })
  }
}

// Helper function to re-rank tasks after completion, archiving, or deletion
async function reRankTasks(removedRank: number) {
  try {
    // Find all active tasks (not deleted, not archived, not completed) with priorityRank > removedRank
    await Task.updateMany(
      {
        deleted: { $ne: true },
        archived: { $ne: true },
        status: { $ne: 'DONE' },
        priorityRank: { $gt: removedRank }
      },
      {
        $inc: { priorityRank: -1 }
      }
    )
  } catch (error) {
    console.error('Error re-ranking tasks:', error)
  }
}

// Helper function to update project stats
async function updateProjectStats(projectId: string) {
  try {
    const tasks = await Task.find({ project: projectId, deleted: { $ne: true }, archived: { $ne: true } }).lean()

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'DONE').length
    const overdueTasks = tasks.filter(t =>
      t.dates.due &&
      new Date(t.dates.due) < now &&
      t.status !== 'DONE'
    ).length

    const tasksByStatus = {
      TODO: tasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      DONE: tasks.filter(t => t.status === 'DONE').length,
      BLOCKED: tasks.filter(t => t.status === 'BLOCKED').length,
    }

    const tasksByPriority = {
      LOW: tasks.filter(t => t.priority === 'LOW').length,
      MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
      HIGH: tasks.filter(t => t.priority === 'HIGH').length,
      URGENT: tasks.filter(t => t.priority === 'URGENT').length,
    }

    const velocityLastWeek = tasks.filter(t =>
      t.status === 'DONE' &&
      t.dates.completed &&
      new Date(t.dates.completed) >= weekAgo
    ).length

    const completedTasksWithTime = tasks.filter(t =>
      t.status === 'DONE' &&
      t.dates.completed &&
      t.dates.created
    )

    const avgCompletionTime = completedTasksWithTime.length > 0
      ? completedTasksWithTime.reduce((sum, task) => {
          const completedTime = new Date(task.dates.completed!).getTime()
          const createdTime = new Date(task.dates.created).getTime()
          return sum + (completedTime - createdTime) / (1000 * 60 * 60 * 24)
        }, 0) / completedTasksWithTime.length
      : 0

    await ProjectStats.findOneAndUpdate(
      { project: projectId },
      {
        totalTasks,
        completedTasks,
        overdueTasks,
        tasksByStatus,
        tasksByPriority,
        avgCompletionTime,
        velocityLastWeek,
        lastUpdated: new Date(),
      },
      { upsert: true }
    )
  } catch (error) {
    console.error('Error updating project stats:', error)
  }
}
