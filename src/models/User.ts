import mongoose, { Schema, Model } from 'mongoose'
import type { User, ProjectRole } from '@/types'

const ProjectRoleSchema = new Schema<ProjectRole>(
  {
    project: { type: String, required: true },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
      required: true,
    },
  },
  { _id: false }
)

const UserSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    projectRoles: [ProjectRoleSchema],
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret._id = (ret._id as mongoose.Types.ObjectId).toString()
        ret.created = ret.createdAt
        delete ret.createdAt
        delete ret.updatedAt
        delete ret.__v
        return ret
      },
    },
  }
)

// Indexes for performance
// Note: email index is automatically created by unique: true

// Prevent model recompilation in development
const UserModel: Model<User> =
  mongoose.models.User || mongoose.model<User>('User', UserSchema)

export default UserModel
