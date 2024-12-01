'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { supabase } from '@/lib/clients/supabaseClient'

export default function PaymentSuccess() {
  const router = useRouter()
  const { session } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [generationStarted, setGenerationStarted] = useState(false)
  const [statusLog, setStatusLog] = useState<string[]>([])

  // Add log function
  const addLog = (message: string) => {
    console.log(`[Payment Success] ${message}`)
    setStatusLog(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  useEffect(() => {
    if (!session?.user?.id) {
      addLog('No user session found')
      return
    }

    let timeoutId: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        addLog('Checking payment and plan status...')
        
        // Check payment status
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('payment_status')
          .eq('id', session.user.id)
          .single()

        if (userError) {
          addLog(`Error fetching user payment status: ${userError.message}`)
          throw userError
        }

        addLog(`Payment status: ${userData?.payment_status}`)

        // Check project plan
        const { data: planData, error: planError } = await supabase
          .from('project_plans')
          .select('id, plan')
          .eq('user_id', session.user.id)
          .single()

        if (planError && planError.code !== 'PGRST116') { // Ignore "no rows returned" error
          addLog(`Error fetching project plan: ${planError.message}`)
          throw planError
        }

        const isPaid = userData?.payment_status === 'paid'
        const hasPlan = !!planData?.id
        const hasValidPlan = !!planData?.plan

        addLog(`Status check - Paid: ${isPaid}, Has Plan: ${hasPlan}, Valid Plan: ${hasValidPlan}`)

        if (isPaid && hasPlan && hasValidPlan) {
          addLog('All conditions met, redirecting to dashboard')
          router.push('/dashboard')
          return
        }

        if (isPaid && (!hasPlan || !hasValidPlan) && !generationStarted) {
          addLog('Payment confirmed, starting plan generation')
          setGenerationStarted(true)
          
          try {
            const response = await fetch('/api/project-plan/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              addLog(`Plan generation failed: ${response.status} ${response.statusText}`)
              addLog(`Error details: ${JSON.stringify(errorData)}`)
              throw new Error('Failed to generate project plan')
            }

            const result = await response.json()
            addLog('Plan generation API call successful')
            addLog(`Generation result: ${JSON.stringify(result)}`)
          } catch (error) {
            addLog(`Error during plan generation: ${error instanceof Error ? error.message : 'Unknown error'}`)
            throw error
          }
        }

        addLog('Scheduling next status check')
        timeoutId = setTimeout(checkStatus, 2000)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        addLog(`Error during status check: ${errorMessage}`)
        timeoutId = setTimeout(checkStatus, 2000)
      }
    }

    checkStatus()

    return () => {
      if (timeoutId) {
        addLog('Cleaning up status check interval')
        clearTimeout(timeoutId)
      }
    }
  }, [session, router, generationStarted])

  // Add status log to the UI (hidden in production, visible in development)
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-emerald-100 rounded-full">
                <div className="w-8 h-8 text-emerald-500">
                  {generationStarted ? (
                    <svg className="animate-spin" viewBox="0 0 24 24">
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        fill="none"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M5 13l4 4L19 7" 
                      />
                    </svg>
                  )}
                </div>
              </div>
              
              <h1 className="text-3xl font-extrabold text-gray-900 relative inline-block">
                {generationStarted ? 'Generating Your Assets' : 'Payment Successful'}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/30 transform -rotate-1 translate-y-1"></div>
              </h1>

              <p className="mt-4 text-lg text-gray-600">
                {generationStarted 
                  ? 'Please wait while we create your custom business toolkit...'
                  : 'Thank you for your purchase! We\'re preparing your business toolkit.'}
              </p>

              <div className="mt-8">
                {generationStarted && (
                  <div className="max-w-md mx-auto">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 animate-pulse rounded-full w-full"></div>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">
                      This may take a few minutes. You&apos;ll be automatically redirected when ready.
                    </p>
                  </div>
                )}
              </div>

              {isDevelopment && statusLog.length > 0 && (
                <div className="mt-8 text-left">
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-auto">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Status Log:</h3>
                    {statusLog.map((log, index) => (
                      <div key={index} className="text-xs text-gray-600 mb-1 font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 