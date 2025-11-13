'use client'

import { useState, useEffect } from 'react'

export default function TestTaskUpdatePage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      const data = await response.json()

      if (data.success) {
        setTasks(data.data)
        setMessage(`Loaded ${data.data.length} tasks successfully`)
      } else {
        setError(`Failed to load tasks: ${data.error}`)
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      setLoading(true)
      setError('')
      setMessage(`Updating task ${taskId} to ${newStatus}...`)

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`✅ Successfully updated task to ${newStatus}!`)
        // Refresh tasks
        await fetchTasks()
      } else {
        setError(`❌ API Error: ${data.error}`)
      }
    } catch (err: any) {
      setError(`❌ Network Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Task Update Diagnostic Page</h1>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-4">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded-lg mb-4">
          Loading...
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Tasks:</h2>

        {tasks.map((task) => (
          <div
            key={task._id}
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{task.title}</h3>
                <p className="text-sm text-gray-600">ID: {task._id}</p>
                <p className="text-sm mt-1">
                  Current Status: <span className="font-medium">{task.status}</span>
                </p>
                <p className="text-sm">
                  Priority: <span className="font-medium">{task.priority}</span>
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateTaskStatus(task._id, status)}
                    disabled={loading || task.status === status}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      task.status === status
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {status === task.status ? `✓ ${status}` : `→ ${status}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {tasks.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-8">
            No tasks found. Please create some tasks first.
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
          <li>This page tests the task status update functionality directly</li>
          <li>Click any status button to update a task</li>
          <li>Watch for success/error messages above</li>
          <li>The task list will refresh after each update</li>
          <li>Check browser console (F12) for additional debug information</li>
        </ul>
      </div>
    </div>
  )
}
