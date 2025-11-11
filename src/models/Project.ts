import mongoose, { Schema, Model } from 'mongoose'
import type { Project } from '@/types'

const ProjectSchema = new Schema<Project>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    owner: {
      type: String,
      required: true,
    },
    members: [{
      type: String,
    }],
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret._id = (ret._id as mongoose.Types.ObjectId).toString()
        ret.created = ret.createdAt
        ret.updated = ret.updatedAt
        delete ret.createdAt
        delete ret.updatedAt
        delete ret.__v
        return ret
      },
    },
  }
)

// Indexes for performance
ProjectSchema.index({ owner: 1, deleted: 1 })
ProjectSchema.index({ members: 1, deleted: 1 })

const ProjectModel: Model<Project> =
  mongoose.models.Project || mongoose.model<Project>('Project', ProjectSchema)

export default ProjectModel
