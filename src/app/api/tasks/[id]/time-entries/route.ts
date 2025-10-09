import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { TimeEntry } from '@/models/TimeEntry'
import TaskModel from '@/models/Task'

// GET /api/tasks/[id]/time-entries - Get all time entries for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id: taskId } = await params
    const entries = await TimeEntry.find({ task: taskId, deleted: false })
      .sort({ created: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: entries,
    })
  } catch (error: unknown) {
    console.error('[GET /api/tasks/[id]/time-entries]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/time-entries - Create a new time entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id: taskId } = await params
    const body = await request.json()

    // Validate task exists
    const task = await TaskModel.findById(taskId)
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Create time entry
    const entry = await TimeEntry.create({
      task: taskId,
      user: body.user,
      startTime: body.startTime,
      endTime: body.endTime,
      duration: body.duration,
      description: body.description || '',
    })

    // Update task's total tracked time
    const allEntries = await TimeEntry.find({ task: taskId, deleted: false })
    const totalSeconds = allEntries.reduce((sum, e) => sum + e.duration, 0)
    await TaskModel.findByIdAndUpdate(taskId, { timeTracked: totalSeconds })

    return NextResponse.json({
      success: true,
      data: entry,
    })
  } catch (error: unknown) {
    console.error('[POST /api/tasks/[id]/time-entries]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
