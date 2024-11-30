'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/clients/supabaseClient'
import { ProjectPlanDisplay } from '@/components/ProjectPlanDisplay'
import { RoadmapDisplay } from '@/components/RoadmapDisplay'
import { ProgressBar } from '@/components/ProgressBar'
import { AssetGenerationStatus } from '@/lib/types/assets'

export default function Dashboard() {
  const { user } = useUser()
  const [error, setError] = useState(null)
  const [generationStatus, setGenerationStatus] = useState(AssetGenerationStatus.NOT_STARTED)
  const [projectPlan, setProjectPlan] = useState(null)
  const [roadmap, setRoadmap] = useState(null)

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

      // Wait for components to render
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generate PDFs
      const projectPlanPDF = await handleDownloadProjectPlanPDF()
      const roadmapPDF = await handleDownloadRoadmapPDF()

      setGenerationStatus(AssetGenerationStatus.COMPLETED)
    } catch (err) {
      console.error('Error generating assets:', err)
      setError(err.message)
      setGenerationStatus(AssetGenerationStatus.FAILED)
    }
  }

  const handleDownloadProjectPlanPDF = async () => {
    // Implementation similar to RoadmapDisplay's handleDownloadPDF
    // but targeting ProjectPlanDisplay's content
  }

  const handleDownloadRoadmapPDF = async () => {
    if (!document.querySelector('.react-flow')) return
    // Reference: components/RoadmapDisplay.tsx, lines 16-58
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
      </div>
    </div>
  )
}