'use client'

import { useEffect, useState } from 'react'
import DocumentViewer from '@/components/viewers/DocumentViewer'

interface Roadmap {
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

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)

  useEffect(() => {
    // Fetch the roadmap data when the component mounts
    const fetchRoadmap = async () => {
      try {
        const response = await fetch('/api/roadmap/latest')
        if (!response.ok) throw new Error('Failed to fetch roadmap')
        const data = await response.json()
        setRoadmap(data)
      } catch (error) {
        console.error('Error fetching roadmap:', error)
      }
    }

    fetchRoadmap()
  }, [])

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/roadmap/download')
      if (!response.ok) throw new Error('Failed to download')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'roadmap.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading:', error)
    }
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading roadmap...</div>
      </div>
    )
  }

  return (
    <DocumentViewer
      title="Project Roadmap"
      content={roadmap}
      onDownload={handleDownload}
      downloadFormat="PDF"
    />
  )
} 