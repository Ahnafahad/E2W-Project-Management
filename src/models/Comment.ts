import mongoose, { Schema, Model } from 'mongoose'
import type { Comment } from '@/types'

const CommentSchema = new Schema<Comment>(
  {
    task: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    mentions: [{
      type: String,
    }],
    parent: {
      type: String, // For threaded replies
    },
    reactions: {
      type: Map,
      of: [String],
      default: {},
    },
    edited: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        (ret as any)._id = ret._id.toString()
        ret.created = (ret as any).createdAt
        ret.updated = (ret as any).updatedAt
        // Convert Map to Object for JSON
        if (ret.reactions instanceof Map) {
          ret.reactions = Object.fromEntries(ret.reactions)
        }
        delete (ret as any).createdAt
        delete (ret as any).updatedAt
        delete (ret as any).__v
        return ret
      },
    },
  }
)

// Indexes for performance
CommentSchema.index({ task: 1, deleted: 1, created: -1 })

const CommentModel: Model<Comment> =
  mongoose.models.Comment || mongoose.model<Comment>('Comment', CommentSchema)

export default CommentModel
