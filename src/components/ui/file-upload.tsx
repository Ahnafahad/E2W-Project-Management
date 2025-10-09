'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Upload,
  File,
  Image,
  FileText,
  Download,
  X,
  Paperclip
} from 'lucide-react'
import { formatBytes } from '@/lib/utils'

export interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  data: string // base64 encoded data
  uploadedAt: Date
  uploadedBy: string
}

interface FileUploadProps {
  files: FileAttachment[]
  onFilesChange: (files: FileAttachment[]) => void
  maxFiles?: number
  maxFileSize?: number // in bytes
  acceptedTypes?: string[]
  compact?: boolean
}

export function FileUpload({
  files,
  onFilesChange,
  maxFiles = 10,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['*'],
  compact = false
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-4 h-4" />
    } else if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) {
      return <FileText className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File "${file.name}" is too large. Maximum size is ${formatBytes(maxFileSize)}`
    }

    if (acceptedTypes.length > 0 && !acceptedTypes.includes('*')) {
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1))
        }
        return file.type === type
      })

      if (!isAccepted) {
        return `File type "${file.type}" is not accepted`
      }
    }

    return null
  }

  const processFiles = async (fileList: FileList) => {
    setError('')
    setUploading(true)

    try {
      const newFiles: FileAttachment[] = []

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]

        // Validate file
        const validationError = validateFile(file)
        if (validationError) {
          setError(validationError)
          continue
        }

        // Check if we're exceeding max files
        if (files.length + newFiles.length >= maxFiles) {
          setError(`Maximum ${maxFiles} files allowed`)
          break
        }

        // Convert to base64
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        const fileAttachment: FileAttachment = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64Data,
          uploadedAt: new Date(),
          uploadedBy: localStorage.getItem('e2w_current_user') ?
            JSON.parse(localStorage.getItem('e2w_current_user')!)._id : 'unknown'
        }

        newFiles.push(fileAttachment)
      }

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles])
      }
    } catch (error) {
      setError('Failed to upload files')
      console.error('File upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  const removeFile = (fileId: string) => {
    onFilesChange(files.filter(file => file.id !== fileId))
  }

  const downloadFile = (file: FileAttachment) => {
    const link = document.createElement('a')
    link.href = file.data
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || files.length >= maxFiles}
          >
            <Paperclip className="w-4 h-4 mr-1" />
            Attach
          </Button>
          {files.length > 0 && (
            <span className="text-xs text-gray-500">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
        />

        {files.length > 0 && (
          <div className="space-y-1">
            {files.map(file => (
              <div key={file.id} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1">
                {getFileIcon(file.type)}
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-gray-500">{formatBytes(file.size)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-brand-gold bg-brand-gold/10'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-600" />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">Upload files</h3>
                <p className="text-sm text-gray-500">
                  Drag and drop files here, or{' '}
                  <button
                    type="button"
                    className="text-brand-gold hover:underline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    browse
                  </button>
                </p>
              </div>

              <div className="text-xs text-gray-400">
                Maximum {maxFiles} files, {formatBytes(maxFileSize)} each
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept={acceptedTypes.join(',')}
          />

          {uploading && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Uploading files...
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Attached files ({files.length})
            </h4>
            <div className="space-y-2">
              {files.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatBytes(file.size)} • Uploaded {file.uploadedAt.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}