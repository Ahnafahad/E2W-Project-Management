import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

// GET /api/users - Get all users (with optional query filters)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const id = searchParams.get('id')

    const query: Record<string, unknown> = {}

    if (email) {
      query.email = email
    }

    if (id) {
      query._id = id
    }

    const users = await User.find(query).select('-password').lean()

    return NextResponse.json({
      success: true,
      data: users,
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error fetching users:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    }, { status: 500 })
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, name, password } = body

    // Validation
    if (!email || !name || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email, name, and password are required',
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists',
      }, { status: 409 })
    }

    // Create user (password will be hashed in the model pre-save hook if we add one)
    const user = await User.create({
      email,
      name,
      password, // Should be hashed before saving
      avatar: body.avatar,
      projectRoles: [],
    })

    // Return user without password
    const userObject = user.toJSON()
    delete userObject.password

    return NextResponse.json({
      success: true,
      data: userObject,
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating user:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    }, { status: 500 })
  }
}
