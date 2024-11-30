'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { supabase } from '@/lib/clients/supabaseClient'
import { ProjectPlanDisplay } from '@/components/ProjectPlanDisplay'
import { RoadmapDisplay } from '@/components/RoadmapDisplay'
import { ProgressBar } from '@/components/ProgressBar'
import { AssetGenerationStatus } from '@/lib/types/assets'
import { GanttDownloadButton } from '@/components/GanttDownloadButton'
import { PitchDeckDownloadButton } from '@/components/PitchDeckDownloadButton'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [generationStatus, setGenerationStatus] = useState(AssetGenerationStatus.NOT_STARTED)
  const [projectPlan, setProjectPlan] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [pitchDeck, setPitchDeck] = useState(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
    }
    getUser()
  }, [supabase.auth])

  const handleGenerateAssets = async () => {
    if (!user?.id) return
    setError(null)
    setGenerationStatus(AssetGenerationStatus.GENERATING_ASSETS)

    try {
      // Fetch existing project plan
      const { data: planData, error: planError } = await supabase
        .from('project_plans')
        .select('plan')
        .eq('user_id', user.id)
        .single()

      if (planError) throw new Error('Failed to fetch project plan')
      setProjectPlan(planData.plan)

      // Generate Roadmap
      const roadmapResponse = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPlan: planData.plan }),
        credentials: 'include',
      })

      const roadmapData = await roadmapResponse.json()
      if (!roadmapResponse.ok) throw new Error(roadmapData.error)
      setRoadmap(roadmapData.roadmap)

      // Generate and Download Pitch Deck PDF
      const pitchDeckResponse = await fetch('/api/pitch-deck/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPlan: planData.plan }),
        credentials: 'include',
      })

      if (!pitchDeckResponse.ok) {
        const errorData = await pitchDeckResponse.json()
        throw new Error(errorData.error)
      }

      // Handle PDF download
      const pdfBlob = await pitchDeckResponse.blob()
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'pitch-deck.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Wait for components to render
      await new Promise(resolve => setTimeout(resolve, 1000))

      setGenerationStatus(AssetGenerationStatus.COMPLETED)
    } catch (err) {
      console.error('Error generating assets:', err)
      setError(err.message)
      setGenerationStatus(AssetGenerationStatus.FAILED)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {generationStatus === AssetGenerationStatus.NOT_STARTED && (
          <div className="bg-[#232a3b] rounded-xl p-8 text-center">
            <h2 className="text-2xl mb-6">Ready to Create Your Project Toolkit?</h2>
            <button
              onClick={handleGenerateAssets}
              className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700
                      text-white rounded-xl text-lg font-semibold
                      hover:from-amber-700 hover:to-amber-800
                      transform hover:scale-105 active:scale-95
                      transition duration-200 ease-in-out
                      shadow-lg hover:shadow-xl
                      border border-amber-500/30"
            >
              Generate Project Toolkit
            </button>
          </div>
        )}

        {generationStatus !== AssetGenerationStatus.NOT_STARTED && 
         generationStatus !== AssetGenerationStatus.COMPLETED && (
          <div className="bg-[#232a3b] rounded-xl p-8">
            <h2 className="text-2xl mb-6">Generating Your Project Toolkit...</h2>
            <ProgressBar status={generationStatus} />
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6">
            <h3 className="text-xl text-red-400 mb-2">Generation Failed</h3>
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {projectPlan && <ProjectPlanDisplay plan={projectPlan} />}
        {roadmap && <RoadmapDisplay projectPlan={projectPlan} />}
        {user?.id && projectPlan && (
          <div className="flex gap-4">
            <GanttDownloadButton userId={user.id} />
            {pitchDeck && <PitchDeckDownloadButton userId={user.id} pitchDeck={pitchDeck} />}
          </div>
        )}
      </div>
    </div>
  )
}