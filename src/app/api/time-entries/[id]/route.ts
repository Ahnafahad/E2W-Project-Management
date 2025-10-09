import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { TimeEntry } from '@/models/TimeEntry'
import TaskModel from '@/models/Task'

// PATCH /api/time-entries/[id] - Update a time entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id: entryId } = await params
    const body = await request.json()

    const entry = await TimeEntry.findByIdAndUpdate(
      entryId,
      { $set: body },
      { new: true, runValidators: true }
    )

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Time entry not found' },
        { status: 404 }
      )
    }

    // Update task's total tracked time if duration changed
    if (body.duration !== undefined) {
      const allEntries = await TimeEntry.find({ task: entry.task, deleted: false })
      const totalSeconds = allEntries.reduce((sum, e) => sum + e.duration, 0)
      await TaskModel.findByIdAndUpdate(entry.task, { timeTracked: totalSeconds })
    }

    return NextResponse.json({
      success: true,
      data: entry,
    })
  } catch (error: unknown) {
    console.error('[PATCH /api/time-entries/[id]]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// DELETE /api/time-entries/[id] - Delete a time entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id: entryId } = await params
    const entry = await TimeEntry.findById(entryId)

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Time entry not found' },
        { status: 404 }
      )
    }

    const taskId = entry.task

    // Soft delete
    await TimeEntry.findByIdAndUpdate(entryId, { deleted: true })

    // Update task's total tracked time
    const allEntries = await TimeEntry.find({ task: taskId, deleted: false })
    const totalSeconds = allEntries.reduce((sum, e) => sum + e.duration, 0)
    await TaskModel.findByIdAndUpdate(taskId, { timeTracked: totalSeconds })

    return NextResponse.json({
      success: true,
      data: { message: 'Time entry deleted' },
    })
  } catch (error: unknown) {
    console.error('[DELETE /api/time-entries/[id]]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
