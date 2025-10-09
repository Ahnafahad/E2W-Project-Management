import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Project, Task, ProjectStats } from '@/models'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/projects/[id] - Get project by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id } = await params

    const project = await Project.findById(id).lean()

    if (!project || project.deleted) {
      return NextResponse.json({
        success: false,
        error: 'Project not found',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: project,
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error fetching project:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project',
    }, { status: 500 })
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id } = await params

    const body = await request.json()

    // Remove fields that shouldn't be updated directly
    delete body._id
    delete body.created

    const project = await Project.findByIdAndUpdate(
      id,
      { ...body, updated: new Date() },
      { new: true, runValidators: true }
    ).lean()

    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: project,
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error updating project:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Soft delete project
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id } = await params

    // Soft delete project
    const project = await Project.findByIdAndUpdate(
      id,
      { deleted: true, updated: new Date() },
      { new: true }
    )

    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found',
      }, { status: 404 })
    }

    // Soft delete all tasks in project
    await Task.updateMany(
      { project: id },
      { deleted: true, deletedAt: new Date() }
    )

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error deleting project:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    }, { status: 500 })
  }
}
