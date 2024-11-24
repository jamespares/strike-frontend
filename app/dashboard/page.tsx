'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/clients/supabaseClient'
import { AssetGenerationStatus, AssetGenerationError } from '@/lib/types/assets'
import { ProgressBar } from '@/components/ProgressBar'
import { ProjectDownloads } from '@/components/ProjectDownloads'
import { signOut } from '@/lib/auth/auth'
import * as Sentry from '@sentry/nextjs'

interface UserAssets {
  roadmap_url: string | null
  gantt_chart_url: string | null
  gantt_csv_url: string | null
  budget_tracker_url: string | null
  budget_csv_url: string | null
  risk_log_url: string | null
  risk_csv_url: string | null
}

export default function Dashboard() {
  const { session } = useUser()
  const router = useRouter()
  const [assets, setAssets] = useState<UserAssets | null>(null)
  const [generationStatus, setGenerationStatus] = useState<AssetGenerationStatus>(AssetGenerationStatus.PENDING)
  const [error, setError] = useState<AssetGenerationError | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const statusMessages: Record<AssetGenerationStatus, string> = {
    [AssetGenerationStatus.PENDING]: 'Preparing to generate your assets...',
    [AssetGenerationStatus.GENERATING_PLAN]: 'Creating your project plan...',
    [AssetGenerationStatus.GENERATING_GANTT]: 'Building Gantt chart...',
    [AssetGenerationStatus.GENERATING_GANTT_CSV]: 'Creating Gantt CSV...',
    [AssetGenerationStatus.GENERATING_BUDGET]: 'Preparing budget tracker...',
    [AssetGenerationStatus.GENERATING_BUDGET_CSV]: 'Creating Budget CSV...',
    [AssetGenerationStatus.GENERATING_RISK]: 'Analyzing risks...',
    [AssetGenerationStatus.GENERATING_RISK_CSV]: 'Creating Risk CSV...',
    [AssetGenerationStatus.GENERATING_ROADMAP]: 'Finalizing project roadmap...',
    [AssetGenerationStatus.COMPLETED]: 'All assets ready!',
    [AssetGenerationStatus.FAILED]: 'Generation failed. Please try again.',
  }

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!session) {
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          if (!currentSession) {
            router.push('/')
            return
          }
        }
        await fetchAssets()
        const unsubscribe = subscribeToAssetUpdates(session?.user.id)
        return () => {
          unsubscribe()
        }
      } catch (err) {
        Sentry.captureException(err)
        console.error('Session check failed:', err)
      }
    }

    checkSession()
  }, [session, router])

  const fetchAssets = async () => {
    try {
      setError(null)

      // Check if we have a session
      if (!session?.user?.id) {
        throw new Error('Please sign in to continue')
      }

      // Check payment status
      const { data: userAssets, error: userAssetsError } = await supabase
        .from('user_assets')
        .select('payment_status')
        .eq('user_id', session.user.id)
        .single()

      if (userAssetsError) {
        console.error('Error fetching user assets:', userAssetsError)
        throw new Error('Unable to verify payment status')
      }

      if (!userAssets) {
        console.error('No user assets found for ID:', session.user.id)
        throw new Error('Payment status not found. Please complete payment.')
      }

      if (userAssets.payment_status !== 'paid') {
        router.push('/payment')
        return
      }

      // Fetch initial asset data
      const { data: assetsData, error: assetError } = await supabase
        .from('user_assets')
        .select('*, generation_status')
        .eq('user_id', session.user.id)
        .single()

      if (assetError) {
        console.error('Error fetching asset data:', assetError)
        throw new Error('Unable to load project assets')
      }

      if (!assetsData) {
        console.error('No asset data found for user:', session.user.id)
        throw new Error('Project assets not initialized')
      }

      setAssets(assetsData)
      setGenerationStatus(assetsData.generation_status)
    } catch (err: any) {
      Sentry.captureException(err)
      console.error('Error fetching assets:', err)
      setError({
        step: generationStatus,
        message: err.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      })
    }
  }

  const subscribeToAssetUpdates = (userId: string) => {
    const channel = supabase.channel('public:user_assets', {
      config: {
        broadcast: {
          ack: true
        }
      }
    })

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'user_assets', filter: `user_id=eq.${userId}` },
      payload => {
        const updatedAssets = payload.new as UserAssets
        setAssets(updatedAssets)
        setGenerationStatus(updatedAssets.generation_status)
        if (updatedAssets.generation_status === AssetGenerationStatus.FAILED) {
          setError({
            step: updatedAssets.generation_status,
            message: 'Asset generation failed. Please try again.',
            timestamp: new Date().toISOString()
          })
        }
      }
    ).subscribe()

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      setError(null)

      // Reset asset statuses
      await supabase
        .from('user_assets')
        .update({ generation_status: AssetGenerationStatus.PENDING })
        .eq('user_id', session?.user.id)

      // Trigger asset generation via API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/assets/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to trigger asset generation')
      }

      // Assets will be updated via subscription
    } catch (err: any) {
      Sentry.captureException(err)
      console.error('Retry failed:', err)
      setError({
        step: generationStatus,
        message: 'Retry failed. Please try again later.',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-8">
      <div className="max-w-3xl mx-auto">
        {error ? (
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 mb-8">
            <h3 className="text-xl text-red-400 mb-2">Generation Failed</h3>
            <p className="text-red-200 mb-4">{error.message}</p>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        ) : (
          <div className="bg-[#232a3b] rounded-xl p-8 mb-8">
            <h2 className="text-2xl mb-4">{statusMessages[generationStatus]}</h2>
            <ProgressBar status={generationStatus} />
          </div>
        )}

        {assets && generationStatus === AssetGenerationStatus.COMPLETED && (
          <ProjectDownloads assets={assets} />
        )}

        {generationStatus !== AssetGenerationStatus.PENDING && (
          <button
            onClick={() => signOut()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  )
}