'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SurveyQuestion } from '@/data/surveyQuestions'
import { Session, User } from '@supabase/supabase-js'

interface Asset {
  id: string
  title: string
  description: string
  type: 'document' | 'spreadsheet' | 'presentation'
  path: string
  lastUpdated: string
}

interface SurveyResponse {
  id: string
  product: string
  motivation: string
  progress: string
  challenges: string
  deadline: string
  budget: string | number
  user_id: string
  created_at: string
  updated_at: string
  is_latest: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientComponentClient()
  const [isInitializing, setIsInitializing] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [generatedAssets, setGeneratedAssets] = useState<Record<string, boolean>>({})
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse | null>(null)
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[] | null>(null)

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const assets: Asset[] = [
    {
      id: 'business-plan',
      title: 'Business Plan',
      description: 'Comprehensive business strategy with revenue projections',
      type: 'document',
      path: '/business-plan',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'roadmap',
      title: 'Launch Roadmap',
      description: 'Step-by-step guide to launching your business',
      type: 'document',
      path: '/roadmap',
      lastUpdated: new Date().toISOString(),
    },
  ]

  useEffect(() => {
    // Check which assets have been generated
    const checkGeneratedAssets = async () => {
      const assetIds = ['business-plan', 'roadmap']
      const states: Record<string, boolean> = {}

      for (const id of assetIds) {
        try {
          const response = await fetch(`/api/${id}/latest`, { method: 'HEAD' })
          states[id] = response.ok
        } catch (error) {
          states[id] = false
        }
      }

      setGeneratedAssets(states)
    }

    if (session) {
      checkGeneratedAssets()
    }
  }, [session])

  const checkAssetStatus = async (assetId: string) => {
    try {
      if (!surveyResponses?.id) {
        console.log('No survey response ID available')
        return
      }
      console.log(`Checking status for ${assetId} with response ID ${surveyResponses.id}`)
      const response = await fetch(`/api/${assetId}/latest?responseId=${surveyResponses.id}`, {
        method: 'HEAD',
      })
      setGeneratedAssets(prev => ({ ...prev, [assetId]: response.ok }))
    } catch (error) {
      console.error(`Error checking asset status for ${assetId}:`, error)
      setGeneratedAssets(prev => ({ ...prev, [assetId]: false }))
    }
  }

  useEffect(() => {
    // Add a small delay to allow Supabase to initialize
    const timer = setTimeout(() => {
      setIsInitializing(false)
      if (!session) {
        router.push('/login')
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [session, router])

  useEffect(() => {
    // Fetch survey responses and questions when session is available
    const fetchSurveyData = async () => {
      if (!session?.user?.email) return

      try {
        console.log('Fetching survey data for user:', session.user.email)

        // Fetch latest survey response
        const { data: responses, error: responsesError } = await supabase
          .from('survey_responses')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_latest', true)
          .single()

        if (responsesError) {
          console.error('Error fetching survey responses:', responsesError)
          throw responsesError
        }

        console.log('Latest survey response:', responses)
        setSurveyResponses(responses)

        // Check for assets generated from this latest response
        if (responses) {
          const states: Record<string, boolean> = {}
          const allAssets = ['business-plan', 'roadmap']

          for (const assetId of allAssets) {
            try {
              const response = await fetch(`/api/${assetId}/latest?responseId=${responses.id}`, {
                method: 'HEAD',
              })
              states[assetId] = response.ok
            } catch (error) {
              states[assetId] = false
            }
          }
          setGeneratedAssets(states)
        }

        // Import survey questions
        const { surveyQuestions } = await import('@/data/surveyQuestions')
        console.log('Survey questions loaded:', surveyQuestions.length)
        setSurveyQuestions(surveyQuestions)
      } catch (error) {
        console.error('Error fetching survey data:', error)
      }
    }

    fetchSurveyData()
  }, [session])

  useEffect(() => {
    const checkAllAssetStatus = async () => {
      if (!session?.user?.id || !surveyResponses?.id) {
        console.log('No session or survey response ID available')
        setGeneratedAssets({})
        return
      }

      console.log('Checking assets for survey response:', surveyResponses.id)
      const allAssets = ['business-plan', 'roadmap']
      const states: Record<string, boolean> = {}

      for (const assetId of allAssets) {
        try {
          const response = await fetch(`/api/${assetId}/latest?responseId=${surveyResponses.id}`, {
            method: 'HEAD',
          })
          states[assetId] = response.ok
          console.log(`Asset ${assetId} status:`, response.ok)
        } catch (error) {
          console.error(`Error checking ${assetId}:`, error)
          states[assetId] = false
        }
      }

      setGeneratedAssets(states)
    }

    checkAllAssetStatus()
  }, [session, surveyResponses])

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleDownload = async (assetId: string) => {
    try {
      const response = await fetch(`/api/${assetId}/download`)
      if (!response.ok) throw new Error('Failed to download')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${assetId}.${getFileExtension(assetId)}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading:', error)
    }
  }

  const getFileExtension = (assetId: string) => {
    switch (assetId) {
      case 'pitch-deck':
        return 'pptx'
      default:
        return 'pdf'
    }
  }

  const handleConfirmNewProject = async () => {
    try {
      // Reset UI states
      setGeneratedAssets({})
      setLoadingStates({})
      setSurveyResponses(null)

      setShowModal(false)
      router.push('/survey/1')
    } catch (error) {
      console.error('Error starting new project:', error)
      alert('Failed to start new project. Please try again.')
    }
  }

  const handleGenerate = async (assetId: string) => {
    console.log('Starting generation for:', assetId)
    console.log('Survey responses:', surveyResponses)
    console.log('Survey questions:', surveyQuestions)

    if (!surveyResponses || !surveyQuestions) {
      console.error('Survey data not available')
      alert('Please complete the survey first')
      router.push('/survey/1')
      return
    }

    // Check if any other asset is currently being generated
    if (loadingStates[assetId]) {
      alert('Please wait for the current generation to complete before starting another one.')
      return
    }

    setLoadingStates(prev => ({ ...prev, [assetId]: true }))

    try {
      console.log(`Making request to /api/${assetId}/generate`)
      const response = await fetch(`/api/${assetId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: surveyResponses,
          questions: surveyQuestions,
          responseId: surveyResponses.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`Generation failed:`, errorData)
        throw new Error(errorData.error || 'Generation failed')
      }

      const result = await response.json()
      console.log('Generation successful:', result)

      await checkAssetStatus(assetId)
    } catch (error) {
      console.error(`Error generating ${assetId}:`, error)
      alert(`Failed to generate ${assetId}. Please try again.`)
    } finally {
      setLoadingStates(prev => ({ ...prev, [assetId]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="flex-shrink-0 h-10 w-auto flex items-center">
                  <img
                    src="/logo-square.png"
                    alt="Strike Logo"
                    className="h-full w-auto object-contain"
                  />
                </div>
                <span className="text-2xl font-bold text-gray-900 relative inline-block ml-3">
                  launchbooster.io
                  <div
                    className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/30 
                                transform -rotate-1 translate-y-1"
                  ></div>
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{user?.email}</span>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/')
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            {/* New Project Button - Moved up */}
            <button
              onClick={() => router.push('/survey/1')}
              className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium
                       hover:bg-emerald-600 transform hover:scale-105 active:scale-95
                       transition duration-200 ease-in-out shadow-sm flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Generate New Toolkit
            </button>

            {/* AI Tools Section */}
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="text-sm font-medium text-gray-900 mb-3 relative inline-block">
                AI Development Tools
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400/30"></div>
              </h2>
              <nav className="space-y-1">
                <a
                  href="https://cursor.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 text-sm text-emerald-600 hover:text-emerald-500"
                >
                  Cursor AI <span className="text-xs text-gray-500">- AI code editor</span>
                </a>
                <a
                  href="https://v0.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 text-sm text-emerald-600 hover:text-emerald-500"
                >
                  V0.dev <span className="text-xs text-gray-500">- AI UI generation</span>
                </a>
              </nav>
            </div>

            {/* Product Tools Section */}
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="text-sm font-medium text-gray-900 mb-3 relative inline-block">
                Product Tools
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400/30"></div>
              </h2>
              <nav className="space-y-1">
                <a
                  href="https://lovable.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 text-sm text-emerald-600 hover:text-emerald-500"
                >
                  lovable.dev <span className="text-xs text-gray-500">- Product builder</span>
                </a>
                <a
                  href="https://www.producthunt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 text-sm text-emerald-600 hover:text-emerald-500"
                >
                  Product Hunt <span className="text-xs text-gray-500">- Launch platform</span>
                </a>
              </nav>
            </div>

            {/* Code Templates Section */}
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="text-sm font-medium text-gray-900 mb-3 relative inline-block">
                Code Templates
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400/30"></div>
              </h2>
              <nav className="space-y-1">
                <a
                  href="https://github.com/ixartz/SaaS-Boilerplate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 text-sm text-emerald-600 hover:text-emerald-500"
                >
                  SaaS Boilerplate <span className="text-xs text-gray-500">- Quick setup</span>
                </a>
                <a
                  href="https://github.com/ixartz/Next-JS-Landing-Page-Starter-Template"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 text-sm text-emerald-600 hover:text-emerald-500"
                >
                  Landing Page <span className="text-xs text-gray-500">- Next.js starter</span>
                </a>
                <a
                  href="https://github.com/ixartz/React-Native-Boilerplate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 text-sm text-emerald-600 hover:text-emerald-500"
                >
                  React Native <span className="text-xs text-gray-500">- Mobile starter</span>
                </a>
              </nav>
            </div>

            {/* Learning Resources Section */}
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="text-sm font-medium text-gray-900 mb-3 relative inline-block">
                Learning Resources
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400/30"></div>
              </h2>
              <nav className="space-y-1">
                <a
                  href="https://marclou.beehiiv.com/p/how-to-get-your-1st-customer-for-a-micro-saas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 text-sm text-emerald-600 hover:text-emerald-500"
                >
                  First Customer <span className="text-xs text-gray-500">- MicroSaaS guide</span>
                </a>
                <a
                  href="https://www.youtube.com/watch?v=QRZ_l7cVzzU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 text-sm text-emerald-600 hover:text-emerald-500"
                >
                  Building MVP <span className="text-xs text-gray-500">- Video guide</span>
                </a>
                <a
                  href="https://www.youtube.com/watch?v=Th8JoIan4dg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 text-sm text-emerald-600 hover:text-emerald-500"
                >
                  Idea Evaluation <span className="text-xs text-gray-500">- Video guide</span>
                </a>
                <a
                  href="https://www.amazon.co.uk/How-Big-Things-Get-Done/dp/1035018934"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 text-sm text-emerald-600 hover:text-emerald-500"
                >
                  How Big Things Get Done{' '}
                  <span className="text-xs text-gray-500">- Project management handbook</span>
                </a>
                <a
                  href="https://readmake.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 text-sm text-emerald-600 hover:text-emerald-500"
                >
                  MAKE{' '}
                  <span className="text-xs text-gray-500">
                    - Solo founder&apos;s guide by @levelsio
                  </span>
                </a>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 relative inline-block">
                Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
                <div
                  className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/30 
                              transform -rotate-1 translate-y-1"
                ></div>
              </h2>
              <p className="mt-3 text-xl text-gray-500">
                Manage and access all your tools in one place
              </p>
            </div>

            {/* Asset Generation Tiles */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 mb-8">
              {/* Existing Asset Tiles */}
              {assets.map(asset => (
                <div
                  key={asset.id}
                  className="overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 bg-white"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{asset.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{asset.description}</p>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      {loadingStates[asset.id] ? (
                        <div className="flex items-center justify-center w-full">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                          <span className="ml-2 text-sm text-gray-500">Generating...</span>
                        </div>
                      ) : !generatedAssets[asset.id] ? (
                        <button
                          onClick={() => handleGenerate(asset.id)}
                          className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium
                                   hover:bg-emerald-600 transform hover:scale-105 active:scale-95
                                   transition duration-200 ease-in-out"
                        >
                          Generate
                        </button>
                      ) : (
                        <>
                          <Link
                            href={asset.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-500"
                          >
                            View <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDownload(asset.id)}
                            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                          >
                            Download <ArrowDownTrayIcon className="ml-1 h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {generatedAssets[asset.id] && (
                    <div className="bg-gray-50 px-4 py-4 sm:px-6">
                      <div className="text-sm text-gray-500">
                        Last updated: {new Date(asset.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Coding Course Card */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 shadow-sm border border-emerald-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {' '}
                Need to code something? Don't know how to do it? No problem! 🚀
              </h3>
              <p className="text-gray-600 mb-4">
                Check out Marc Lou&apos;s popular course on coding essentials for entrepreneurs.
                Perfect for founders who want to build their prototype!
              </p>
              <a
                href="https://codefa.st/?via=james"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium
                         hover:bg-emerald-600 transform hover:scale-105 active:scale-95
                         transition duration-200 ease-in-out shadow-sm"
              >
                Start Learning
                <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Start New Project?</h2>
            <p className="text-gray-600 mb-6">
              This will clear your current project data and start fresh. Are you sure you want to
              continue?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleConfirmNewProject}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium
                         hover:bg-emerald-600 transform hover:scale-105 active:scale-95
                         transition duration-200 ease-in-out shadow-sm"
              >
                Continue
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium
                         hover:bg-gray-200 transform hover:scale-105 active:scale-95
                         transition duration-200 ease-in-out shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
