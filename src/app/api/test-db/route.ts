import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { User, Project, Task } from '@/models'

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB()

    // Count documents in each collection
    const userCount = await User.countDocuments()
    const projectCount = await Project.countDocuments()
    const taskCount = await Task.countDocuments()

    // Get database stats
    const stats = {
      status: 'Connected ✅',
      database: 'e2w-pm',
      collections: {
        users: userCount,
        projects: projectCount,
        tasks: taskCount,
      },
      message: 'MongoDB Atlas connection successful!',
    }

    return NextResponse.json(stats, { status: 200 })
  } catch (error: unknown) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      {
        status: 'Failed ❌',
        error: error instanceof Error ? error.message : "Unknown error",
        message: 'Could not connect to MongoDB',
      },
      { status: 500 }
    )
  }
}
