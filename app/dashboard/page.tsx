'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/clients/supabaseClient'
import { ProjectPlanDisplay } from '@/components/ProjectPlanDisplay'

export default function Dashboard() {
  const { user, session } = useUser()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [projectPlan, setProjectPlan] = useState(null)
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

  const handleGenerateProjectPlan = async () => {
    if (!user?.id) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/project-plan/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error + (data.details ? ` (${data.details})` : ''))
      }

      setProjectPlan(data.plan)
    } catch (err) {
      console.error('Error generating project plan:', err)
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-8">
      <div className="max-w-3xl mx-auto">
        {!projectPlan && !isGenerating && (
          <div className="bg-[#232a3b] rounded-xl p-8 text-center">
            <h2 className="text-2xl mb-6">Ready to Create Your Project Plan?</h2>
            <button
              onClick={handleGenerateProjectPlan}
              disabled={isGenerating}
              className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700
                      text-white rounded-xl text-lg font-semibold
                      hover:from-amber-700 hover:to-amber-800
                      transform hover:scale-105 active:scale-95
                      transition duration-200 ease-in-out
                      shadow-lg hover:shadow-xl
                      border border-amber-500/30
                      disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Project Plan'}
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="bg-[#232a3b] rounded-xl p-8 mb-8">
            <h2 className="text-2xl mb-4">Generating Your Project Plan...</h2>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 mb-8">
            <h3 className="text-xl text-red-400 mb-2">Generation Failed</h3>
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {projectPlan && <ProjectPlanDisplay plan={projectPlan} />}
      </div>
    </div>
  )
}