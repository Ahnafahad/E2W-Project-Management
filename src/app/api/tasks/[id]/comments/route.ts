import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Comment, Task } from '@/models'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/tasks/[id]/comments - Get all comments for a task
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id: taskId } = await params

    const comments = await Comment.find({
      task: taskId,
      deleted: { $ne: true }
    }).sort({ created: 1 }).lean()

    return NextResponse.json({
      success: true,
      data: comments,
      count: comments.length,
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch comments',
    }, { status: 500 })
  }
}

// POST /api/tasks/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id: taskId } = await params
    const body = await request.json()
    const { content, author, mentions = [], parent } = body

    // Validation
    if (!content || !author) {
      return NextResponse.json({
        success: false,
        error: 'Content and author are required',
      }, { status: 400 })
    }

    // Check if task exists
    const task = await Task.findById(taskId)
    if (!task) {
      return NextResponse.json({
        success: false,
        error: 'Task not found',
      }, { status: 404 })
    }

    // Create comment
    const comment = await Comment.create({
      task: taskId,
      author,
      content,
      mentions,
      parent,
      reactions: {},
      edited: false,
    })

    // Update task comment count
    await Task.findByIdAndUpdate(taskId, {
      $inc: { commentCount: 1 }
    })

    return NextResponse.json({
      success: true,
      data: comment,
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating comment:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create comment',
    }, { status: 500 })
  }
}
