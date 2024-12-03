'use client'

import { useEffect, useState } from 'react'
import SpreadsheetViewer from '@/components/viewers/SpreadsheetViewer'

interface BudgetTrackerData {
  googleSheetsUrl: string
  lastUpdated: string
}

export default function BudgetTrackerPage() {
  const [budgetTracker, setBudgetTracker] = useState<BudgetTrackerData | null>(null)

  useEffect(() => {
    // Fetch the budget tracker data when the component mounts
    const fetchBudgetTracker = async () => {
      try {
        const response = await fetch('/api/budget-tracker/latest')
        if (!response.ok) throw new Error('Failed to fetch budget tracker')
        const data = await response.json()
        setBudgetTracker(data)
      } catch (error) {
        console.error('Error fetching budget tracker:', error)
      }
    }

    fetchBudgetTracker()
  }, [])

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/budget-tracker/download')
      if (!response.ok) throw new Error('Failed to download')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'budget-tracker.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading:', error)
    }
  }

  if (!budgetTracker) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading budget tracker...</div>
      </div>
    )
  }

  return (
    <SpreadsheetViewer
      title="Budget Tracker"
      googleSheetsUrl={budgetTracker.googleSheetsUrl}
      onDownload={handleDownload}
      downloadFormat="Excel"
    />
  )
} 