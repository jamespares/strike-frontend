'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/clients/supabaseClient'
import { signOut } from '@/lib/auth/auth'
import { ProjectDownloads } from '@/components/ProjectDownloads'

interface UserAssets {
  diagram_url: string
  gantt_chart_url: string
  budget_tracker_url: string
  risk_log_url: string
  gantt_csv_url: string
}

export default function Dashboard() {
  const { session } = useUser()
  const router = useRouter()
  const [assets, setAssets] = useState<UserAssets | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) {
      router.push('/')
    } else {
      fetchAssets()
    }
  }, [session, router])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Poll every 2 seconds for up to 30 seconds
      for (let i = 0; i < 15; i++) {
        const { data: userData } = await supabase
          .from('users')
          .select('payment_status')
          .eq('id', session?.user.id)
          .single()

        if (userData?.payment_status === 'paid') {
          const { data, error } = await supabase
            .from('user_assets')
            .select('*')
            .eq('user_id', session?.user.id)
            .single()

          if (data) {
            setAssets(data)
            setLoading(false)
            return
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      throw new Error('Timed out waiting for assets')
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching assets:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] text-white p-8 bg-gradient-to-b from-[#1a1f2e] to-[#2d1810]">
        <div className="max-w-3xl mx-auto bg-[#232a3b] rounded-2xl shadow-2xl p-10 border border-amber-900/30">
          <p className="text-xl text-amber-500">The tools are being prepared...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-8 bg-gradient-to-b from-[#1a1f2e] to-[#2d1810]">
      <div className="max-w-3xl mx-auto bg-[#232a3b] rounded-2xl shadow-2xl p-10 border border-amber-900/30">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-amber-500 font-serif">Tools for Your Project</h1>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700
                     text-white rounded-xl text-sm font-semibold
                     hover:from-gray-700 hover:to-gray-800
                     transform hover:scale-105 active:scale-95
                     transition duration-200 ease-in-out
                     shadow-lg hover:shadow-xl
                     border border-gray-500/30"
          >
            Back to Home
          </button>
        </div>
        
        {assets ? (
          <div className="space-y-6">
            <ul className="grid grid-cols-1 gap-4">
              <li className="bg-[#1a1f2e] p-6 rounded-xl border border-amber-500/30 hover:border-amber-500/60 transition-all">
                <a href={assets.diagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-lg text-amber-100 hover:text-amber-400">
                  <span className="mr-3 text-amber-500">🗺️</span> View Your Quest Map
                </a>
              </li>
              <li className="bg-[#1a1f2e] p-6 rounded-xl border border-amber-500/30 hover:border-amber-500/60 transition-all">
                <a href={assets.gantt_chart_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-lg text-amber-100 hover:text-amber-400">
                  <span className="mr-3 text-amber-500">📜</span> View Timeline Scroll
                </a>
              </li>
              <li className="bg-[#1a1f2e] p-6 rounded-xl border border-amber-500/30 hover:border-amber-500/60 transition-all">
                <a href={assets.budget_tracker_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-lg text-amber-100 hover:text-amber-400">
                  <span className="mr-3 text-amber-500">💰</span> View Treasury Ledger
                </a>
              </li>
              <li className="bg-[#1a1f2e] p-6 rounded-xl border border-amber-500/30 hover:border-amber-500/60 transition-all">
                <a href={assets.risk_log_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-lg text-amber-100 hover:text-amber-400">
                  <span className="mr-3 text-amber-500">⚔️</span> View Threat Register
                </a>
              </li>
            </ul>
            <ProjectDownloads 
              ganttChartUrl={assets.gantt_chart_url}
              ganttCsvUrl={assets.gantt_csv_url}
            />
          </div>
        ) : (
          <p className="text-xl text-amber-100/90">Your tools are being prepared. Check your email for updates.</p>
        )}
      </div>
    </div>
  )
}