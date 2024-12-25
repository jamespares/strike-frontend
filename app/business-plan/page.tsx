'use client'

import { useEffect, useState } from 'react'
import { GenericDocumentViewer as DocumentViewer } from '@/components/viewers/GenericDocumentViewer'

interface BusinessPlanSection {
  title: string
  content: string | string[]
  metrics?: {
    label: string
    value: string | number
    unit?: string
  }[]
}

interface BusinessPlan {
  sections: BusinessPlanSection[]
}

export default function BusinessPlanPage() {
  const [businessPlan, setBusinessPlan] = useState<BusinessPlan | null>(null)

  useEffect(() => {
    const fetchBusinessPlan = async () => {
      try {
        const response = await fetch('/api/business-plan/latest')
        if (!response.ok) throw new Error('Failed to fetch business plan')
        const data = await response.json()
        setBusinessPlan(data)
      } catch (error) {
        console.error('Error fetching business plan:', error)
      }
    }

    fetchBusinessPlan()
  }, [])

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/business-plan/download')
      if (!response.ok) throw new Error('Failed to download')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'business-plan.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading:', error)
    }
  }

  if (!businessPlan) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading business plan...</div>
      </div>
    )
  }

  const content = {
    sections: businessPlan.sections.map(section => ({
      title: section.title,
      content: Array.isArray(section.content) ? section.content : [section.content],
      metrics: section.metrics?.map(metric => ({
        label: metric.label,
        value: metric.value,
        unit: metric.unit,
      })),
    })),
  }

  return (
    <DocumentViewer
      title="Business Plan"
      sections={content.sections}
      onDownload={handleDownload}
      downloadFormat="PDF"
    />
  )
}
