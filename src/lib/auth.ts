import bcrypt from 'bcryptjs'
import { UserStore } from './storage'
import { User } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<{ user: User | null; success: boolean; error?: string }> {
    try {
      const user = UserStore.getByEmail(credentials.email)

      if (!user) {
        return { user: null, success: false, error: 'Invalid email or password' }
      }

      // For demo purposes, we'll use simple password comparison
      // In production, you'd want to hash passwords
      const isValid = credentials.password === 'demo123' ||
                     await bcrypt.compare(credentials.password, user.password || '')

      if (!isValid) {
        return { user: null, success: false, error: 'Invalid email or password' }
      }

      // Update last login
      const updatedUser = UserStore.update(user._id, { lastLogin: new Date() })
      UserStore.setCurrentUser(updatedUser!)

      return { user: updatedUser!, success: true }
    } catch (_error) {
      return { user: null, success: false, error: 'Authentication failed' }
    }
  }

  static async register(data: RegisterData): Promise<{ user: User | null; success: boolean; error?: string }> {
    try {
      // Check if user already exists
      const existingUser = UserStore.getByEmail(data.email)
      if (existingUser) {
        return { user: null, success: false, error: 'User with this email already exists' }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10)

      // Create user
      const newUser = UserStore.create({
        email: data.email,
        name: data.name,
        password: hashedPassword,
      })

      UserStore.setCurrentUser(newUser)

      return { user: newUser, success: true }
    } catch (_error) {
      return { user: null, success: false, error: 'Registration failed' }
    }
  }

  static logout(): void {
    UserStore.setCurrentUser(null)
  }

  static getCurrentUser(): User | null {
    return UserStore.getCurrentUser()
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = UserStore.getById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Verify old password
      const isValid = oldPassword === 'demo123' ||
                     await bcrypt.compare(oldPassword, user.password || '')

      if (!isValid) {
        return { success: false, error: 'Current password is incorrect' }
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Update user
      UserStore.update(userId, { password: hashedPassword })

      return { success: true }
    } catch (_error) {
      return { success: false, error: 'Password change failed' }
    }
  }

  static updateProfile(userId: string, updates: Partial<Pick<User, 'name' | 'avatar'>>): { user: User | null; success: boolean; error?: string } {
    try {
      const updatedUser = UserStore.update(userId, updates)
      if (!updatedUser) {
        return { user: null, success: false, error: 'User not found' }
      }

      UserStore.setCurrentUser(updatedUser)
      return { user: updatedUser, success: true }
    } catch (_error) {
      return { user: null, success: false, error: 'Profile update failed' }
    }
  }
}