'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/clients/supabaseClient'
import { ProjectPlanDisplay } from '@/components/ProjectPlanDisplay'
import { RoadmapDisplay } from '@/components/RoadmapDisplay'
import { ProgressBar } from '@/components/ProgressBar'
import { AssetGenerationStatus } from '@/lib/types/assets'
import { RoadmapGenerateButton } from '@/components/RoadmapGenerateButton'

export default function Dashboard() {
  const { user, session } = useUser()
  const router = useRouter()
  const [generationStatus, setGenerationStatus] = useState<AssetGenerationStatus>(AssetGenerationStatus.NOT_STARTED)
  const [projectPlan, setProjectPlan] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session?.user?.id) return

    const checkPaymentStatus = async () => {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('payment_status')
          .eq('id', session.user.id)
          .single()

        if (userError) throw userError

        if (!userData || userData.payment_status !== 'paid') {
          router.push('/payment')
          return
        }
      } catch (err) {
        console.error('Error checking payment status:', err)
        setError(err.message)
      }
    }

    checkPaymentStatus()
  }, [session, router])

  const handleGenerateAssets = async () => {
    if (!user?.id) return
    setError(null)
    setGenerationStatus(AssetGenerationStatus.GENERATING_PLAN)

    try {
      // Generate Project Plan
      const planResponse = await fetch('/api/project-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      const planData = await planResponse.json()
      if (!planResponse.ok) throw new Error(planData.error)
      setProjectPlan(planData.plan)

      // Add delay to ensure project plan is saved
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate Roadmap with project plan data
      setGenerationStatus(AssetGenerationStatus.GENERATING_ROADMAP)
      const roadmapResponse = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ projectPlan: planData.plan }),
        credentials: 'include',
      })

      const roadmapData = await roadmapResponse.json()
      if (!roadmapResponse.ok) throw new Error(roadmapData.error)
      setRoadmap(roadmapData.roadmap)

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
        {projectPlan && !roadmap && (
          <RoadmapGenerateButton 
            projectPlan={projectPlan} 
            onRoadmapGenerated={(roadmapData) => setRoadmap(roadmapData)} 
          />
        )}
        {roadmap && <RoadmapDisplay projectPlan={projectPlan} />}
      </div>
    </div>
  )
}