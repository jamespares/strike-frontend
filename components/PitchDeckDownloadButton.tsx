import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/types/database'

type PitchDeckDownloadButtonProps = {
  userId: string
}

export function PitchDeckDownloadButton({ userId }: PitchDeckDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const supabase = createClientComponentClient<Database>()

  const handleDownloadPitchDeck = async () => {
    setIsGenerating(true)
    try {
      const { data: planData, error: planError } = await supabase
        .from('project_plans')
        .select('plan')
        .eq('user_id', userId)
        .single()

      if (planError) throw new Error('Failed to fetch project plan')
      if (!planData?.plan) throw new Error('No project plan found')

      const response = await fetch('/api/pitch-deck/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPlan: planData.plan }),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to generate pitch deck')
      const blob = await response.blob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'pitch-deck.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading pitch deck:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={handleDownloadPitchDeck}
      disabled={isGenerating}
      className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg 
                text-white text-sm font-medium transition disabled:opacity-50"
    >
      {isGenerating ? 'Generating...' : 'Download Pitch Deck'}
    </button>
  )
} 