'use client'

import { useEffect, useState } from 'react'
import SpreadsheetViewer from '@/components/viewers/SpreadsheetViewer'

interface TaskManagerData {
  googleSheetsUrl: string
  lastUpdated: string
}

export default function TaskManagerPage() {
  const [taskManager, setTaskManager] = useState<TaskManagerData | null>(null)

  useEffect(() => {
    // Fetch the task manager data when the component mounts
    const fetchTaskManager = async () => {
      try {
        const response = await fetch('/api/task-manager/latest')
        if (!response.ok) throw new Error('Failed to fetch task manager')
        const data = await response.json()
        setTaskManager(data)
      } catch (error) {
        console.error('Error fetching task manager:', error)
      }
    }

    fetchTaskManager()
  }, [])

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/task-manager/download')
      if (!response.ok) throw new Error('Failed to download')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'task-manager.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading:', error)
    }
  }

  if (!taskManager) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading task manager...</div>
      </div>
    )
  }

  return (
    <SpreadsheetViewer
      title="Task Manager"
      googleSheetsUrl={taskManager.googleSheetsUrl}
      onDownload={handleDownload}
      downloadFormat="Excel"
    />
  )
} 