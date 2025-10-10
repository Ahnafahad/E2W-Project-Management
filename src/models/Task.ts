import mongoose, { Schema, Model } from 'mongoose'
import type { Task, TaskStatus, TaskPriority, Attachment, RecurringConfig } from '@/types'

const AttachmentSchema = new Schema<Attachment>(
  {
    fileId: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false }
)

const RecurringConfigSchema = new Schema<RecurringConfig>(
  {
    enabled: { type: Boolean, required: true },
    frequency: { type: String, required: true },
    interval: { type: Number, required: true },
    endDate: { type: Date },
  },
  { _id: false }
)

const TaskSchema = new Schema<Task>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 500,
    },
    description: {
      type: String,
      maxlength: 10000,
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'],
      default: 'TODO',
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      required: true,
    },
    priorityRank: {
      type: Number, // Global ranking (1 = highest priority)
    },
    assignees: [{
      type: String,
    }],
    creator: {
      type: String,
      required: true,
    },
    watchers: [{
      type: String,
    }],
    project: {
      type: String,
      required: true,
    },
    parent: {
      type: String,
    },
    dependencies: [{
      type: String,
    }],
    tags: [{
      type: String,
      maxlength: 50,
    }],
    customFields: {
      type: Schema.Types.Mixed,
    },
    dates: {
      created: { type: Date, required: true },
      updated: { type: Date, required: true },
      due: { type: Date },
      start: { type: Date },
      completed: { type: Date },
    },
    timeEstimate: {
      type: Number, // minutes
    },
    timeTracked: {
      type: Number, // minutes
      default: 0,
    },
    attachments: [AttachmentSchema],
    commentCount: {
      type: Number,
      default: 0,
    },
    recurring: RecurringConfigSchema,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: false, // We manage dates manually
    toJSON: {
      transform: (doc, ret) => {
        (ret as any)._id = ret._id.toString()
        delete (ret as any).__v
        return ret
      },
    },
  }
)

// Indexes for performance (as per technical spec)
TaskSchema.index({ project: 1, deleted: 1, status: 1 })
TaskSchema.index({ assignees: 1, deleted: 1 })
TaskSchema.index({ creator: 1, deleted: 1 }) // For "my tasks" queries
TaskSchema.index({ 'dates.due': 1, deleted: 1 })
TaskSchema.index({ 'dates.created': -1 })

const TaskModel: Model<Task> =
  mongoose.models.Task || mongoose.model<Task>('Task', TaskSchema)

export default TaskModel
