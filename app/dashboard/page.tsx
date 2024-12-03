'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/clients/supabaseClient'
import { SurveyQuestion } from '@/data/surveyQuestions'

interface Asset {
  id: string
  title: string
  description: string
  type: 'document' | 'spreadsheet' | 'presentation' | 'external'
  path: string
  lastUpdated: string
}

interface SurveyResponse {
  problem: string
  key_risks: string
  deadline: string
  budget: string | number
  pricing_model: string
  user_id: string
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const { user, session } = useUser()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [generatedAssets, setGeneratedAssets] = useState<Record<string, boolean>>({})
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse | null>(null)
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[] | null>(null)

  useEffect(() => {
    // Check which assets have been generated
    const checkGeneratedAssets = async () => {
      const assetIds = ['idea-evaluation', 'business-plan', 'task-manager', 'budget-tracker', 'pitch-deck']
      const states: Record<string, boolean> = {}
      
      for (const id of assetIds) {
        try {
          const response = await fetch(`/api/${id}/latest`)
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
        
        // Fetch survey responses
        const { data: responses, error: responsesError } = await supabase
          .from('survey_responses')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (responsesError) {
          console.error('Error fetching survey responses:', responsesError)
          throw responsesError
        }
        
        console.log('Survey responses:', responses)
        setSurveyResponses(responses)

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

  const assets: Asset[] = [
    {
      id: 'idea-evaluation',
      title: 'Idea Evaluation',
      description: 'Comprehensive analysis of your business idea',
      type: 'document',
      path: '/idea-evaluation',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'business-plan',
      title: 'Business Plan',
      description: 'Detailed business plan and strategy',
      type: 'document',
      path: '/business-plan',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'task-manager',
      title: 'Task Manager',
      description: 'Project tasks and timeline tracking',
      type: 'spreadsheet',
      path: '/task-manager',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'budget-tracker',
      title: 'Budget Tracker',
      description: 'Financial planning and cost management',
      type: 'spreadsheet',
      path: '/budget-tracker',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'pitch-deck',
      title: 'Pitch Deck',
      description: 'Investor presentation and key metrics',
      type: 'presentation',
      path: '/pitch-deck',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'coding-course',
      title: "Don't know how to code? No problem! 🚀",
      description: "Check out Marc Lou's popular course on coding essentials for entrepreneurs.",
      type: 'external',
      path: 'https://codefa.st/?via=james',
      lastUpdated: new Date().toISOString()
    }
  ]

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
      case 'task-manager':
      case 'budget-tracker':
        return 'xlsx'
      case 'pitch-deck':
        return 'pptx'
      default:
        return 'pdf'
    }
  }

  const handleNewProject = () => {
    setShowModal(true)
  }

  const handleConfirmNewProject = () => {
    setShowModal(false)
    router.push('/survey/1')
  }

  const handleGenerate = async (assetId: string) => {
    console.log('Starting generation for:', assetId)
    console.log('Survey responses:', surveyResponses)
    console.log('Survey questions:', surveyQuestions)

    if (!surveyResponses || !surveyQuestions) {
      console.error('Survey data not available')
      // Show error message to user
      alert('Please complete the survey first')
      router.push('/survey/1')
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
          questions: surveyQuestions
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error(`Generation failed:`, errorData)
        throw new Error(errorData.error || 'Generation failed')
      }
      
      const result = await response.json()
      console.log('Generation successful:', result)
      
      setGeneratedAssets(prev => ({ ...prev, [assetId]: true }))
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
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/30 
                                transform -rotate-1 translate-y-1"></div>
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            {/* AI Tools Section */}
            <div className="bg-white shadow rounded-lg p-4">
              <div className="space-y-4">
                {/* AI Tools */}
                <div>
                  <h2 className="text-sm font-medium text-gray-900 mb-2 relative inline-block">
                    AI Tools
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400/30"></div>
                  </h2>
                  <nav className="space-y-1">
                    <a href="https://cursor.sh" target="_blank" rel="noopener noreferrer"
                       className="block py-1 text-sm text-emerald-600 hover:text-emerald-500">
                      Cursor AI <span className="text-xs text-gray-500">- AI code editor</span>
                    </a>
                    <a href="https://lovable.dev" target="_blank" rel="noopener noreferrer"
                       className="block py-1 text-sm text-emerald-600 hover:text-emerald-500">
                      lovable.dev <span className="text-xs text-gray-500">- Product builder</span>
                    </a>
                    <a href="https://v0.dev" target="_blank" rel="noopener noreferrer"
                       className="block py-1 text-sm text-emerald-600 hover:text-emerald-500">
                      V0.dev <span className="text-xs text-gray-500">- AI UI generation</span>
                    </a>
                    <a href="https://www.producthunt.com" target="_blank" rel="noopener noreferrer"
                       className="block py-1 text-sm text-emerald-600 hover:text-emerald-500">
                      Product Hunt <span className="text-xs text-gray-500">- Launch platform</span>
                    </a>
                  </nav>
                </div>

                {/* Boilerplates */}
                <div>
                  <h2 className="text-sm font-medium text-gray-900 mb-2 relative inline-block">
                    Boilerplates
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400/30"></div>
                  </h2>
                  <nav className="space-y-1">
                    <a href="https://github.com/ixartz/SaaS-Boilerplate" target="_blank" rel="noopener noreferrer"
                       className="block py-1 text-sm text-emerald-600 hover:text-emerald-500">
                      SaaS Boilerplate <span className="text-xs text-gray-500">- Quick setup</span>
                    </a>
                    <a href="https://github.com/ixartz/Next-JS-Landing-Page-Starter-Template" target="_blank" rel="noopener noreferrer"
                       className="block py-1 text-sm text-emerald-600 hover:text-emerald-500">
                      Landing Page <span className="text-xs text-gray-500">- Next.js starter</span>
                    </a>
                    <a href="https://github.com/ixartz/React-Native-Boilerplate" target="_blank" rel="noopener noreferrer"
                       className="block py-1 text-sm text-emerald-600 hover:text-emerald-500">
                      React Native <span className="text-xs text-gray-500">- Mobile starter</span>
                    </a>
                  </nav>
                </div>
              </div>
            </div>

            {/* Learning Resources */}
            <div className="bg-white shadow rounded-lg p-4">
              <div className="space-y-4">
                {/* Learning Resources */}
                <div>
                  <h2 className="text-sm font-medium text-gray-900 mb-2 relative inline-block">
                    Learning Resources
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400/30"></div>
                  </h2>
                  <nav className="space-y-1">
                    <a href="https://marclou.beehiiv.com/p/how-to-get-your-1st-customer-for-a-micro-saas" target="_blank" rel="noopener noreferrer"
                       className="block py-1 text-sm text-emerald-600 hover:text-emerald-500">
                      First Customer <span className="text-xs text-gray-500">- MicroSaaS guide</span>
                    </a>
                    <a href="https://www.youtube.com/watch?v=QRZ_l7cVzzU" target="_blank" rel="noopener noreferrer"
                       className="block py-1 text-sm text-emerald-600 hover:text-emerald-500">
                      Building MVP <span className="text-xs text-gray-500">- Video guide</span>
                    </a>
                    <a href="https://www.youtube.com/watch?v=Th8JoIan4dg" target="_blank" rel="noopener noreferrer"
                       className="block py-1 text-sm text-emerald-600 hover:text-emerald-500">
                      Idea Evaluation <span className="text-xs text-gray-500">- Video guide</span>
                    </a>
                  </nav>
                </div>
              </div>
            </div>

            {/* New Project Button */}
            <button
              onClick={handleNewProject}
              className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium
                       hover:bg-emerald-600 transform hover:scale-105 active:scale-95
                       transition duration-200 ease-in-out shadow-sm flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 relative inline-block">
                Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
                <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/30 
                              transform -rotate-1 translate-y-1"></div>
              </h2>
              <p className="mt-3 text-xl text-gray-500">
                Manage and access all your business assets in one place
              </p>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className={`overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 
                    ${asset.type === 'external' ? 'bg-emerald-50/70' : 'bg-white'}`}
                >
                  <div className={`px-4 py-5 sm:p-6 ${asset.type === 'external' ? 'flex flex-col h-full' : ''}`}>
                    <div>
                      <h3 className={`font-medium ${asset.type === 'external' ? 'text-base' : 'text-lg'} text-gray-900`}>
                        {asset.title}
                      </h3>
                      <p className={`mt-1 text-sm ${asset.type === 'external' ? 'text-gray-600' : 'text-gray-500'}`}>
                        {asset.description}
                      </p>
                    </div>
                    <div className={`mt-4 ${asset.type === 'external' ? 'mt-auto' : 'flex justify-between items-center'}`}>
                      {asset.type === 'external' ? (
                        <a
                          href={asset.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium
                                   hover:bg-emerald-600 transform hover:scale-105 active:scale-95
                                   transition duration-200 ease-in-out w-full justify-center"
                        >
                          Start Learning Today →
                        </a>
                      ) : loadingStates[asset.id] ? (
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
                  {asset.type !== 'external' && generatedAssets[asset.id] && (
                    <div className="bg-gray-50 px-4 py-4 sm:px-6">
                      <div className="text-sm text-gray-500">
                        Last updated: {new Date(asset.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start New Project?</h3>
              <p className="text-sm text-gray-500">
                Starting a new project will reset your current workspace. Please make sure to download any assets you want to keep before proceeding.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleConfirmNewProject}
                className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium
                         hover:bg-emerald-600 transform hover:scale-105 active:scale-95
                         transition duration-200 ease-in-out shadow-sm"
              >
                Continue to New Project
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium
                         hover:bg-gray-50 transform hover:scale-105 active:scale-95
                         transition duration-200 ease-in-out"
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