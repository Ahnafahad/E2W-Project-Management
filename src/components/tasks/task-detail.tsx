'use client'

import { useState, useEffect } from 'react'
import { Task, Comment } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommentApi, TaskApi, UserApi } from '@/lib/api'
import { useAuth } from '@/lib/context'
import { formatRelativeTime, getInitials, formatBytes } from '@/lib/utils'
import { TimeTracker } from '@/components/tasks/time-tracker'
import {
  X,
  MessageSquare,
  Send,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Smile,
  MoreHorizontal,
  Edit,
  Trash2,
  Reply,
  Paperclip,
  Download,
  File,
  Image,
  FileText
} from 'lucide-react'

interface TaskDetailProps {
  task: Task
  onClose: () => void
  onTaskUpdate: (task: Task) => void
}

interface CommentProps {
  comment: Comment
  onUpdate: () => void
  level?: number
}

function CommentComponent({ comment, onUpdate, level = 0 }: CommentProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [showMenu, setShowMenu] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [author, setAuthor] = useState<any>(null)

  useEffect(() => {
    const loadAuthor = async () => {
      const authorData = await UserApi.getById(comment.author)
      setAuthor(authorData)
    }
    loadAuthor()
  }, [comment.author])

  const isOwner = user?._id === comment.author
  const canEdit = isOwner && !comment.deleted
  const canDelete = isOwner && !comment.deleted

  const handleEdit = async () => {
    if (!editContent.trim()) return

    await CommentApi.update(comment._id, { content: editContent.trim() })
    setIsEditing(false)
    onUpdate()
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await CommentApi.delete(comment._id)
      onUpdate()
    }
    setShowMenu(false)
  }

  const handleReply = async () => {
    if (!replyContent.trim() || !user) return

    await CommentApi.create(comment.task, {
      content: replyContent.trim(),
      author: user._id,
      parent: comment._id,
      mentions: [],
    })

    setReplyContent('')
    setIsReplying(false)
    onUpdate()
  }

  const handleReaction = async (type: string) => {
    if (!user) return

    const reactions = { ...comment.reactions }
    if (!reactions[type]) reactions[type] = []

    const userIndex = reactions[type].indexOf(user._id)
    if (userIndex > -1) {
      reactions[type].splice(userIndex, 1)
      if (reactions[type].length === 0) delete reactions[type]
    } else {
      reactions[type].push(user._id)
    }

    await CommentApi.update(comment._id, { reactions })
    onUpdate()
  }

  if (comment.deleted) {
    return (
      <div className={`text-sm text-gray-400 italic py-2 ${level > 0 ? 'ml-8' : ''}`}>
        Comment deleted
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${level > 0 ? 'ml-8 pl-4 border-l-2 border-gray-100' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-4">
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-mint rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-brand-charcoal">
                {author ? getInitials(author.name) : 'U'}
              </span>
            </div>
            <div>
              <div className="font-medium text-sm text-gray-900">
                {author?.name || 'Unknown User'}
              </div>
              <div className="text-xs text-gray-500">
                {formatRelativeTime(new Date(comment.created))}
                {comment.edited && <span className="ml-1">(edited)</span>}
              </div>
            </div>
          </div>

          {/* Comment Menu */}
          {(canEdit || canDelete) && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>

              {showMenu && (
                <>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-24">
                    {canEdit && (
                      <button
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-t-lg"
                        onClick={() => {
                          setIsEditing(true)
                          setShowMenu(false)
                        }}
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                        onClick={handleDelete}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                  </div>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 text-sm border border-gray-200 rounded-md resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEdit}>
                Save
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(comment.content)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {comment.content}
          </div>
        )}

        {/* Reactions */}
        {Object.keys(comment.reactions).length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
            {Object.entries(comment.reactions).map(([type, users]) => (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                  user && users.includes(user._id)
                    ? 'bg-brand-gold text-brand-charcoal'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {type === 'like' && <ThumbsUp className="w-3 h-3" />}
                {type === 'love' && <Heart className="w-3 h-3" />}
                {type === 'dislike' && <ThumbsDown className="w-3 h-3" />}
                <span>{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Comment Actions */}
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-200">
          <button
            onClick={() => handleReaction('like')}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <ThumbsUp className="w-3 h-3" />
            Like
          </button>
          <button
            onClick={() => handleReaction('love')}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <Heart className="w-3 h-3" />
            Love
          </button>
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <Reply className="w-3 h-3" />
            Reply
          </button>
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-2 text-sm border border-gray-200 rounded-md resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply}>
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setIsReplying(false)
                    setReplyContent('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function TaskDetail({ task, onClose, onTaskUpdate }: TaskDetailProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadComments = async () => {
    const taskComments = await CommentApi.getByTask(task._id)
    setComments(taskComments)
  }

  useEffect(() => {
    loadComments()
  }, [task._id])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user || isSubmitting) return

    setIsSubmitting(true)
    try {
      await CommentApi.create(task._id, {
        content: newComment.trim(),
        author: user._id,
        mentions: [],
      })

      setNewComment('')
      await loadComments()

      // Update task in parent component
      const updatedTask = await TaskApi.getById(task._id)
      if (updatedTask) {
        onTaskUpdate(updatedTask)
      }
    } catch (error) {
      console.error('Failed to create comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Group comments by threads
  const topLevelComments = comments.filter(comment => !comment.parent)
  const replies = comments.filter(comment => comment.parent)

  const getCommentReplies = (commentId: string) => {
    return replies.filter(reply => reply.parent === commentId)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="text-lg">Task Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task Info */}
            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
              {task.description && (
                <p className="text-gray-600">{task.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Status: {task.status.replace('_', ' ')}</span>
                <span>Priority: {task.priority}</span>
                {task.dates.due && (
                  <span>Due: {formatRelativeTime(new Date(task.dates.due))}</span>
                )}
              </div>
            </div>

            {/* File Attachments Section */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Paperclip className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-medium">Attachments ({task.attachments.length})</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {task.attachments.map((attachment) => {
                    const getFileIcon = (fileType: string) => {
                      if (fileType.startsWith('image/')) {
                        return <Image className="w-4 h-4" />
                      } else if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) {
                        return <FileText className="w-4 h-4" />
                      }
                      return <File className="w-4 h-4" />
                    }

                    const downloadFile = () => {
                      const link = document.createElement('a')
                      link.href = attachment.data
                      link.download = attachment.name
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }

                    return (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {getFileIcon(attachment.type)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {attachment.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatBytes(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={downloadFile}
                          className="shrink-0"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-medium">Comments ({comments.length})</h3>
              </div>

              {/* New Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!newComment.trim() || isSubmitting}
                      className="flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {topLevelComments.length > 0 ? (
                  topLevelComments.map(comment => (
                    <div key={comment._id}>
                      <CommentComponent
                        comment={comment}
                        onUpdate={loadComments}
                      />
                      {/* Replies */}
                      {getCommentReplies(comment._id).map(reply => (
                        <CommentComponent
                          key={reply._id}
                          comment={reply}
                          onUpdate={loadComments}
                          level={1}
                        />
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3" />
                    <p>No comments yet</p>
                    <p className="text-sm">Be the first to add a comment</p>
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <TimeTracker task={task} onUpdate={onTaskUpdate} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}