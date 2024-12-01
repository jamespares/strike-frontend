'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs'
import { AssetGenerationStatus } from '@/lib/types/assets'
import { BusinessPlanDisplay } from '@/components/BusinessPlanDisplay'
import { RoadmapDisplay } from '@/components/RoadmapDisplay'
import { ProgressBar } from '@/components/ProgressBar'
import { GanttDownloadButton } from '@/components/GanttDownloadButton'
import { PitchDeckDownloadButton } from '@/components/PitchDeckDownloadButton'

const SquigglyUnderline = () => (
  <svg
    className="absolute -bottom-2 left-0 w-full"
    viewBox="0 0 100 7"
    preserveAspectRatio="none"
    style={{ height: '0.5rem' }}
  >
    <path
      d="M0,5 Q20,3.5 40,5 T80,5 T120,5"
      stroke="rgb(52, 211, 153)"
      strokeOpacity="0.3"
      strokeWidth="4"
      fill="none"
    />
  </svg>
);

enum GenerationStep {
  NOT_STARTED = 'NOT_STARTED',
  BUSINESS_PLAN = 'BUSINESS_PLAN',
  ROADMAP = 'ROADMAP',
  PITCH_DECK = 'PITCH_DECK',
  GANTT_CHART = 'GANTT_CHART',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

const stepMessages = {
  [GenerationStep.NOT_STARTED]: 'Starting generation...',
  [GenerationStep.BUSINESS_PLAN]: 'Creating your business plan...',
  [GenerationStep.ROADMAP]: 'Generating project roadmap...',
  [GenerationStep.PITCH_DECK]: 'Designing pitch deck...',
  [GenerationStep.GANTT_CHART]: 'Building Gantt chart...',
  [GenerationStep.COMPLETED]: 'All assets generated!',
  [GenerationStep.FAILED]: 'Generation failed'
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generationStatus, setGenerationStatus] = useState(AssetGenerationStatus.NOT_STARTED)
  const [currentStep, setCurrentStep] = useState<GenerationStep>(GenerationStep.NOT_STARTED)
  const [businessPlan, setBusinessPlan] = useState<Blob | null>(null)
  const [roadmap, setRoadmap] = useState<Blob | null>(null)
  const [pitchDeck, setPitchDeck] = useState<Blob | null>(null)
  const [ganttChart, setGanttChart] = useState<Blob | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log('Current user:', currentUser)
      setUser(currentUser)
    }
    getUser()
  }, [supabase.auth])

  const handleGenerateAssets = async () => {
    if (!user?.id) {
      console.log('No user found')
      return
    }

    // Reset states at the start
    setError(null)
    setBusinessPlan(null)
    setRoadmap(null)
    setPitchDeck(null)
    setGanttChart(null)
    setGenerationStatus(AssetGenerationStatus.GENERATING_ASSETS)
    setCurrentStep(GenerationStep.BUSINESS_PLAN)

    try {
      console.log('Fetching project plan for user:', user.id)
      // Fetch existing project plan from Supabase
      const { data: planData, error: planError } = await supabase
        .from('project_plans')
        .select('plan')
        .eq('user_id', user.id)
        .single()

      if (planError) {
        console.error('Plan fetch error:', planError)
        throw new Error('Failed to fetch project plan')
      }
      if (!planData?.plan) {
        console.error('No plan data found')
        throw new Error('No project plan found')
      }

      console.log('Found project plan:', planData.plan)
      // Generate Business Plan PDF from project plan JSON
      setCurrentStep(GenerationStep.BUSINESS_PLAN)
      try {
        const businessPlanResponse = await fetch('/api/business-plan/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectPlan: planData.plan }),
          credentials: 'include',
        })

        if (!businessPlanResponse.ok) {
          const contentType = businessPlanResponse.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await businessPlanResponse.json()
            throw new Error(errorData.error || 'Failed to generate business plan')
          } else {
            throw new Error(`Failed to generate business plan: ${businessPlanResponse.statusText}`)
          }
        }

        const businessPlanBlob = await businessPlanResponse.blob()
        setBusinessPlan(businessPlanBlob)
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('Business Plan generation error:', error)
        throw new Error('Failed to generate business plan')
      }

      // Generate Roadmap PDF from project plan JSON
      setCurrentStep(GenerationStep.ROADMAP)
      try {
        const roadmapResponse = await fetch('/api/roadmap/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectPlan: planData.plan }),
          credentials: 'include',
        })

        if (!roadmapResponse.ok) {
          const contentType = roadmapResponse.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await roadmapResponse.json()
            throw new Error(errorData.error || 'Failed to generate roadmap')
          } else {
            throw new Error(`Failed to generate roadmap: ${roadmapResponse.statusText}`)
          }
        }

        const roadmapBlob = await roadmapResponse.blob()
        setRoadmap(roadmapBlob)
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('Roadmap generation error:', error)
        throw new Error('Failed to generate roadmap')
      }

      // Generate Pitch Deck PDF from project plan JSON
      setCurrentStep(GenerationStep.PITCH_DECK)
      try {
        const pitchDeckResponse = await fetch('/api/pitch-deck/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectPlan: planData.plan }),
          credentials: 'include',
        })

        if (!pitchDeckResponse.ok) {
          const contentType = pitchDeckResponse.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await pitchDeckResponse.json()
            throw new Error(errorData.error || 'Failed to generate pitch deck')
          } else {
            throw new Error(`Failed to generate pitch deck: ${pitchDeckResponse.statusText}`)
          }
        }

        const pitchDeckBlob = await pitchDeckResponse.blob()
        setPitchDeck(pitchDeckBlob)
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('Pitch Deck generation error:', error)
        throw new Error('Failed to generate pitch deck')
      }

      // Generate Gantt Chart Excel from project plan JSON
      setCurrentStep(GenerationStep.GANTT_CHART)
      try {
        const ganttResponse = await fetch('/api/gantt/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectPlan: planData.plan }),
          credentials: 'include',
        })

        if (!ganttResponse.ok) {
          const contentType = ganttResponse.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await ganttResponse.json()
            throw new Error(errorData.error || 'Failed to generate Gantt chart')
          } else {
            throw new Error(`Failed to generate Gantt chart: ${ganttResponse.statusText}`)
          }
        }

        const ganttBlob = await ganttResponse.blob()
        setGanttChart(ganttBlob)
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('Gantt Chart generation error:', error)
        throw new Error('Failed to generate Gantt chart')
      }

      setCurrentStep(GenerationStep.COMPLETED)
      setGenerationStatus(AssetGenerationStatus.COMPLETED)
    } catch (err) {
      console.error('Error generating assets:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setCurrentStep(GenerationStep.FAILED)
      setGenerationStatus(AssetGenerationStatus.FAILED)
    }
  }

  const getProgressPercentage = () => {
    const steps = Object.values(GenerationStep)
    const activeStepIndex = steps.indexOf(currentStep)
    const totalSteps = steps.length - 3 // Subtract NOT_STARTED, COMPLETED, and FAILED
    if (currentStep === GenerationStep.COMPLETED) return 100
    if (currentStep === GenerationStep.NOT_STARTED) return 0
    if (currentStep === GenerationStep.FAILED) return 0
    return Math.round((activeStepIndex / totalSteps) * 100)
  }

  const handleDownload = (data: Blob, filename: string) => {
    if (!data) {
      console.error('No data available for download')
      return
    }
    
    try {
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col fixed h-full">
        <div className="mb-8">
          <a href="/" className="block">
            <h1 className="text-2xl font-bold text-gray-900 relative inline-block">
              launchbooster.io
              <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/30 
                            transform -rotate-1 translate-y-1"></div>
            </h1>
          </a>
        </div>
        <nav className="space-y-4">
        </nav>
        <div className="mt-auto">
          {user && (
            <div className="text-sm">
              <p className="text-gray-500">Signed in as:</p>
              <p className="text-gray-900 font-medium">{user.email}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 relative inline-block">
                Project Dashboard
                <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/30 
                              transform -rotate-1 translate-y-1"></div>
              </h2>
              <p className="text-gray-500 mt-2">Manage your tools and documents</p>
            </div>
            {generationStatus === AssetGenerationStatus.COMPLETED && (
              <a 
                href="/survey/1"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-500 text-white rounded-lg text-sm font-medium
                         hover:bg-emerald-600 transform hover:scale-105 active:scale-95
                         transition duration-200 ease-in-out shadow-sm"
              >
                <span>Generate New Toolkit</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            )}
          </header>

          {/* Quick Actions */}
          {generationStatus === AssetGenerationStatus.NOT_STARTED && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 relative inline-block">
                  Generate Launch Toolkit
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400/30"></div>
                </h3>
                <p className="mt-2 text-gray-500">Create your complete business launch toolkit with one click</p>
              </div>
              <div className="flex flex-col space-y-4">
                <button
                  onClick={handleGenerateAssets}
                  className="inline-flex items-center justify-center px-6 py-3 bg-emerald-500 
                           text-white rounded-lg text-sm font-medium
                           hover:bg-emerald-600 transform hover:scale-105 active:scale-95
                           transition duration-200 ease-in-out shadow-sm gap-2"
                >
                  <span>Go</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Progress Status */}
          {currentStep !== GenerationStep.NOT_STARTED && 
           currentStep !== GenerationStep.COMPLETED && 
           currentStep !== GenerationStep.FAILED && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Generating Assets
                </h3>
                <p className="mt-2 text-gray-500">{stepMessages[currentStep]}</p>
              </div>
              <div className="relative">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <div className="mt-2 text-sm text-gray-500 text-right">
                  {getProgressPercentage()}% complete
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 rounded-xl p-6 border border-red-200 mb-8">
              <h3 className="text-xl text-red-600 mb-2">Generation Failed</h3>
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {/* Generated Assets */}
          {generationStatus === AssetGenerationStatus.COMPLETED && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 relative inline-block mb-6">
                Your Generated Assets
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400/30"></div>
              </h3>
              <div className="grid gap-4">
                {businessPlan && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Business Plan</h4>
                      <p className="text-sm text-gray-500">Complete breakdown of your business strategy</p>
                    </div>
                    <button
                      onClick={() => handleDownload(businessPlan, 'business-plan.pdf')}
                      className="inline-flex items-center px-4 py-2 bg-white border border-gray-200
                               text-gray-600 rounded-lg text-sm font-medium
                               hover:bg-gray-50 transform hover:scale-105 active:scale-95
                               transition duration-200 ease-in-out shadow-sm gap-2"
                    >
                      <span>Download PDF</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                )}

                {roadmap && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Project Roadmap</h4>
                      <p className="text-sm text-gray-500">Visual timeline of your project milestones</p>
                    </div>
                    <button
                      onClick={() => handleDownload(roadmap, 'roadmap.pdf')}
                      className="inline-flex items-center px-4 py-2 bg-white border border-gray-200
                               text-gray-600 rounded-lg text-sm font-medium
                               hover:bg-gray-50 transform hover:scale-105 active:scale-95
                               transition duration-200 ease-in-out shadow-sm gap-2"
                    >
                      <span>Download PDF</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                )}

                {ganttChart && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Gantt Chart</h4>
                      <p className="text-sm text-gray-500">Detailed project timeline and dependencies</p>
                    </div>
                    <button
                      onClick={() => handleDownload(ganttChart, 'gantt-chart.xlsx')}
                      className="inline-flex items-center px-4 py-2 bg-white border border-gray-200
                               text-gray-600 rounded-lg text-sm font-medium
                               hover:bg-gray-50 transform hover:scale-105 active:scale-95
                               transition duration-200 ease-in-out shadow-sm gap-2"
                    >
                      <span>Download Excel</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                )}

                {pitchDeck && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Pitch Deck</h4>
                      <p className="text-sm text-gray-500">Professional presentation for investors</p>
                    </div>
                    <button
                      onClick={() => handleDownload(pitchDeck, 'pitch-deck.pdf')}
                      className="inline-flex items-center px-4 py-2 bg-white border border-gray-200
                               text-gray-600 rounded-lg text-sm font-medium
                               hover:bg-gray-50 transform hover:scale-105 active:scale-95
                               transition duration-200 ease-in-out shadow-sm gap-2"
                    >
                      <span>Download PDF</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}