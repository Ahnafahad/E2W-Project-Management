import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import UserModel from '@/models/User'
import ProjectModel from '@/models/Project'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// POST /api/ocf/setup
// Idempotent — safe to call multiple times.
// Creates Abdullah (ocf_only) and the OCF project if they don't exist yet.
export async function POST() {
  try {
    await connectDB()

    const ABDULLAH_EMAIL = 'abdullah.26nasir@gmail.com'
    const OCF_PROJECT_NAME = 'Oxford Cambridge Fellowship'

    // --- User ---
    let user = await UserModel.findOne({ email: ABDULLAH_EMAIL })
    let userCreated = false

    if (!user) {
      const hashed = await bcrypt.hash('123456', 10)
      user = await UserModel.create({
        email: ABDULLAH_EMAIL,
        name: 'Abdullah',
        password: hashed,
        accessMode: 'ocf_only',
        projectRoles: [],
      })
      userCreated = true
    }

    // --- Project ---
    let project = await ProjectModel.findOne({ isOCF: true, deleted: { $ne: true } })
    let projectCreated = false

    if (!project) {
      project = await ProjectModel.create({
        name: OCF_PROJECT_NAME,
        description: 'Oxford Cambridge Fellowship project',
        owner: user._id.toString(),
        members: [user._id.toString()],
        isOCF: true,
      })
      projectCreated = true
    }

    return NextResponse.json({
      success: true,
      message: 'OCF setup complete',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        accessMode: user.accessMode,
        created: userCreated,
      },
      project: {
        id: project._id.toString(),
        name: project.name,
        isOCF: project.isOCF,
        created: projectCreated,
      },
    })
  } catch (error: unknown) {
    console.error('OCF setup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'OCF setup failed',
      },
      { status: 500 }
    )
  }
}
