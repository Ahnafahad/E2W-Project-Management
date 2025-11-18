import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Task, ProjectStats, ActivityLog } from '@/models'

export const dynamic = 'force-dynamic'

// GET /api/tasks - Get all tasks (with filters)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const includeArchived = searchParams.get('includeArchived') === 'true'

    const query: Record<string, unknown> = {}

    if (!includeDeleted) {
      query.deleted = { $ne: true }
    }

    if (!includeArchived) {
      query.archived = { $ne: true }
    }

    if (projectId) {
      query.project = projectId
    }

    if (userId) {
      query.$or = [
        { assignees: userId },
        { creator: userId },
        { watchers: userId }
      ]
    }

    if (status) {
      query.status = status
    }

    if (priority) {
      query.priority = priority
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    const tasks = await Task.find(query).sort({ 'dates.updated': -1 }).lean()

    return NextResponse.json({
      success: true,
      data: tasks,
      count: tasks.length,
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tasks',
    }, { status: 500 })
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const {
      title,
      description,
      status = 'TODO',
      priority = 'MEDIUM',
      priorityRank,
      project,
      creator,
      assignees = [],
      watchers = [],
      tags = [],
      dates,
      timeEstimate,
      parent,
      dependencies = [],
      customFields = {},
      recurring
    } = body

    // Validation
    if (!title || !project || !creator) {
      return NextResponse.json({
        success: false,
        error: 'Title, project, and creator are required',
      }, { status: 400 })
    }

    // Validate and handle priorityRank
    let validatedPriorityRank = priorityRank
    if (priorityRank !== undefined) {
      // Count active tasks (not deleted, not archived, not completed)
      const activeTasksCount = await Task.countDocuments({
        deleted: { $ne: true },
        archived: { $ne: true },
        status: { $ne: 'DONE' }
      })

      const maxRank = activeTasksCount + 1 // New task can be 1 to N+1

      // Validate bounds
      if (priorityRank < 1 || priorityRank > maxRank) {
        return NextResponse.json({
          success: false,
          error: `Priority rank must be between 1 and ${maxRank}`,
        }, { status: 400 })
      }

      // If inserting at a rank less than max, shift other tasks down
      if (priorityRank <= activeTasksCount) {
        await Task.updateMany(
          {
            deleted: { $ne: true },
            archived: { $ne: true },
            status: { $ne: 'DONE' },
            priorityRank: { $gte: priorityRank }
          },
          {
            $inc: { priorityRank: 1 }
          }
        )
      }
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      priorityRank,
      project,
      creator,
      assignees,
      watchers: [...new Set([...watchers, creator])], // Creator is always a watcher
      tags,
      dates: {
        created: new Date(),
        updated: new Date(),
        due: dates?.due,
        start: dates?.start,
      },
      timeEstimate,
      timeTracked: 0,
      parent,
      dependencies,
      customFields,
      recurring,
      attachments: [],
      commentCount: 0,
    })

    // Update project stats
    await updateProjectStats(project)

    // Log activity
    await ActivityLog.create({
      user: creator,
      action: 'task_created',
      resource: 'task',
      resourceId: task._id.toString(),
      details: {
        taskTitle: title,
        projectId: project,
      },
    })

    return NextResponse.json({
      success: true,
      data: task,
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating task:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    }, { status: 500 })
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
