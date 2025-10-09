import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Comment, Task } from '@/models'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// PATCH /api/comments/[id] - Update comment
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id } = await params

    const body = await request.json()
    const { content, reactions } = body

    const updates: Record<string, unknown> = {
      updated: new Date(),
      edited: true,
    }

    if (content) {
      updates.content = content
    }

    if (reactions !== undefined) {
      updates.reactions = reactions
    }

    const comment = await Comment.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).lean()

    if (!comment) {
      return NextResponse.json({
        success: false,
        error: 'Comment not found',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: comment,
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error updating comment:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update comment',
    }, { status: 500 })
  }
}

// DELETE /api/comments/[id] - Soft delete comment
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id } = await params

    const comment = await Comment.findByIdAndUpdate(
      id,
      { deleted: true, updated: new Date() },
      { new: true }
    )

    if (!comment) {
      return NextResponse.json({
        success: false,
        error: 'Comment not found',
      }, { status: 404 })
    }

    // Update task comment count
    await Task.findByIdAndUpdate(comment.task, {
      $inc: { commentCount: -1 }
    })

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete comment',
    }, { status: 500 })
  }
}
