import mongoose, { Schema, model, models } from 'mongoose'

export interface ITimeEntry extends Document {
  _id: string
  task: string
  user: string
  startTime: Date
  endTime?: Date
  duration: number // in seconds
  description: string
  created: Date
  updated: Date
  deleted: boolean
}

const TimeEntrySchema = new Schema<ITimeEntry>(
  {
    task: {
      type: String,
      required: true,
      ref: 'Task',
    },
    user: {
      type: String,
      required: true,
      ref: 'User',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created', updatedAt: 'updated' },
  }
)

TimeEntrySchema.index({ task: 1, deleted: 1 })
TimeEntrySchema.index({ user: 1, deleted: 1 })

export const TimeEntry = models.TimeEntry || model<ITimeEntry>('TimeEntry', TimeEntrySchema)
