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
      // Fetch survey responses from Supabase
      const { data: surveyData, error: surveyError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (surveyError) {
        console.error('Survey fetch error:', surveyError)
        throw new Error('Failed to fetch survey responses')
      }
      if (!surveyData) {
        console.error('No survey data found')
        throw new Error('No survey responses found')
      }

      // Get survey questions to include context
      const surveyQuestions = (await import('@/data/surveyQuestions')).surveyQuestions
      const surveyContext = {
        responses: surveyData,
        questions: surveyQuestions
      }

      console.log('Found survey responses:', surveyData)

      // Generate Business Plan PDF directly from survey responses
      setCurrentStep(GenerationStep.BUSINESS_PLAN)
      try {
        const businessPlanResponse = await fetch('/api/business-plan/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(surveyContext),
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

      // Generate Roadmap PDF directly from survey responses
      setCurrentStep(GenerationStep.ROADMAP)
      try {
        const roadmapResponse = await fetch('/api/roadmap/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(surveyContext),
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

      // Generate Pitch Deck PDF directly from survey responses
      setCurrentStep(GenerationStep.PITCH_DECK)
      try {
        const pitchDeckResponse = await fetch('/api/pitch-deck/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(surveyContext),
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

      // Generate Gantt Chart Excel directly from survey responses
      setCurrentStep(GenerationStep.GANTT_CHART)
      try {
        const ganttResponse = await fetch('/api/gantt/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(surveyContext),
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
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col fixed h-full overflow-y-auto">
        <div className="mb-8">
          <a href="/" className="block">
            <h1 className="text-2xl font-bold text-gray-900 relative inline-block">
              launchbooster.io
              <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/30 
                            transform -rotate-1 translate-y-1"></div>
            </h1>
          </a>
        </div>
        <nav className="space-y-6 flex-1">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tools & Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://www.cursor.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-emerald-500 flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-emerald-500 transition-colors"></span>
                  Cursor AI
                </a>
              </li>
              <li>
                <a 
                  href="https://lovable.dev" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-emerald-500 flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-emerald-500 transition-colors"></span>
                  Lovable.dev
                </a>
              </li>
              <li>
                <a 
                  href="https://v0.dev" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-emerald-500 flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-emerald-500 transition-colors"></span>
                  V0.dev
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Boilerplates</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://github.com/saasbase/open-source-saas-boilerplates" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-emerald-500 flex items-center gap-2 group"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>Complete SaaS Template</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/nextjs-landing-page" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-emerald-500 flex items-center gap-2 group"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>Landing Page Template</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/react-native-boilerplate" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-emerald-500 flex items-center gap-2 group"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>React Native Boilerplate</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/wasp-lang/open-saas" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-emerald-500 flex items-center gap-2 group"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>Open SaaS</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Learning</h3>
            <div className="space-y-4">
              <a 
                href="https://www.youtube.com/watch?v=Th8JoIan4dg" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-emerald-500 flex items-center gap-2 group"
              >
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-emerald-500 transition-colors"></span>
                <span>Evaluating Startup Ideas</span>
              </a>
              <a 
                href="https://www.youtube.com/watch?v=QRZ_l7cVzzU" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-emerald-500 flex items-center gap-2 group"
              >
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-emerald-500 transition-colors"></span>
                <span>Building an MVP</span>
              </a>
              <a 
                href="https://marclou.beehiiv.com/p/how-to-get-your-1st-customer-for-a-micro-saas" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-emerald-500 flex items-center gap-2 group"
              >
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-emerald-500 transition-colors"></span>
                <span>Getting Your First Customer</span>
              </a>
            </div>
          </div>
        </nav>
        <div className="mt-8">
          <a 
            href="https://codefa.st/?via=james" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg 
                     hover:from-orange-100 hover:to-orange-150 transition-colors group mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="font-medium text-gray-900">Can't code?</span>
            </div>
            <p className="text-sm text-gray-600 ml-11">Check out this streamlined course from indie hacking legend, Marc Lou</p>
          </a>

          <div className="pt-6 border-t border-gray-200">
            {user && (
              <div className="text-sm">
                <p className="text-gray-500">Signed in as:</p>
                <p className="text-gray-900 font-medium mt-1">{user.email}</p>
              </div>
            )}
          </div>
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
                  className="inline-flex items-center px-6 py-3 bg-emerald-500 text-white rounded-lg 
                           hover:bg-emerald-600 transition-colors duration-200"
                >
                  <span className="font-medium">Go</span>
                  <span className="ml-2">→</span>
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