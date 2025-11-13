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

    // Create team members
    const hashedPassword = await bcrypt.hash('123456', 10)

    // Create admin user
    const adminUser = await User.create({
      email: 'hi@e2w.global',
      name: 'Admin',
      password: hashedPassword,
      projectRoles: [],
    })

    const ahnafAhad = await User.create({
      email: 'ahnaf816@gmail.com',
      name: 'Ahnaf Ahad',
      password: hashedPassword,
      projectRoles: [],
    })

    const tanzimAhmed = await User.create({
      email: 'tanzimahmedshofficial@gmail.com',
      name: 'Tanzim Ahmed',
      password: hashedPassword,
      projectRoles: [],
    })

    const fatihaFairuz = await User.create({
      email: 'fabihafairuz1502@gmail.com',
      name: 'Fabiha Fairuz',
      password: hashedPassword,
      projectRoles: [],
    })

    const annur = await User.create({
      email: 'annur',
      name: 'Annur',
      password: hashedPassword,
      projectRoles: [],
    })

    const sakib = await User.create({
      email: 'sakib',
      name: 'Sakib',
      password: hashedPassword,
      projectRoles: [],
    })

    // Use first team member as the primary user
    const demoUser = ahnafAhad

    // Create demo projects with all team members
    const allMembers = [
      adminUser._id.toString(),
      ahnafAhad._id.toString(),
      tanzimAhmed._id.toString(),
      fatihaFairuz._id.toString(),
      annur._id.toString(),
      sakib._id.toString(),
    ]

    const project1 = await Project.create({
      name: 'Website Redesign',
      description: 'Complete redesign of the company website with modern UI/UX',
      owner: ahnafAhad._id.toString(),
      members: allMembers,
    })

    const project2 = await Project.create({
      name: 'Mobile App Development',
      description: 'Native mobile app for iOS and Android platforms',
      owner: ahnafAhad._id.toString(),
      members: allMembers,
    })

    const project3 = await Project.create({
      name: 'Marketing Campaign',
      description: 'Q4 marketing campaign for product launch',
      owner: ahnafAhad._id.toString(),
      members: allMembers,
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
      assignees: [fatihaFairuz._id.toString()],
      creator: ahnafAhad._id.toString(),
      watchers: allMembers,
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
      assignees: [tanzimAhmed._id.toString(), ahnafAhad._id.toString()],
      creator: ahnafAhad._id.toString(),
      watchers: allMembers,
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
      assignees: [fatihaFairuz._id.toString(), tanzimAhmed._id.toString()],
      creator: ahnafAhad._id.toString(),
      watchers: allMembers,
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
          users: 6,
          projects: 3,
          tasks: 3,
          teamMembers: [
            { email: 'hi@e2w.global', password: '123456', name: 'Admin' },
            { email: 'ahnaf816@gmail.com', password: '123456', name: 'Ahnaf Ahad' },
            { email: 'tanzimahmedshofficial@gmail.com', password: '123456', name: 'Tanzim Ahmed' },
            { email: 'fabihafairuz1502@gmail.com', password: '123456', name: 'Fabiha Fairuz' },
            { email: 'annur', password: '123456', name: 'Annur' },
            { email: 'sakib', password: '123456', name: 'Sakib' },
          ],
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
