'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/clients/supabaseClient'

export default function Dashboard() {
  const { user, session } = useUser()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [projectPlan, setProjectPlan] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchUserData = async () => {
      try {
        // Check payment status
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

        // Check if project plan exists
        const { data: existingPlan, error: planError } = await supabase
          .from('project_plans')
          .select('plan')
          .eq('user_id', session.user.id)
          .single()

        if (planError && planError.code !== 'PGRST116') throw planError
        if (existingPlan) {
          setProjectPlan(existingPlan.plan)
        }
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError(err.message)
      }
    }

    fetchUserData()
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

        {projectPlan && (
          <div className="bg-[#232a3b] rounded-xl p-8">
            <h2 className="text-2xl mb-6">Your Project Plan</h2>
            <pre className="bg-[#1a1f2e] p-4 rounded-lg overflow-auto">
              {JSON.stringify(projectPlan, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}