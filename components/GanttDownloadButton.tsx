import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/types/database'

type GanttDownloadButtonProps = {
  userId: string
}

export function GanttDownloadButton({ userId }: GanttDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const supabase = createClientComponentClient<Database>()

  const handleDownloadGantt = async () => {
    setIsGenerating(true)
    try {
      const { data: planData, error: planError } = await supabase
        .from('project_plans')
        .select('plan')
        .eq('user_id', userId)
        .single()

      if (planError) {
        throw new Error('Failed to fetch project plan')
      }

      if (!planData?.plan) {
        throw new Error('No project plan found')
      }

      const response = await fetch('/api/gantt/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPlan: planData.plan }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Failed to generate Gantt chart: ${errorData.error}\nDetails: ${errorData.details}`
        )
      }

      const blob = await response.blob()
      if (blob.size === 0) {
        throw new Error('Generated file is empty')
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'project-gantt.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading Gantt chart:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={handleDownloadGantt}
      disabled={isGenerating}
      className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg 
                text-white text-sm font-medium transition disabled:opacity-50"
    >
      {isGenerating ? 'Generating Gantt Chart...' : 'Download Gantt Chart'}
    </button>
  )
} 