import mongoose, { Schema, Model } from 'mongoose'
import type { ProjectStats, TaskStatus, TaskPriority } from '@/types'

const ProjectStatsSchema = new Schema<ProjectStats>(
  {
    project: {
      type: String,
      required: true,
      unique: true,
    },
    totalTasks: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    overdueTasks: {
      type: Number,
      default: 0,
    },
    tasksByStatus: {
      TODO: { type: Number, default: 0 },
      IN_PROGRESS: { type: Number, default: 0 },
      DONE: { type: Number, default: 0 },
      BLOCKED: { type: Number, default: 0 },
    },
    tasksByPriority: {
      LOW: { type: Number, default: 0 },
      MEDIUM: { type: Number, default: 0 },
      HIGH: { type: Number, default: 0 },
      URGENT: { type: Number, default: 0 },
    },
    avgCompletionTime: {
      type: Number, // in days
      default: 0,
    },
    velocityLastWeek: {
      type: Number, // tasks completed
      default: 0,
    },
    lastUpdated: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: (doc, ret) => {
        ret._id = ret._id.toString()
        delete ret.__v
        return ret
      },
    },
  }
)

// Index on project for fast lookups
// Note: project index is automatically created by unique: true

const ProjectStatsModel: Model<ProjectStats> =
  mongoose.models.ProjectStats ||
  mongoose.model<ProjectStats>('ProjectStats', ProjectStatsSchema)

export default ProjectStatsModel
