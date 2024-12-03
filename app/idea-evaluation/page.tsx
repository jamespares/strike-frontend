'use client'

import { useEffect, useState } from 'react'
import DocumentViewer from '@/components/viewers/DocumentViewer'

interface IdeaEvaluation {
  sections: {
    title: string
    content: string | string[]
    metrics?: {
      label: string
      value: string | number
      unit?: string
    }[]
  }[]
}

export default function IdeaEvaluationPage() {
  const [evaluation, setEvaluation] = useState<IdeaEvaluation | null>(null)

  useEffect(() => {
    // Fetch the evaluation data when the component mounts
    const fetchEvaluation = async () => {
      try {
        const response = await fetch('/api/idea-evaluation/latest')
        if (!response.ok) throw new Error('Failed to fetch evaluation')
        const data = await response.json()
        setEvaluation(data)
      } catch (error) {
        console.error('Error fetching evaluation:', error)
      }
    }

    fetchEvaluation()
  }, [])

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/idea-evaluation/download')
      if (!response.ok) throw new Error('Failed to download')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'idea-evaluation.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading:', error)
    }
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading evaluation...</div>
      </div>
    )
  }

  return (
    <DocumentViewer
      title="Idea Evaluation"
      content={evaluation}
      onDownload={handleDownload}
      downloadFormat="PDF"
    />
  )
} 