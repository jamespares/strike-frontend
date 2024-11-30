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

  useEffect(() => {
    if (!session?.user?.id) return
    let timeoutId: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        console.log('Checking payment status...')
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('payment_status')
          .eq('id', session.user.id)
          .single()

        const { data: planData, error: planError } = await supabase
          .from('project_plans')
          .select('id')
          .eq('user_id', session.user.id)
          .single()

        console.log('Status check result:', {
          paymentStatus: userData?.payment_status,
          hasPlan: !!planData?.id,
          userError,
          planError
        })

        if (userError) throw userError

        const isPaid = userData?.payment_status === 'paid'
        const hasPlan = !!planData?.id

        console.log('Condition check:', { isPaid, hasPlan, generationStarted })

        if (isPaid && hasPlan) {
          console.log('All conditions met, redirecting to dashboard...')
          router.push('/dashboard')
          return
        }

        if (isPaid && !hasPlan && !generationStarted) {
          console.log('Payment confirmed, triggering plan generation...')
          setGenerationStarted(true)
          await fetch('/api/project-plan/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          })
        }

        console.log('Continuing to poll...')
        timeoutId = setTimeout(checkStatus, 2000)
      } catch (err) {
        console.error('Error during status check:', err)
        timeoutId = setTimeout(checkStatus, 2000)
      }
    }

    checkStatus()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [session, router, generationStarted])

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-8 bg-gradient-to-b from-[#1a1f2e] to-[#2d1810]">
      <div className="max-w-3xl mx-auto bg-[#232a3b] rounded-2xl shadow-2xl p-10 border border-amber-900/30">
        <div className="text-center">
          <div className="mb-6 text-6xl">⌛</div>
          <h1 className="text-4xl font-bold mb-6 text-amber-500 font-serif">Processing Payment...</h1>
          <p className="text-xl mb-8 text-amber-100/90">
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    </div>
  )
} 