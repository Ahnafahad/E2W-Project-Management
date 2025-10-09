import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id } = await params

    const user = await User.findById(id).select('-password').lean()

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: user,
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error fetching user:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user',
    }, { status: 500 })
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id } = await params

    const body = await request.json()

    // Remove sensitive fields that shouldn't be updated this way
    delete body.password
    delete body._id
    delete body.created

    const user = await User.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).select('-password').lean()

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: user,
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error updating user:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB()

    const { id } = await params

    const user = await User.findByIdAndDelete(id)

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error deleting user:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    }, { status: 500 })
  }
}
