import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Task, ProjectStats } from '@/models'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/projects/[id]/stats - Get project statistics
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id: projectId } = await params

    // Get or create stats
    let stats = await ProjectStats.findOne({ project: projectId }).lean()

    if (!stats) {
      // Calculate stats from tasks
      const tasks = await Task.find({ project: projectId, deleted: { $ne: true } }).lean()

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

      // Create new stats
      stats = await ProjectStats.create({
        project: projectId,
        totalTasks,
        completedTasks,
        overdueTasks,
        tasksByStatus,
        tasksByPriority,
        avgCompletionTime,
        velocityLastWeek,
        lastUpdated: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      data: stats,
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error fetching project stats:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project stats',
    }, { status: 500 })
  }
}
