'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/supabase-js'

export default function PaymentSuccess() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusLog, setStatusLog] = useState<string[]>([])
  const supabase = createClientComponentClient()

  // Add log function
  const addLog = (message: string) => {
    console.log(`[Payment Success] ${message}`)
    setStatusLog(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()
      setSession(currentSession)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  useEffect(() => {
    if (!session?.user?.id) {
      addLog('No user session found')
      return
    }

    let timeoutId: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        addLog('Checking payment status...')

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

        if (userData?.payment_status === 'paid') {
          addLog('Payment confirmed, redirecting to dashboard')
          router.push('/dashboard')
          return
        }

        addLog('Payment not yet confirmed, checking again in 2 seconds')
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
  }, [session, router])

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
                </div>
              </div>

              <h1 className="text-3xl font-extrabold text-gray-900 relative inline-block">
                Processing Your Payment
                <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/30 transform -rotate-1 translate-y-1"></div>
              </h1>

              <p className="mt-4 text-lg text-gray-600">
                Please wait while we confirm your payment...
              </p>

              <div className="mt-8">
                <div className="max-w-md mx-auto">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-pulse rounded-full w-full"></div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">
                    You&apos;ll be automatically redirected to your dashboard when ready.
                  </p>
                </div>
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
