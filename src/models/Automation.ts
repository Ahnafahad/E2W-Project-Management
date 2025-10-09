import mongoose, { Schema, Model } from 'mongoose'
import type { Automation } from '@/types'

const AutomationSchema = new Schema<Automation>(
  {
    name: {
      type: String,
      required: true,
    },
    project: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    trigger: {
      type: {
        type: String,
        required: true,
      },
      config: {
        type: Schema.Types.Mixed,
        required: true,
      },
    },
    conditions: [
      {
        field: { type: String, required: true },
        operator: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true },
      },
    ],
    actions: [
      {
        type: { type: String, required: true },
        config: { type: Schema.Types.Mixed, required: true },
      },
    ],
    lastRun: {
      type: Date,
    },
    runCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret._id = ret._id.toString()
        delete ret.__v
        delete ret.createdAt
        delete ret.updatedAt
        return ret
      },
    },
  }
)

// Indexes for performance
AutomationSchema.index({ project: 1, enabled: 1 })
AutomationSchema.index({ 'trigger.type': 1, enabled: 1 })

const AutomationModel: Model<Automation> =
  mongoose.models.Automation ||
  mongoose.model<Automation>('Automation', AutomationSchema)

export default AutomationModel
