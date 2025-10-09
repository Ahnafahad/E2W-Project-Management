'use client'

import { useState } from 'react'
import Link from 'next/link'

type ResultType = {
  type: 'test' | 'seed' | 'clear' | 'error'
  data: Record<string, unknown>
  status?: number
} | null

export default function SetupPage() {
  const [testing, setTesting] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [result, setResult] = useState<ResultType>(null)

  const testConnection = async () => {
    setTesting(true)
    setResult(null)
    try {
      const res = await fetch('/api/test-db')
      const data = await res.json()
      setResult({ type: 'test', data })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setResult({ type: 'error', data: { error: errorMessage } })
    }
    setTesting(false)
  }

  const seedDatabase = async () => {
    setSeeding(true)
    setResult(null)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      setResult({ type: 'seed', data, status: res.status })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setResult({ type: 'error', data: { error: errorMessage } })
    }
    setSeeding(false)
  }

  const clearDatabase = async () => {
    if (!confirm('Are you sure you want to clear ALL data from MongoDB?')) {
      return
    }
    setClearing(true)
    setResult(null)
    try {
      const res = await fetch('/api/seed', { method: 'DELETE' })
      const data = await res.json()
      setResult({ type: 'clear', data })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setResult({ type: 'error', data: { error: errorMessage } })
    }
    setClearing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MongoDB Setup & Testing
          </h1>
          <p className="text-gray-600 mb-8">
            Use these tools to test your MongoDB connection and seed demo data
          </p>

          <div className="space-y-4">
            {/* Test Connection Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={testConnection}
                disabled={testing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testing ? '⏳ Testing...' : '🧪 Test MongoDB Connection'}
              </button>
              <p className="text-sm text-gray-500">
                Check if MongoDB Atlas is connected
              </p>
            </div>

            {/* Seed Database Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={seedDatabase}
                disabled={seeding}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {seeding ? '⏳ Seeding...' : '🌱 Seed Demo Data'}
              </button>
              <p className="text-sm text-gray-500">
                Add demo user, projects, and tasks
              </p>
            </div>

            {/* Clear Database Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={clearDatabase}
                disabled={clearing}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {clearing ? '⏳ Clearing...' : '🗑️ Clear All Data'}
              </button>
              <p className="text-sm text-gray-500">
                Delete all data from MongoDB (⚠️ destructive)
              </p>
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {result.type === 'test' && '🧪 Connection Test Results'}
                {result.type === 'seed' && '🌱 Seed Results'}
                {result.type === 'clear' && '🗑️ Clear Results'}
                {result.type === 'error' && '❌ Error'}
              </h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(result.data, null, 2)}
              </pre>

              {result.type === 'seed' && result.status === 201 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✅ Demo data created successfully!
                  </p>
                  <p className="text-green-700 text-sm mt-2">
                    You can now login with:
                    <br />
                    <strong>Email:</strong> demo@e2w.global
                    <br />
                    <strong>Password:</strong> demo123
                  </p>
                  <Link
                    href="/"
                    className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Go to Dashboard →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Demo Credentials */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              📝 Demo Credentials
            </h3>
            <p className="text-blue-800 text-sm">
              After seeding, use these credentials to login:
            </p>
            <div className="mt-2 font-mono text-sm text-blue-900">
              <div>Email: <strong>demo@e2w.global</strong></div>
              <div>Password: <strong>demo123</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
