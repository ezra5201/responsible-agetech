'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error' | 'setup_needed' | null>(null)
  const [dbError, setDbError] = useState<string>('')
  const [setupLoading, setSetupLoading] = useState(false)

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    setDbStatus('checking')
    try {
      const response = await fetch('/api/test')
      const data = await response.json()
      
      if (data.status === 'success') {
        if (data.tables_found.length === 3) {
          setDbStatus('connected')
        } else {
          setDbStatus('setup_needed')
          setDbError(`Missing tables: ${['resources', 'tags', 'resource_tags'].filter(t => !data.tables_found.includes(t)).join(', ')}`)
        }
      } else {
        setDbStatus('error')
        setDbError(data.error || 'Database connection failed')
      }
    } catch (error) {
      setDbStatus('error')
      setDbError('Failed to check database status')
    }
  }

  const setupDatabase = async () => {
    setSetupLoading(true)
    try {
      const response = await fetch('/api/setup', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setDbStatus('connected')
        setDbError('')
      } else {
        setDbError(data.error || 'Setup failed')
      }
    } catch (error) {
      setDbError('Setup request failed')
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Resource Manager
        </h1>
        <p className="text-gray-600 mb-6">
          Manage and display your resources with ease. Perfect for embedding in your Squarespace website.
        </p>
        
        {/* Database Status */}
        <div className={`mb-6 p-3 rounded-lg ${
          dbStatus === 'connected' ? 'bg-green-50 border border-green-200' :
          dbStatus === 'error' ? 'bg-red-50 border border-red-200' :
          dbStatus === 'setup_needed' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              dbStatus === 'connected' ? 'bg-green-500' :
              dbStatus === 'error' ? 'bg-red-500' :
              dbStatus === 'setup_needed' ? 'bg-yellow-500' :
              'bg-gray-500 animate-pulse'
            }`}></div>
            <span className={`text-sm font-medium ${
              dbStatus === 'connected' ? 'text-green-800' :
              dbStatus === 'error' ? 'text-red-800' :
              dbStatus === 'setup_needed' ? 'text-yellow-800' :
              'text-gray-800'
            }`}>
              {dbStatus === 'checking' && 'Checking database...'}
              {dbStatus === 'connected' && 'Database ready'}
              {dbStatus === 'error' && 'Database error'}
              {dbStatus === 'setup_needed' && 'Database setup needed'}
            </span>
          </div>
          {(dbStatus === 'error' || dbStatus === 'setup_needed') && (
            <p className="text-xs mt-1 text-gray-600">{dbError}</p>
          )}
        </div>

        {/* Setup Button */}
        {dbStatus === 'setup_needed' && (
          <div className="mb-6">
            <Button 
              onClick={setupDatabase}
              disabled={setupLoading}
              className="w-full"
            >
              {setupLoading ? 'Setting up database...' : 'Set Up Database'}
            </Button>
          </div>
        )}
        
        <div className="space-y-4">
          <Link href="/resources" className="block">
            <Button 
              className="w-full" 
              size="lg"
              disabled={dbStatus !== 'connected'}
            >
              View Resources (Public)
            </Button>
          </Link>
          
          <Link href="/admin" className="block">
            <Button 
              variant="outline" 
              className="w-full" 
              size="lg"
              disabled={dbStatus !== 'connected'}
            >
              Admin Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Embed in Squarespace</h3>
          <div className="text-sm text-blue-700 text-left">
            <p className="mb-2">1. Copy your app URL: <code className="bg-blue-100 px-1 rounded text-xs">{typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}/resources</code></p>
            <p className="mb-2">2. In Squarespace, add a Code Block</p>
            <p className="mb-2">3. Paste this iframe code:</p>
            <code className="block bg-blue-100 p-2 rounded text-xs break-all">
              {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}/resources" width="100%" height="800px" frameborder="0" style="border-radius: 8px;"></iframe>`}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
