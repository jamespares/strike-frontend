'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/supabase-js'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<Session | null>(null)
  const [statusLogs, setStatusLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(`[Payment] ${message}`)
    setStatusLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  useEffect(() => {
    addLog('Component mounted, checking session...')
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          addLog(`Session found for user: ${session.user.id}`)
          setSession(session)
        } else {
          addLog('No session found')
        }
      })
      .catch(error => {
        addLog(`Error getting session: ${error.message}`)
      })
  }, [supabase.auth])

  useEffect(() => {
    if (!session) {
      addLog('No active session, waiting...')
      return
    }

    let timeoutId: NodeJS.Timeout
    let attemptCount = 0
    const MAX_ATTEMPTS = 30 // 1 minute maximum (2 seconds * 30)

    const checkPaymentStatus = async () => {
      try {
        attemptCount++
        addLog(`Checking payment status (attempt ${attemptCount}/${MAX_ATTEMPTS})...`)

        const { data: payments, error } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          addLog(`Error fetching payment status: ${error.message}`)
          throw error
        }

        if (!payments || payments.length === 0) {
          addLog('No payment records found')
        } else {
          addLog(`Latest payment status: ${payments[0].status}`)
          addLog(`Payment details: ${JSON.stringify(payments[0], null, 2)}`)
        }

        const hasSuccessfulPayment =
          payments && payments.length > 0 && payments[0].status === 'succeeded'

        if (hasSuccessfulPayment) {
          addLog('Payment successful, redirecting to dashboard...')
          router.push('/dashboard')
        } else if (attemptCount < MAX_ATTEMPTS) {
          addLog('Payment not confirmed yet, checking again in 2 seconds...')
          timeoutId = setTimeout(checkPaymentStatus, 2000)
        } else {
          addLog('Maximum check attempts reached. Please contact support if payment was made.')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        addLog(`Error during status check: ${errorMessage}`)
        if (attemptCount < MAX_ATTEMPTS) {
          timeoutId = setTimeout(checkPaymentStatus, 2000)
        }
      }
    }

    addLog('Starting payment status checks...')
    checkPaymentStatus()

    return () => {
      if (timeoutId) {
        addLog('Cleaning up status check timer')
        clearTimeout(timeoutId)
      }
    }
  }, [session, supabase, router])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Processing Payment</h2>
            <p className="text-gray-600 mb-4">
              Please wait while we confirm your payment. You will be redirected automatically.
            </p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-8"></div>

            {/* Status Logs */}
            <div className="mt-8 text-left">
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-auto">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Status Updates:</h3>
                {statusLogs.map((log, index) => (
                  <div
                    key={index}
                    className="text-xs text-gray-600 mb-1 font-mono whitespace-pre-wrap"
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
