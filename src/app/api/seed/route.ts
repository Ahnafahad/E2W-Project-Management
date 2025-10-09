import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { User, Project, Task, ProjectStats } from '@/models'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Check if data already exists
    const existingUsers = await User.countDocuments()
    if (existingUsers > 0) {
      return NextResponse.json(
        {
          message: 'Database already has data. Delete existing data first if you want to re-seed.',
          userCount: existingUsers,
        },
        { status: 400 }
      )
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10)
    const demoUser = await User.create({
      email: 'demo@e2w.global',
      name: 'John Doe',
      password: hashedPassword,
      avatar: '/E2W Black Logo.png',
      projectRoles: [],
    })

    // Create demo projects
    const project1 = await Project.create({
      name: 'Website Redesign',
      description: 'Complete redesign of the company website with modern UI/UX',
      owner: demoUser._id.toString(),
      members: [demoUser._id.toString()],
    })

    const project2 = await Project.create({
      name: 'Mobile App Development',
      description: 'Native mobile app for iOS and Android platforms',
      owner: demoUser._id.toString(),
      members: [demoUser._id.toString()],
    })

    const project3 = await Project.create({
      name: 'Marketing Campaign',
      description: 'Q4 marketing campaign for product launch',
      owner: demoUser._id.toString(),
      members: [demoUser._id.toString()],
    })

    // Create demo tasks
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    await Task.create({
      title: 'Design new landing page',
      description: 'Create wireframes and mockups for the new landing page',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      project: project1._id.toString(),
      assignees: [demoUser._id.toString()],
      creator: demoUser._id.toString(),
      watchers: [demoUser._id.toString()],
      tags: ['design', 'ui'],
      dates: {
        created: now,
        updated: now,
        due: tomorrow,
      },
      attachments: [],
      dependencies: [],
    })

    await Task.create({
      title: 'Implement user authentication',
      description: 'Set up secure user authentication system',
      status: 'TODO',
      priority: 'URGENT',
      project: project2._id.toString(),
      assignees: [demoUser._id.toString()],
      creator: demoUser._id.toString(),
      watchers: [demoUser._id.toString()],
      tags: ['backend', 'security'],
      dates: {
        created: now,
        updated: now,
        due: now,
      },
      attachments: [],
      dependencies: [],
    })

    await Task.create({
      title: 'Create marketing materials',
      description: 'Design brochures, flyers, and digital assets',
      status: 'DONE',
      priority: 'MEDIUM',
      project: project3._id.toString(),
      assignees: [demoUser._id.toString()],
      creator: demoUser._id.toString(),
      watchers: [demoUser._id.toString()],
      tags: ['marketing', 'design'],
      dates: {
        created: yesterday,
        updated: now,
        due: yesterday,
        completed: now,
      },
      attachments: [],
      dependencies: [],
    })

    // Create project stats for each project
    await ProjectStats.create({
      project: project1._id.toString(),
      totalTasks: 1,
      completedTasks: 0,
      overdueTasks: 0,
      tasksByStatus: { TODO: 0, IN_PROGRESS: 1, DONE: 0, BLOCKED: 0 },
      tasksByPriority: { LOW: 0, MEDIUM: 0, HIGH: 1, URGENT: 0 },
      avgCompletionTime: 0,
      velocityLastWeek: 0,
      lastUpdated: now,
    })

    await ProjectStats.create({
      project: project2._id.toString(),
      totalTasks: 1,
      completedTasks: 0,
      overdueTasks: 1,
      tasksByStatus: { TODO: 1, IN_PROGRESS: 0, DONE: 0, BLOCKED: 0 },
      tasksByPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 1 },
      avgCompletionTime: 0,
      velocityLastWeek: 0,
      lastUpdated: now,
    })

    await ProjectStats.create({
      project: project3._id.toString(),
      totalTasks: 1,
      completedTasks: 1,
      overdueTasks: 0,
      tasksByStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 1, BLOCKED: 0 },
      tasksByPriority: { LOW: 0, MEDIUM: 1, HIGH: 0, URGENT: 0 },
      avgCompletionTime: 1,
      velocityLastWeek: 1,
      lastUpdated: now,
    })

    return NextResponse.json(
      {
        message: '✅ Database seeded successfully!',
        data: {
          users: 1,
          projects: 3,
          tasks: 3,
          demoUser: {
            email: 'demo@e2w.global',
            password: 'demo123',
          },
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Seed error:', error)
    return NextResponse.json(
      {
        message: 'Failed to seed database',
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// DELETE endpoint to clear all data
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    await User.deleteMany({})
    await Project.deleteMany({})
    await Task.deleteMany({})
    await ProjectStats.deleteMany({})

    return NextResponse.json(
      {
        message: '✅ Database cleared successfully!',
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Clear error:', error)
    return NextResponse.json(
      {
        message: 'Failed to clear database',
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
