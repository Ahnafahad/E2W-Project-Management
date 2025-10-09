import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, password, name } = body

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json({
        success: false,
        error: 'Email, password, and name are required',
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      projectRoles: [],
    })

    // Return user without password
    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      created: new Date(),
    }

    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'User registered successfully',
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Registration error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register user',
    }, { status: 500 })
  }
}
