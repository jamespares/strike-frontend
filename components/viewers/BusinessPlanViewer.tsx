import React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { GenericDocumentViewer } from './GenericDocumentViewer'

interface BusinessPlanSection {
  title: string
  content: string[]
  metrics?: {
    label: string
    value: string | number
    unit?: string
  }[]
}

interface BusinessPlanViewerProps {
  assetId: string
  content: {
    [key: string]: BusinessPlanSection
  }
  filePath?: string
}

export const BusinessPlanViewer = ({ assetId, content, filePath }: BusinessPlanViewerProps) => {
  const supabase = createClientComponentClient()

  const handleDownload = async () => {
    if (!filePath) return

    try {
      const { data, error } = await supabase.storage.from('business-plans').download(filePath)

      if (error) {
        console.error('Error downloading PDF:', error)
        return
      }

      // Create a download link
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `business-plan-${assetId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  const sections = Object.entries(content).map(([_, section]) => ({
    title: section.title,
    content: section.content,
    metrics: section.metrics,
  }))

  return (
    <GenericDocumentViewer
      title="Your Business Plan"
      sections={sections}
      onDownload={filePath ? handleDownload : undefined}
      className="pb-8"
    />
  )
}
