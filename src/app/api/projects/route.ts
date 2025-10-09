import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Project, ProjectStats } from '@/models'

// GET /api/projects - Get all projects (with filters)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    const query: Record<string, unknown> = {}

    if (!includeDeleted) {
      query.deleted = { $ne: true }
    }

    if (userId) {
      query.$or = [
        { owner: userId },
        { members: userId }
      ]
    }

    const projects = await Project.find(query).sort({ updated: -1 }).lean()

    return NextResponse.json({
      success: true,
      data: projects,
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
    }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { name, description, owner, members } = body

    // Validation
    if (!name || !owner) {
      return NextResponse.json({
        success: false,
        error: 'Name and owner are required',
      }, { status: 400 })
    }

    // Create project
    const project = await Project.create({
      name,
      description,
      owner,
      members: members || [owner], // Owner is always a member
    })

    // Create initial project stats
    await ProjectStats.create({
      project: project._id.toString(),
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      tasksByStatus: {
        TODO: 0,
        IN_PROGRESS: 0,
        DONE: 0,
        BLOCKED: 0,
      },
      tasksByPriority: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        URGENT: 0,
      },
      avgCompletionTime: 0,
      velocityLastWeek: 0,
      lastUpdated: new Date(),
    })

    return NextResponse.json({
      success: true,
      data: project,
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating project:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    }, { status: 500 })
  }
}
