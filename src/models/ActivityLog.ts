import mongoose, { Schema, Model } from 'mongoose'
import type { ActivityLog } from '@/types'

const ActivityLogSchema = new Schema<ActivityLog>(
  {
    user: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: 'created', updatedAt: false },
    toJSON: {
      transform: (doc, ret) => {
        (ret as any)._id = ret._id.toString()
        delete (ret as any).__v
        return ret
      },
    },
  }
)

// Indexes for performance
ActivityLogSchema.index({ user: 1, created: -1 })
ActivityLogSchema.index({ 'details.projectId': 1, created: -1 })

const ActivityLogModel: Model<ActivityLog> =
  mongoose.models.ActivityLog ||
  mongoose.model<ActivityLog>('ActivityLog', ActivityLogSchema)

export default ActivityLogModel
